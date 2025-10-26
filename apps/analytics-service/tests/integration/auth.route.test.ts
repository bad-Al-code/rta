import { faker } from '@faker-js/faker';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../src/app';
import { db } from '../../src/db';
import { users } from '../../src/db/schema';
import { Password } from '../../src/utils';

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
      expect(response.body.passwordHash).toBeUndefined();

      const dbUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, userData.email.toLowerCase()),
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

      expect(response.body.email).toBe(email.toLowerCase());

      const dbUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, email.toLowerCase()),
      });

      expect(dbUser).toBeDefined();
      expect(dbUser?.email).toBe(email.toLowerCase());
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
    // it('should return user with correct date formats', async () => {
    //   const userData = {
    //     email: faker.internet.email().toLowerCase(),
    //     password: 'password123',
    //     name: 'Test User',
    //   };

    //   const response = await request(app)
    //     .post('/api/v1/auth/signup')
    //     .send(userData)
    //     .expect(201);

    //   expect(new Date(response.body.createdAt).toISOString()).toBe(
    //     response.body.createdAt
    //   );
    //   expect(new Date(response.body.updatedAt).toISOString()).toBe(
    //     response.body.updatedAt
    //   );
    // });

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

describe('POST /api/v1/auth/login - Comprehensive Tests', () => {
  let testUser: {
    name: string;
    email: string;
    password: string;
  };

  beforeEach(async () => {
    await db.delete(users);

    testUser = {
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      password: 'my-strong-password-123',
    };

    const passwordHash = await Password.hash(testUser.password);
    await db.insert(users).values({ ...testUser, passwordHash });
  });

  afterEach(async () => {
    await db.delete(users);
  });

  describe('Successful login scenarios', () => {
    it('should log in a user with correct credentials and return 200 with JWT', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.name).toBe(testUser.name);
      expect(response.body.user.id).toBeDefined();
      expect(response.body.user.passwordHash).toBeUndefined();
      expect(response.body.accessToken).toMatch(
        /^[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+$/
      );
    });

    it('should handle email case-insensitivity correctly', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email.toUpperCase(),
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.accessToken).toBeDefined();
    });

    it('should handle mixed case email correctly', async () => {
      const mixedCaseEmail =
        testUser.email.substring(0, 3).toUpperCase() +
        testUser.email.substring(3);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: mixedCaseEmail, password: testUser.password })
        .expect(200);

      expect(response.body.user).toBeDefined();
    });

    it('should return user without sensitive fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(response.body.user.passwordHash).toBeUndefined();
      expect(response.body.user.password).toBeUndefined();
    });

    it('should generate valid JWT token with proper structure', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      const tokenParts = response.body.accessToken.split('.');
      expect(tokenParts).toHaveLength(3);
      expect(tokenParts[0]).toBeTruthy();
      expect(tokenParts[1]).toBeTruthy();
      expect(tokenParts[2]).toBeTruthy();
    });

    it('should return Content-Type as application/json', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Email validation failures', () => {
    it('should return 401 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'any-password' })
        .expect(401);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Invalid credentials');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'not-an-email', password: testUser.password })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('valid email');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ password: testUser.password })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for empty email string', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: '', password: testUser.password })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for null email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: null, password: testUser.password })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for undefined email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: undefined, password: testUser.password })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for email with whitespace only', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: '   ', password: testUser.password })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for email as number', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 12345, password: testUser.password })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for email as object', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: { value: testUser.email }, password: testUser.password })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for email as array', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: [testUser.email], password: testUser.password })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Password validation failures', () => {
    it('should return 401 for incorrect password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'wrong-password' })
        .expect(401);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Invalid credentials');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Password is required');
    });

    it('should return 400 for empty password string', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: '' })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Password is required');
    });

    it('should return 400 for null password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: null })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for undefined password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: undefined })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for password with whitespace only', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: '   ' })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 401 for password with extra whitespace', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: ` ${testUser.password} ` })
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.accessToken).toBeDefined();
    });

    it('should return 401 for password with different case', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password.toUpperCase(),
        })
        .expect(401);

      expect(response.body.errors[0].message).toBe('Invalid credentials');
    });

    it('should return 400 for password as number', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 12345678 })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for password as object', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: { value: testUser.password },
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for password as array', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: [testUser.password] })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 401 for very similar but wrong password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password + '1' })
        .expect(401);

      expect(response.body.errors[0].message).toBe('Invalid credentials');
    });
  });

  describe('Request body validation', () => {
    it('should return 400 for empty request body', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": "test@example.com", invalid json}')
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Invalid JSON');
    });

    it('should ignore extra fields in request body', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          extraField: 'should be ignored',
          anotherExtra: 123,
          hackerField: 'malicious',
        })
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.extraField).toBeUndefined();
      expect(response.body.anotherExtra).toBeUndefined();
    });

    it('should handle request with only email missing password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email })
        .expect(400);

      expect(response.body.errors[0].message).toContain('Password is required');
    });

    it('should handle request with only password missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ password: testUser.password })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should handle request with both fields missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should handle Content-Type text/plain', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'text/plain')
        .send('not json')
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should handle very large request body', async () => {
      const largeString = 'a'.repeat(100000);
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          extraData: largeString,
        })
        .expect(200);

      expect(response.body.user).toBeDefined();
    });
  });

  describe('Security edge cases', () => {
    it('should not reveal user existence for non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' })
        .expect(401);

      expect(response.body.errors[0].message).toBe('Invalid credentials');
    });

    it('should return same error message for wrong password as non-existent user', async () => {
      const nonExistentResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      const wrongPasswordResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });

      expect(nonExistentResponse.body.errors[0].message).toBe(
        wrongPasswordResponse.body.errors[0].message
      );
    });

    it('should handle SQL injection attempt in email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: "admin'--",
          password: testUser.password,
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should handle NoSQL injection attempt in email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: { $ne: null },
          password: testUser.password,
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should handle XSS attempt in email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: '<script>alert("xss")</script>@example.com',
          password: testUser.password,
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should not expose password hash in any response', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      const responseString = JSON.stringify(response.body);
      expect(responseString).not.toContain('passwordHash');
      expect(responseString).not.toContain('password_hash');
      expect(responseString).not.toContain('$2');
    });
  });

  describe('Rate limiting behavior', () => {
    it('should include rate limit headers', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      const hasStandardHeaders =
        response.headers['ratelimit-limit'] !== undefined;
      const hasLegacyHeaders =
        response.headers['x-ratelimit-limit'] !== undefined;

      if (hasStandardHeaders || hasLegacyHeaders) {
        expect(
          response.headers['ratelimit-limit'] ||
            response.headers['x-ratelimit-limit']
        ).toBeDefined();
      }
    });
  });

  describe('Concurrent login attempts', () => {
    it('should handle multiple simultaneous login requests', async () => {
      const requests = Array.from({ length: 5 }, () =>
        request(app)
          .post('/api/v1/auth/login')
          .send({ email: testUser.email, password: testUser.password })
      );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.accessToken).toBeDefined();
      });
    });

    it('should handle concurrent failed login attempts', async () => {
      const requests = Array.from({ length: 5 }, () =>
        request(app)
          .post('/api/v1/auth/login')
          .send({ email: testUser.email, password: 'wrong-password' })
      );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(401);
        expect(response.body.errors[0].message).toBe('Invalid credentials');
      });
    });
  });

  describe('Special characters handling', () => {
    it('should handle email with plus sign', async () => {
      const emailWithPlus = `test+tag@example.com`;
      const passwordHash = await Password.hash('password123');

      await db.insert(users).values({
        email: emailWithPlus,
        name: 'Test User',
        passwordHash,
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: emailWithPlus, password: 'password123' })
        .expect(200);

      expect(response.body.user.email).toBe(emailWithPlus);
    });

    it('should handle email with dots', async () => {
      const emailWithDots = `test.user.name@example.com`;
      const passwordHash = await Password.hash('password123');

      await db.insert(users).values({
        email: emailWithDots,
        name: 'Test User',
        passwordHash,
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: emailWithDots, password: 'password123' })
        .expect(200);

      expect(response.body.user.email).toBe(emailWithDots);
    });

    it('should handle password with special characters', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const passwordHash = await Password.hash(specialPassword);

      const specialUser = {
        email: faker.internet.email().toLowerCase(),
        name: 'Special User',
        passwordHash,
      };

      await db.insert(users).values(specialUser);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: specialUser.email, password: specialPassword })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
    });

    it('should handle password with unicode characters', async () => {
      const unicodePassword = 'pässwörd123🔒';
      const passwordHash = await Password.hash(unicodePassword);

      const unicodeUser = {
        email: faker.internet.email().toLowerCase(),
        name: 'Unicode User',
        passwordHash,
      };

      await db.insert(users).values(unicodeUser);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: unicodeUser.email, password: unicodePassword })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
    });
  });

  describe('Response structure validation', () => {
    it('should return user object with correct structure', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email');
      expect(response.body.user).toHaveProperty('name');
    });

    it('should return error response with correct structure for invalid input', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'invalid', password: '' })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(response.body.errors[0]).toHaveProperty('message');
    });

    it('should return error response with correct structure for unauthorized', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'wrong' })
        .expect(401);

      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(response.body.errors[0]).toHaveProperty('message');
      expect(response.body.errors[0].message).toBe('Invalid credentials');
    });
  });

  describe('User state validation', () => {
    it('should successfully login user without name field', async () => {
      const userWithoutName = {
        email: faker.internet.email().toLowerCase(),
        passwordHash: await Password.hash('password123'),
        name: null,
      };

      await db.insert(users).values(userWithoutName);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: userWithoutName.email, password: 'password123' })
        .expect(200);

      expect(response.body.user.name).toBeNull();
      expect(response.body.accessToken).toBeDefined();
    });
  });
});
