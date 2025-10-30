import { UserRepository } from '../db/repositories';
import { User } from '../db/schema';

export class UserService {
  public static async updateUser(
    userId: string,
    data: Partial<Pick<User, 'name'>>
  ): Promise<Omit<User, 'passwordHash'>> {
    const updatedUser = await UserRepository.update(userId, data);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userResponse } = updatedUser;

    return userResponse;
  }
}
