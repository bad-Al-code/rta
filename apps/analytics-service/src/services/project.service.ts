import { ProjectRepository } from '../db/repositories';
import { NewProject, Project } from '../db/schema';

export class ProjectService {
  /**
   * Creates a new project for a given user.
   * @param projectData The data for the new project.
   * @returns The created project.
   */
  public static async createProject(
    projectData: Pick<NewProject, 'name' | 'userId'>
  ): Promise<Project> {
    const project = await ProjectRepository.create(projectData);

    return project;
  }
}
