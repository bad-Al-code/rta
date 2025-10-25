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
}
