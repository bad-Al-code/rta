import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../src/app';
import { db } from '../../src/db';
import { projects, users } from '../../src/db/schema';
import { TestAuth } from '../helpers/test-auth';

describe('POST /api/v1/projects', () => {
  let auth: TestAuth;
  let user: { id: string; email: string };
  let cookie: string[];

  beforeEach(async () => {
    auth = new TestAuth(app);
    const { user: authUser, cookie: authCookie } = await auth.signupAndLogin();
    user = authUser;
    cookie = authCookie!;
  });

  afterEach(async () => {
    await db.delete(projects);
    await db.delete(users);
  });

  it('should return 401 Unauthorized if no authentication cookie is provided', async () => {
    await request(app)
      .post('/api/v1/projects')
      .send({ name: 'My New Project' })
      .expect(401);
  });

  it('should create a new project for the authenticated user and return 201', async () => {
    const projectName = 'My Awesome Test Project';

    const response = await request(app)
      .post('/api/v1/projects')
      .set('Cookie', cookie)
      .send({ name: projectName })
      .expect(201);

    expect(response.body.project.id).toBeTypeOf('string');
    expect(response.body.project.name).toBe(projectName);
    expect(response.body.project.userId).toBe(user.id);

    const dbProject = await db.query.projects.findFirst({
      where: (projects, { eq }) => eq(projects.id, response.body.project.id),
    });
    expect(dbProject).toBeDefined();
    expect(dbProject?.userId).toBe(user.id);
  });

  it('should return 400 Bad Request if the project name is missing', async () => {
    const response = await request(app)
      .post('/api/v1/projects')
      .set('Cookie', cookie)
      .send({})
      .expect(400);

    expect(response.body.errors[0].message).toContain(
      'Project name is required'
    );
  });
});
