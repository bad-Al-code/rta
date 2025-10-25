import { eq } from 'drizzle-orm';

import { db } from '..';
import { NewUser, User, users } from '../schema';

export class UserRepository {
  /**
   * Finds a single user by their email address.
   * @param email The user's email.
   * @returns A user object or undefined if not found.
   */
  public static async findByEmail(email: string): Promise<User | undefined> {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    return user;
  }

  /**
   * Creates a new user in the databse.
   * @param newUser An object conforming to the drizzle NewUser type.
   * @returns The newly created user.
   */
  public static async create(newUser: NewUser) {
    const [createdUser] = await db.insert(users).values(newUser).returning();

    //     return createdUser:  {
    //     email: string;
    //     name: string | null;
    //     id: string;
    //     passwordHash: string;
    //     createdAt: Date;
    //     updatedAt: Date;
    // }

    return {
      email: createdUser.email,
      name: createdUser.name,
      id: createdUser.id,
      createdAt: createdUser.createdAt,
      updatedAt: createdUser.updatedAt,
    };
  }
}
