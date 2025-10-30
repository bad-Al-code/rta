import { eq } from 'drizzle-orm';

import { db } from '..';
import { USER_CACHE_TTL_SECONDS } from '../../config/constants';
import logger from '../../config/logger';
import { redisConnection } from '../../config/redis';
import { NewUser, User, users } from '../schema';

export class UserRepository {
  /**
   * Finds a single user by their email address, using a cache-aside strategy.
   * @param email The user's email (will be normalized to lowercase).
   * @returns A user object or undefined if not found.
   */
  public static async findByEmail(email: string): Promise<User | undefined> {
    const normalizedEmail = email.toLowerCase().trim();
    const cacheKey = `user:email:${normalizedEmail}`;
    const redisClient = redisConnection.getClient();

    try {
      const cachedUser = await redisClient.get(cacheKey);
      if (cachedUser) {
        return JSON.parse(cachedUser) as User;
      }
    } catch (error) {
      logger.error('Redis cache read error in findByEmail: %o', { error });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (user) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(user), {
          EX: USER_CACHE_TTL_SECONDS,
        });
      } catch (error) {
        logger.error('Redis cache write error in findByEmail: %o', { error });
      }
    }

    return user;
  }

  /**
   * Creates a new user in the database.
   * NOTE: Email should already be normalized to lowercase by the caller.
   * @param newUser An object conforming to the drizzle NewUser type.
   * @returns The newly created user.
   */
  public static async create(newUser: NewUser) {
    const normalizedUser = {
      ...newUser,
      email: newUser.email.toLowerCase().trim(),
    };

    const [createdUser] = await db
      .insert(users)
      .values(normalizedUser)
      .returning();

    return {
      email: createdUser.email,
      name: createdUser.name,
      id: createdUser.id,
    };
  }

  /**
   * Updates a user's data by their ID and invalidates their cache.
   * @param id The UUID of the user to update.
   * @param data An object containing the fields to update (e.g., name).
   * @returns The updated user object.
   */
  public static async update(
    id: string,
    data: Partial<Pick<User, 'name'>>
  ): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (updatedUser) {
      const cacheKey = `user:email:${updatedUser.email}`;

      try {
        await redisConnection.getClient().del(cacheKey);
      } catch (error) {
        logger.error('Redis cache invalidation error: %o', {
          error,
          userId: id,
        });
      }
    }

    return updatedUser;
  }
}
