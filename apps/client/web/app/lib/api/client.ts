import axios, { AxiosInstance } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
      withCredentials: true,
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  public async get<T>(path: string): Promise<T> {
    const response = await this.client.get<T>(path);
    return response.data;
  }

  public async post<T>(path: string, data: unknown): Promise<T> {
    const response = await this.client.post<T>(path, data);
    return response.data;
  }

  public async patch<T>(path: string, data: unknown): Promise<T> {
    const response = await this.client.patch<T>(path, data);
    return response.data;
  }

  public async delete<T>(path: string): Promise<T> {
    const response = await this.client.delete<T>(path);
    return response.data;
  }
}

export const apiClient = new ApiClient();
