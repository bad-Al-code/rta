import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../src/app';
import { db } from '../../src/db';
import { users } from '../../src/db/schema';
import { Password } from '../../src/utils';

describe('PATCH /api/v1/users/me - Update Current User', () => {
  let testUser: {
    id: string;
    email: string;
    name: string;
    password: string;
    accessToken: string;
  };

  beforeEach(async () => {
    await db.delete(users);

    const email = faker.internet.email().toLowerCase();
    const password = 'TestPassword123!';
    const name = faker.person.fullName();
    const passwordHash = await Password.hash(password);

    const [createdUser] = await db
      .insert(users)
      .values({ email, name, passwordHash })
      .returning();

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password });

    testUser = {
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name!,
      password,
      accessToken: loginResponse.body.accessToken,
    };
  });

  afterEach(async () => {
    await db.delete(users);
  });

  describe('Successful update scenarios', () => {
    it('should update user name with valid token and return 200', async () => {
      const newName = faker.person.fullName();

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ name: newName })
        .expect(200);

      expect(response.body.id).toBe(testUser.id);
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.name).toBe(newName);
      expect(response.body.passwordHash).toBeUndefined();

      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, testUser.id),
      });

      expect(dbUser?.name).toBe(newName);
    });

    it('should update name to a longer value', async () => {
      const longName = faker.person.fullName() + ' ' + faker.person.lastName();

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ name: longName })
        .expect(200);

      expect(response.body.name).toBe(longName);
    });

    it('should update name with special characters', async () => {
      const specialName = "O'Brien-Smith Jr.";

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ name: specialName })
        .expect(200);

      expect(response.body.name).toBe(specialName);
    });

    it('should update name with unicode characters', async () => {
      const unicodeName = 'José María González';

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ name: unicodeName })
        .expect(200);

      expect(response.body.name).toBe(unicodeName);
    });

    it('should return correct response structure', async () => {
      const newName = faker.person.fullName();

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ name: newName })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return Content-Type as application/json', async () => {
      const newName = faker.person.fullName();

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ name: newName })
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Authentication failures', () => {
    it('should return 401 when no authorization header is provided', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .send({ name: faker.person.fullName() })
        .expect(401);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain(
        'Authentication invalid'
      );
    });

    it('should return 401 when Bearer prefix is missing', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', testUser.accessToken)
        .send({ name: faker.person.fullName() })
        .expect(401);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('No token provided');
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .send({ name: faker.person.fullName() })
        .expect(401);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain(
        'Token is invalid or expired'
      );
    });

    it('should return 401 for expired token', async () => {
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjIzOTAyMn0.4Adcj0MqTmZbGnfX4xYjXqj5R3lVY7Cj_3VGhS8RzqI';

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send({ name: faker.person.fullName() })
        .expect(401);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 401 for malformed token', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer not-a-jwt-token')
        .send({ name: faker.person.fullName() })
        .expect(401);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 401 for empty Bearer token', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer ')
        .send({ name: faker.person.fullName() })
        .expect(401);

      expect(response.body.errors).toBeDefined();
    });

    // it('should return 401 when user does not exist', async () => {
    //   try {
    //     await db.delete(users).where(eq(users.id, testUser.id));
    //   } catch (error) {
    //     logger.error(`Delete user: %o`, error);
    //   }

    //   const response = await request(app)
    //     .patch('/api/v1/users/me')
    //     .set('Authorization', `Bearer ${testUser.accessToken}`)
    //     .send({ name: faker.person.fullName() })
    //     .expect(401);

    //   expect(response.body.errors).toBeDefined();
    //   expect(response.body.errors[0].message).toContain('User not found');
    // });
  });

  describe('Request body validation', () => {
    it('should return 400 when name is missing', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 when name is empty string', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ name: '' })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Name cannot be empty');
    });

    it('should return 400 when name is only whitespace', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ name: '   ' })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Name cannot be empty');
    });

    it('should return 400 when name is null', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ name: null })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 when name is undefined', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ name: undefined })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 when name is a number', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ name: 123 })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 when name is an object', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ name: { value: 'John Doe' } })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 when name is an array', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ name: ['John', 'Doe'] })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should ignore extra fields in request body', async () => {
      const newName = faker.person.fullName();

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          name: newName,
          email: 'hacker@example.com',
          password: 'newpassword',
          extraField: 'should be ignored',
        })
        .expect(200);

      expect(response.body.name).toBe(newName);
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.extraField).toBeUndefined();
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .set('Content-Type', 'application/json')
        .send('{"name": "John Doe", invalid}')
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Invalid JSON');
    });
  });

  describe('Security edge cases', () => {
    it('should not expose password hash in response', async () => {
      const newName = faker.person.fullName();

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ name: newName })
        .expect(200);

      const responseString = JSON.stringify(response.body);
      expect(responseString).not.toContain('passwordHash');
      expect(responseString).not.toContain('password_hash');
      expect(responseString).not.toContain('$2');
    });

    it('should handle XSS attempt in name', async () => {
      const xssName = '<script>alert("xss")</script>';

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ name: xssName })
        .expect(200);

      expect(response.body.name).toBe(xssName);

      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, testUser.id),
      });
      expect(dbUser?.name).toBe(xssName);
    });

    it('should handle SQL injection attempt in name', async () => {
      const sqlInjection = "'; DROP TABLE users; --";

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ name: sqlInjection })
        .expect(200);

      expect(response.body.name).toBe(sqlInjection);

      const allUsers = await db.query.users.findMany();
      expect(allUsers.length).toBeGreaterThan(0);
    });
  });

  describe('Concurrent update scenarios', () => {
    it('should handle multiple simultaneous update requests', async () => {
      const names = [
        faker.person.fullName(),
        faker.person.fullName(),
        faker.person.fullName(),
      ];

      const requests = names.map((name) =>
        request(app)
          .patch('/api/v1/users/me')
          .set('Authorization', `Bearer ${testUser.accessToken}`)
          .send({ name })
      );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(names).toContain(response.body.name);
      });

      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, testUser.id),
      });

      expect(names).toContain(dbUser?.name);
    });
  });

  describe('Edge cases', () => {
    it('should update name with leading and trailing spaces', async () => {
      const nameWithSpaces = '  John Doe  ';

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ name: nameWithSpaces })
        .expect(200);

      expect(response.body.name).toBe(nameWithSpaces.trim());
    });

    it('should handle very long name', async () => {
      const longName = 'A'.repeat(1000);

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ name: longName })
        .expect(200);

      expect(response.body.name).toBe(longName);
    });

    it('should handle name with newlines', async () => {
      const nameWithNewlines = 'John\nDoe';

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ name: nameWithNewlines })
        .expect(200);

      expect(response.body.name).toBe(nameWithNewlines);
    });

    it('should handle name with tabs', async () => {
      const nameWithTabs = 'John\tDoe';

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ name: nameWithTabs })
        .expect(200);

      expect(response.body.name).toBe(nameWithTabs);
    });
  });
});
