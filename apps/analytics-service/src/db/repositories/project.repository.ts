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
}
