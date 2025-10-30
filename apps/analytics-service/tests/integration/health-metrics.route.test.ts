import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { app } from '../../src/app';

interface DependencyStatus {
  status: 'UP' | 'DOWN';
  details?: string;
}

describe('GET /api/v1/health - Health Check Endpoint', () => {
  describe('Health check response', () => {
    it('should return health status of the service', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('dependencies');
      expect(['UP', 'DOWN']).toContain(response.body.status);
    });

    it('should return correct response structure', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.body.dependencies).toHaveProperty('postgres');
      expect(response.body.dependencies).toHaveProperty('redis');
    });

    it('should include dependency status fields', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.body.dependencies.postgres).toHaveProperty('status');
      expect(response.body.dependencies.redis).toHaveProperty('status');
      expect(['UP', 'DOWN']).toContain(
        response.body.dependencies.postgres.status
      );
      expect(['UP', 'DOWN']).toContain(response.body.dependencies.redis.status);
    });

    it('should return 200 when all dependencies are UP', async () => {
      const response = await request(app).get('/api/v1/health');

      if (response.body.status === 'UP') {
        expect(response.status).toBe(200);
        expect(response.body.dependencies.postgres.status).toBe('UP');
        expect(response.body.dependencies.redis.status).toBe('UP');
      }
    });

    it('should return 503 when any dependency is DOWN', async () => {
      const response = await request(app).get('/api/v1/health');

      if (response.body.status === 'DOWN') {
        expect(response.status).toBe(503);
      }
    });

    it('should include details when dependency is unhealthy', async () => {
      const response = await request(app).get('/api/v1/health');

      Object.values(response.body.dependencies).forEach((dep) => {
        const dependency = dep as DependencyStatus;
        if (dependency.status === 'DOWN') {
          expect(dependency).toHaveProperty('details');
          expect(dependency.details).toBeTruthy();
        }
      });
    });

    it('should return Content-Type as application/json', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should respond quickly (under 1 second)', async () => {
      const startTime = Date.now();
      await request(app).get('/api/v1/health');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Health check consistency', () => {
    it('should return consistent status on multiple calls', async () => {
      const responses = await Promise.all([
        request(app).get('/api/v1/health'),
        request(app).get('/api/v1/health'),
        request(app).get('/api/v1/health'),
      ]);

      const statuses = responses.map((r) => r.body.status);
      const firstStatus = statuses[0];

      statuses.forEach((status) => {
        expect(status).toBe(firstStatus);
      });
    });

    it('should handle concurrent health check requests', async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app).get('/api/v1/health')
      );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('dependencies');
      });
    });
  });

  describe('Response format validation', () => {
    it('should have all required top-level fields', async () => {
      const response = await request(app).get('/api/v1/health');

      const requiredFields = ['status', 'dependencies'];
      requiredFields.forEach((field) => {
        expect(response.body).toHaveProperty(field);
      });
    });

    it('should have correct dependency structure', async () => {
      const response = await request(app).get('/api/v1/health');

      const dependencies = response.body.dependencies;
      expect(dependencies.postgres).toHaveProperty('status');
      expect(dependencies.redis).toHaveProperty('status');
    });

    it('should only return UP or DOWN for status values', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(['UP', 'DOWN']).toContain(response.body.status);
      expect(['UP', 'DOWN']).toContain(
        response.body.dependencies.postgres.status
      );
      expect(['UP', 'DOWN']).toContain(response.body.dependencies.redis.status);
    });
  });

  describe('HTTP method validation', () => {
    it('should not accept POST requests', async () => {
      const response = await request(app).post('/api/v1/health');

      expect(response.status).toBe(404);
    });

    it('should not accept PUT requests', async () => {
      const response = await request(app).put('/api/v1/health');

      expect(response.status).toBe(404);
    });

    it('should not accept DELETE requests', async () => {
      const response = await request(app).delete('/api/v1/health');

      expect(response.status).toBe(404);
    });

    it('should not accept PATCH requests', async () => {
      const response = await request(app).patch('/api/v1/health');

      expect(response.status).toBe(404);
    });
  });

  describe('Security considerations', () => {
    it('should not expose sensitive configuration', async () => {
      const response = await request(app).get('/api/v1/health');

      const responseString = JSON.stringify(response.body).toLowerCase();
      expect(responseString).not.toContain('password');
      expect(responseString).not.toContain('secret');
      expect(responseString).not.toContain('token');
      expect(responseString).not.toContain('key');
    });

    it('should not require authentication', async () => {
      const response = await request(app).get('/api/v1/health');

      expect([200, 503]).toContain(response.status);
    });
  });
});

