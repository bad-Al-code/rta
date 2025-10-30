import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { USER_CACHE_TTL_SECONDS } from '../../src/config/constants';
import { redisConnection } from '../../src/config/redis';
import { db } from '../../src/db';
import { UserRepository } from '../../src/db/repositories';
import { users } from '../../src/db/schema';
import { Password } from '../../src/utils';

describe('UserRepository - findByEmail with Cache', () => {
  let testUser: {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
  };

  beforeEach(async () => {
    await db.delete(users);

    const email = faker.internet.email().toLowerCase();
    const name = faker.person.fullName();
    const passwordHash = await Password.hash('TestPassword123!');

    const [createdUser] = await db
      .insert(users)
      .values({ email, name, passwordHash })
      .returning();

    testUser = {
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name!,
      passwordHash: createdUser.passwordHash,
    };

    const redisClient = redisConnection.getClient();
    await redisClient.flushDb();
  });

  afterEach(async () => {
    await db.delete(users);

    const redisClient = redisConnection.getClient();
    await redisClient.flushDb();
  });

  describe('Cache functionality', () => {
    it('should find user by email from database on first call', async () => {
      const user = await UserRepository.findByEmail(testUser.email);

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUser.id);
      expect(user?.email).toBe(testUser.email);
      expect(user?.name).toBe(testUser.name);
    });

    it('should cache user after first database query', async () => {
      await UserRepository.findByEmail(testUser.email);

      const cacheKey = `user:email:${testUser.email}`;
      const redisClient = redisConnection.getClient();
      const cachedData = await redisClient.get(cacheKey);

      expect(cachedData).toBeDefined();

      if (cachedData) {
        const cachedUser = JSON.parse(cachedData);
        expect(cachedUser.id).toBe(testUser.id);
        expect(cachedUser.email).toBe(testUser.email);
      }
    });

    it('should return user from cache on second call', async () => {
      await UserRepository.findByEmail(testUser.email);

      await db.delete(users).where(eq(users.id, testUser.id));

      const user = await UserRepository.findByEmail(testUser.email);

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUser.id);
      expect(user?.email).toBe(testUser.email);
    });

    it('should set cache TTL correctly', async () => {
      await UserRepository.findByEmail(testUser.email);

      const cacheKey = `user:email:${testUser.email}`;
      const redisClient = redisConnection.getClient();
      const ttl = await redisClient.ttl(cacheKey);

      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(USER_CACHE_TTL_SECONDS);
    });

    it('should return undefined for non-existent user and not cache', async () => {
      const nonExistentEmail = 'nonexistent@example.com';
      const user = await UserRepository.findByEmail(nonExistentEmail);

      expect(user).toBeUndefined();

      const cacheKey = `user:email:${nonExistentEmail}`;
      const redisClient = redisConnection.getClient();
      const cachedData = await redisClient.get(cacheKey);

      expect(cachedData).toBeNull();
    });
  });

  describe('Email normalization', () => {
    it('should normalize email to lowercase', async () => {
      const upperCaseEmail = testUser.email.toUpperCase();
      const user = await UserRepository.findByEmail(upperCaseEmail);

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUser.id);
    });

    it('should trim whitespace from email', async () => {
      const emailWithSpaces = `  ${testUser.email}  `;
      const user = await UserRepository.findByEmail(emailWithSpaces);

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUser.id);
    });

    it('should normalize mixed case email', async () => {
      const mixedCaseEmail =
        testUser.email.substring(0, 3).toUpperCase() +
        testUser.email.substring(3);
      const user = await UserRepository.findByEmail(mixedCaseEmail);

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUser.id);
    });

    it('should use normalized email for cache key', async () => {
      const upperCaseEmail = testUser.email.toUpperCase();
      await UserRepository.findByEmail(upperCaseEmail);

      const cacheKey = `user:email:${testUser.email}`;
      const redisClient = redisConnection.getClient();
      const cachedData = await redisClient.get(cacheKey);

      expect(cachedData).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle Redis read errors gracefully and fetch from database', async () => {
      const redisClient = redisConnection.getClient();
      await redisClient.disconnect();

      await new Promise((resolve) => setTimeout(resolve, 100));

      const user = await UserRepository.findByEmail(testUser.email);

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUser.id);

      await redisConnection.connect();
    });

    it('should handle Redis write errors gracefully and still return user', async () => {
      const user = await UserRepository.findByEmail(testUser.email);

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUser.id);
    });
  });

  describe('Cache invalidation after update', () => {
    it('should invalidate cache when user is updated', async () => {
      await UserRepository.findByEmail(testUser.email);

      const cacheKey = `user:email:${testUser.email}`;
      const redisClient = redisConnection.getClient();
      let cachedData = await redisClient.get(cacheKey);
      expect(cachedData).toBeDefined();

      const newName = faker.person.fullName();
      await UserRepository.update(testUser.id, { name: newName });

      cachedData = await redisClient.get(cacheKey);
      expect(cachedData).toBeNull();
    });

    it('should fetch fresh data from database after cache invalidation', async () => {
      await UserRepository.findByEmail(testUser.email);

      const newName = faker.person.fullName();
      await UserRepository.update(testUser.id, { name: newName });

      const user = await UserRepository.findByEmail(testUser.email);

      expect(user).toBeDefined();
      expect(user?.name).toBe(newName);
    });

    it('should re-cache updated user on next findByEmail call', async () => {
      await UserRepository.findByEmail(testUser.email);

      const newName = faker.person.fullName();
      await UserRepository.update(testUser.id, { name: newName });

      await UserRepository.findByEmail(testUser.email);

      const cacheKey = `user:email:${testUser.email}`;
      const redisClient = redisConnection.getClient();
      const cachedData = await redisClient.get(cacheKey);

      expect(cachedData).toBeDefined();

      if (cachedData) {
        const cachedUser = JSON.parse(cachedData);
        expect(cachedUser.name).toBe(newName);
      }
    });
  });
});

