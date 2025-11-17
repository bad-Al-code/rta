import { eq } from 'drizzle-orm';

import { db } from '..';
import { NewProject, Project, projects } from '../schema';

export class ProjectRepository {
  /**
   * Creates a new project in the database.
   * @param newProject An object containing the project's name and the owner's userId.
   * @returns The newly created project.
   */
  public static async create(newProject: NewProject): Promise<Project> {
    const [createdProject] = await db
      .insert(projects)
      .values(newProject)
      .returning();

    return createdProject;
  }

  /**
   * Finds all projects owned by a specific user.
   * @param userId The ID of the user.
   * @returns An array of projects.
   */
  public static async findByUserId(userId: string): Promise<Project[]> {
    const userProjects = await db.query.projects.findMany({
      where: eq(projects.userId, userId),
      orderBy: (projects, { desc }) => [desc(projects.createdAt)],
    });

    return userProjects;
  }
}
