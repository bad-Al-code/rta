import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import { UserRepository } from '../db/repositories';
import { NewUser } from '../db/schema';
import { BadRequestError, UnauthenticatedError } from '../errors';
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
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await UserRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new BadRequestError('Email is already in use.');
    }

    const passwordHash = await Password.hash(password);

    const user = await UserRepository.create({
      email: normalizedEmail,
      name,
      passwordHash,
    });

    return user;
  }

  /**
   * Authenticates a user and generates a JWT.
   * @param credentials The user's email and password.
   * @returns An object containing the user and the access token.
   */
  public static async login(credentials: { email: string; password: string }) {
    const { email, password } = credentials;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await UserRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new UnauthenticatedError('Invalid credentials');
    }

    const passwordsMatch = await Password.compare(user.passwordHash, password);
    if (!passwordsMatch) {
      throw new UnauthenticatedError('Invalid credentials');
    }

    const userPayload = { id: user.id, email: user.email };
    const accessToken = jwt.sign(userPayload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userResponse } = user;
    return { user: userResponse, accessToken };
  }
}