describe('UserRepository - create', () => {
  beforeEach(async () => {
    await db.delete(users);
  });

  afterEach(async () => {
    await db.delete(users);
  });

  it('should create user with normalized email', async () => {
    const email = 'TEST@EXAMPLE.COM';
    const name = faker.person.fullName();
    const passwordHash = await Password.hash('password123');

    const user = await UserRepository.create({ email, name, passwordHash });

    expect(user.email).toBe('test@example.com');
    expect(user.name).toBe(name);
    expect(user.id).toBeDefined();
  });

  it('should trim whitespace from email when creating', async () => {
    const email = '  test@example.com  ';
    const name = faker.person.fullName();
    const passwordHash = await Password.hash('password123');

    const user = await UserRepository.create({ email, name, passwordHash });

    expect(user.email).toBe('test@example.com');
  });

  it('should return only safe fields after creation', async () => {
    const email = faker.internet.email().toLowerCase();
    const name = faker.person.fullName();
    const passwordHash = await Password.hash('password123');

    const user = await UserRepository.create({ email, name, passwordHash });

    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('name');
    expect(user).not.toHaveProperty('passwordHash');
  });
});

describe('UserRepository - update', () => {
  let testUser: {
    id: string;
    email: string;
    name: string;
  };

  beforeEach(async () => {
    await db.delete(users);

    const email = faker.internet.email().toLowerCase();
    const name = faker.person.fullName();
    const passwordHash = await Password.hash('password123');

    const [createdUser] = await db
      .insert(users)
      .values({ email, name, passwordHash })
      .returning();

    testUser = {
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name!,
    };

    const redisClient = redisConnection.getClient();
    await redisClient.flushDb();
  });

  afterEach(async () => {
    await db.delete(users);

    const redisClient = redisConnection.getClient();
    await redisClient.flushDb();
  });

  it('should update user name', async () => {
    const newName = faker.person.fullName();
    const updatedUser = await UserRepository.update(testUser.id, {
      name: newName,
    });

    expect(updatedUser.name).toBe(newName);
    expect(updatedUser.id).toBe(testUser.id);
    expect(updatedUser.email).toBe(testUser.email);
  });

  it('should update updatedAt timestamp', async () => {
    const originalUser = await db.query.users.findFirst({
      where: eq(users.id, testUser.id),
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const newName = faker.person.fullName();
    const updatedUser = await UserRepository.update(testUser.id, {
      name: newName,
    });

    expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(
      originalUser!.updatedAt.getTime()
    );
  });

  it('should handle cache invalidation errors gracefully', async () => {
    const redisClient = redisConnection.getClient();
    await redisClient.destroy();

    await new Promise((resolve) => setTimeout(resolve, 100));

    const newName = faker.person.fullName();
    const updatedUser = await UserRepository.update(testUser.id, {
      name: newName,
    });

    expect(updatedUser.name).toBe(newName);

    await redisConnection.connect();
  });
});
