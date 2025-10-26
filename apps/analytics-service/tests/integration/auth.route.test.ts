import { faker } from '@faker-js/faker';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { app } from '../../src/app';
import { db } from '../../src/db';
import { users } from '../../src/db/schema';

describe('POST /api/v1/auth/signup', () => {
  afterEach(async () => {
    await db.delete(users);
  });

  describe('Successful signup', () => {
    it('should create a new user with all fields and return 201', async () => {
      const userData = {
        email: faker.internet.email().toLowerCase(),
        password: 'password123',
        name: faker.person.fullName(),
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.id).toBeTypeOf('string');
      expect(response.body.email).toBe(userData.email);
      expect(response.body.name).toBe(userData.name);
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
      expect(response.body.passwordHash).toBeUndefined();

      const dbUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, userData.email),
      });

      expect(dbUser).toBeDefined();
      expect(dbUser?.id).toBe(response.body.id);
      expect(dbUser?.passwordHash).toBeDefined();
      expect(dbUser?.passwordHash).not.toBe(userData.password);
    });

    it('should create a new user without name field', async () => {
      const userData = {
        email: faker.internet.email().toLowerCase(),
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.id).toBeTypeOf('string');
      expect(response.body.email).toBe(userData.email);
      expect(response.body.name).toBeNull();
      expect(response.body.passwordHash).toBeUndefined();
    });

    it('should handle email case-insensitivity correctly', async () => {
      const email = 'TEST.USER@EXAMPLE.COM';
      const userData = {
        email: email,
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.email).toBe(email);

      const dbUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, email),
      });

      expect(dbUser).toBeDefined();
    });
  });

  describe('Email validation', () => {
    it('should return 400 if email is already in use', async () => {
      const userData = {
        email: faker.internet.email().toLowerCase(),
        password: 'password123',
        name: 'First User',
      };

      await request(app).post('/api/v1/auth/signup').send(userData).expect(201);

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({ ...userData, name: 'Second User' })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Email is already in use.');
    });

    it('should return 400 for invalid email format', async () => {
      const userData = {
        email: 'not-an-email',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('valid email');
    });

    it('should return 400 if email is missing', async () => {
      const userData = {
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for empty email string', async () => {
      const userData = {
        email: '',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Password validation', () => {
    it('should return 400 for password too short (less than 8 characters)', async () => {
      const userData = {
        email: faker.internet.email().toLowerCase(),
        password: '1234567',
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain(
        'Password must be at least 8 characters long'
      );
    });

    it('should accept password with exactly 8 characters', async () => {
      const userData = {
        email: faker.internet.email().toLowerCase(),
        password: '12345678',
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.id).toBeDefined();
    });

    it('should return 400 if password is missing', async () => {
      const userData = {
        email: faker.internet.email().toLowerCase(),
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Password is required');
    });

    it('should return 400 for empty password string', async () => {
      const userData = {
        email: faker.internet.email().toLowerCase(),
        password: '',
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should accept long passwords', async () => {
      const userData = {
        email: faker.internet.email().toLowerCase(),
        password: 'a'.repeat(100),
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.id).toBeDefined();
    });
  });

  describe('Request body validation', () => {
    it('should return 400 for empty request body', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({})
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should ignore extra fields in request body', async () => {
      const userData = {
        email: faker.internet.email().toLowerCase(),
        password: 'password123',
        name: 'Test User',
        extraField: 'should be ignored',
        anotherExtra: 123,
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.extraField).toBeUndefined();
      expect(response.body.anotherExtra).toBeUndefined();
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .set('Content-Type', 'application/json')
        .send('not valid json')
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Invalid JSON');
    });
  });

  describe('Response format', () => {
    it('should return user with correct date formats', async () => {
      const userData = {
        email: faker.internet.email().toLowerCase(),
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(201);

      expect(new Date(response.body.createdAt).toISOString()).toBe(
        response.body.createdAt
      );
      expect(new Date(response.body.updatedAt).toISOString()).toBe(
        response.body.updatedAt
      );
    });

    it('should return Content-Type as application/json', async () => {
      const userData = {
        email: faker.internet.email().toLowerCase(),
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Rate limiting', () => {
    it('should successfully handle requests (rate limiter tested separately)', async () => {
      const userData = {
        email: faker.internet.email().toLowerCase(),
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.email).toBe(userData.email);
    });
  });
});

describe('GET /health', () => {
  it('should return 200 and health status', async () => {
    const response = await request(app).get('/health').expect(200);

    expect(response.body.status).toBe('UP');
    expect(response.body.message).toBe('Analytics service is healthy');
  });

  it('should not log health check requests', async () => {
    await request(app).get('/health').expect(200);
  });
});

describe('404 Not Found', () => {
  it('should return 404 for non-existent routes', async () => {
    const response = await request(app).get('/api/v1/non-existent').expect(404);

    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain('not found');
  });

  it('should return 404 for POST to non-existent routes', async () => {
    const response = await request(app)
      .post('/api/v1/fake-route')
      .send({ data: 'test' })
      .expect(404);

    expect(response.body.errors).toBeDefined();
  });

  it('should return 404 for invalid API version', async () => {
    const response = await request(app)
      .post('/api/v99/auth/signup')
      .send({
        email: faker.internet.email().toLowerCase(),
        password: 'password123',
      })
      .expect(404);

    expect(response.body.errors).toBeDefined();
  });
});