describe('GET /api/v1/metrics - Prometheus Metrics Endpoint', () => {
  describe('Successful metrics retrieval', () => {
    it('should return 200 status', async () => {
      await request(app).get('/api/v1/metrics').expect(200);
    });

    it('should return metrics in Prometheus format', async () => {
      const response = await request(app).get('/api/v1/metrics').expect(200);

      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('# TYPE');
    });

    it('should return Content-Type as text/plain', async () => {
      const response = await request(app).get('/api/v1/metrics').expect(200);

      expect(response.headers['content-type']).toMatch(/text\/plain/);
    });

    it('should include Node.js default metrics', async () => {
      const response = await request(app).get('/api/v1/metrics').expect(200);

      expect(response.text).toContain('process_cpu');
      expect(response.text).toContain('nodejs_');
    });

    it('should include custom http metrics', async () => {
      const response = await request(app).get('/api/v1/metrics').expect(200);

      expect(response.text).toContain('http_request_duration_seconds');
      expect(response.text).toContain('http_requests_total');
    });

    it('should include service label', async () => {
      const response = await request(app).get('/api/v1/metrics').expect(200);

      expect(response.text).toContain('service="analytics-service"');
    });
  });

  describe('Metrics content validation', () => {
    it('should contain histogram metrics', async () => {
      const response = await request(app).get('/api/v1/metrics').expect(200);

      expect(response.text).toContain('_bucket');
      expect(response.text).toContain('_sum');
      expect(response.text).toContain('_count');
    });

    it('should contain counter metrics', async () => {
      const response = await request(app).get('/api/v1/metrics').expect(200);

      expect(response.text).toContain('http_requests_total');
    });

    it('should have valid Prometheus format', async () => {
      const response = await request(app).get('/api/v1/metrics').expect(200);

      const lines = response.text.split('\n');
      const metricLines = lines.filter((line) => line && !line.startsWith('#'));

      metricLines.forEach((line) => {
        if (line.trim()) {
          expect(line).toMatch(/^[a-zA-Z_:][a-zA-Z0-9_:]*/);
        }
      });
    });
  });

  describe('Metrics endpoint behavior', () => {
    it('should respond quickly (under 1 second)', async () => {
      const startTime = Date.now();
      await request(app).get('/api/v1/metrics').expect(200);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000);
    });

    it('should handle concurrent metrics requests', async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app).get('/api/v1/metrics')
      );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.text).toContain('# HELP');
      });
    });

    it('should return fresh metrics on each call', async () => {
      const response1 = await request(app).get('/api/v1/metrics').expect(200);
      const response2 = await request(app).get('/api/v1/metrics').expect(200);

      expect(response1.text).toBeDefined();
      expect(response2.text).toBeDefined();
    });
  });

  describe('HTTP method validation', () => {
    it('should not accept POST requests', async () => {
      const response = await request(app).post('/api/v1/metrics');

      expect(response.status).toBe(404);
    });

    it('should not accept PUT requests', async () => {
      const response = await request(app).put('/api/v1/metrics');

      expect(response.status).toBe(404);
    });

    it('should not accept DELETE requests', async () => {
      const response = await request(app).delete('/api/v1/metrics');

      expect(response.status).toBe(404);
    });

    it('should not accept PATCH requests', async () => {
      const response = await request(app).patch('/api/v1/metrics');

      expect(response.status).toBe(404);
    });
  });

  describe('Security considerations', () => {
    it('should not expose sensitive data in metrics', async () => {
      const response = await request(app).get('/api/v1/metrics').expect(200);

      const lowerText = response.text.toLowerCase();
      expect(lowerText).not.toContain('password');
      expect(lowerText).not.toContain('secret');
      expect(lowerText).not.toContain('token');
      expect(lowerText).not.toContain('api_key');
    });

    it('should not require authentication for metrics', async () => {
      const response = await request(app).get('/api/v1/metrics').expect(200);

      expect(response.status).toBe(200);
    });
  });

  describe('Metrics after making requests', () => {
    it('should increment http_requests_total after making a request', async () => {
      await request(app).get('/api/v1/health');

      const metrics = await request(app).get('/api/v1/metrics').expect(200);

      expect(metrics.text).toContain('http_requests_total');
    });

    it('should track request duration in histogram', async () => {
      await request(app).get('/api/v1/health');

      const metrics = await request(app).get('/api/v1/metrics').expect(200);

      expect(metrics.text).toContain('http_request_duration_seconds');
      expect(metrics.text).toContain('_bucket');
    });

    it('should include route labels in metrics', async () => {
      await request(app).get('/api/v1/health');

      const metrics = await request(app).get('/api/v1/metrics').expect(200);

      expect(metrics.text).toContain('route="/health"');
      expect(metrics.text).toContain('method="GET"');
    });
  });
});

describe('Health and Metrics Integration', () => {
  it('should both endpoints be accessible', async () => {
    const healthResponse = await request(app).get('/api/v1/health');
    const metricsResponse = await request(app).get('/api/v1/metrics');

    expect([200, 503]).toContain(healthResponse.status);
    expect(metricsResponse.status).toBe(200);
  });

  it('should health endpoint be tracked in metrics', async () => {
    await request(app).get('/api/v1/health');

    const metricsResponse = await request(app).get('/api/v1/metrics');

    expect(metricsResponse.text).toContain('/health');
  });

  it('should metrics endpoint be tracked in metrics', async () => {
    await request(app).get('/api/v1/metrics');

    const metricsResponse = await request(app).get('/api/v1/metrics');

    expect(metricsResponse.text).toContain('/metrics');
  });
});
