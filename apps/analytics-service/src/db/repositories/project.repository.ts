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

  /**
   * Finds a single project by its ID.
   * @param id The ID of the project.
   * @returns A project object or undefined if not found.
   */
  public static async findById(id: string): Promise<Project | undefined> {
    return db.query.projects.findFirst({
      where: eq(projects.id, id),
    });
  }

  /**
   * Updates a project's data.
   * @param id The ID of the project to update.
   * @param data An object containing the fields to update.
   * @returns The updated project.
   */
  public static async update(
    id: string,
    data: Partial<Pick<Project, 'name'>>
  ): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();

    return updatedProject;
  }

  /**
   * Deletes a project by its ID.
   * @param id The ID of the project to delete.
   * @returns The deleted project.
   */
  public static async deleteById(id: string): Promise<Project> {
    const [deletedProject] = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning();

    return deletedProject;
  }
}
