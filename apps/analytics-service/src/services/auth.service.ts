import { UserRepository } from '../db/repositories';
import { NewUser } from '../db/schema';
import { BadRequestError } from '../errors';
import { Password } from '../utils';

export class AuthService {
  /**
   * Registers a new user.
   * @param userData The user's data (name, email, password)
   * @returns The newly created user record.
   */
  public static async signup(
    userData: Omit<NewUser, 'passwordHash'> & { password: string }
  ) {
    const { email, name, password } = userData;
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw new BadRequestError('Email is already in use.');
    }

    const passwordHash = await Password.hash(password);

    const user = await UserRepository.create({ email, name, passwordHash });

    return user;
  }
}
