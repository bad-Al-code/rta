import { eq } from 'drizzle-orm';

import { db } from '..';
import { NewUser, User, users } from '../schema';

export class UserRepository {
  /**
   * Finds a single user by their email address.
   * Email is stored in lowercase in the database, so we normalize before querying.
   * @param email The user's email (will be normalized to lowercase).
   * @returns A user object or undefined if not found.
   */
  public static async findByEmail(email: string): Promise<User | undefined> {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

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
}
