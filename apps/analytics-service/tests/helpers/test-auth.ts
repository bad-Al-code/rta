import { faker } from '@faker-js/faker';
import type { Application } from 'express';
import request from 'supertest';

export class TestAuth {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  async signupAndLogin() {
    const userData = {
      email: faker.internet.email().toLowerCase(),
      password: 'password123',
    };

    const response = await request(this.app)
      .post('/api/v1/auth/signup')
      .send(userData)
      .expect(201);

    const cookie = response.get('Set-Cookie');
    const user = response.body.user;

    return { user, cookie };
  }
}
