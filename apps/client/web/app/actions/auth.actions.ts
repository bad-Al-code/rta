import axios from 'axios';
import { apiClient } from '../../lib/api/client';
import { LoginInput } from '../../lib/validators/auth';

type LoginResponse = {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: 'guest' | 'admin';
  };
};

type ApiErrorResponse = {
  errors: { message: string }[];
};

export const loginAction = async (data: LoginInput): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<LoginResponse>(
      '/api/v1/auth/login',
      data
    );

    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const apiError = error.response.data as ApiErrorResponse;
        if (apiError.errors && apiError.errors.length > 0) {
          throw new Error(apiError.errors[0].message);
        }
      }
    }
    throw new Error('Login failed. Please try again.');
  }
};
