import bcrypt from 'bcryptjs';

import { SALT } from '../config/constants';

export class Password {
  /**
   * Hashes a plaontext password.
   * @param password The plaintext password.
   * @returns A promise that resolves to the hashed password.
   */
  static async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(SALT);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compares a plaintext password with a stored hash.
   * @param storedHash The hashed password from the database.
   * @param suppliedPassword The plaintext password from the user.
   * @returns A promise that resolves to true if the passwords match.
   */
  static async compare(
    storedHash: string,
    suppliedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(suppliedPassword, storedHash);
  }
}
