import { ProjectRepository } from '../db/repositories';
import { NewProject, Project } from '../db/schema';
import { ForbiddenError, NotFoundError } from '../errors';

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

  /**
   * Retrieves all projects for a given user.
   * @param userId The ID of the user.
   * @returns An array of the user's projects.
   */
  public static async getProjectsByUserId(userId: string): Promise<Project[]> {
    const projects = await ProjectRepository.findByUserId(userId);

    return projects;
  }

  /**
   * Retrieves a single project, ensuring ownership.
   * @param projectId The ID of the project.
   * @param userId The ID of the user requesting the project.
   * @returns The project.
   */
  public static async getProjectById(
    projectId: string,
    userId: string
  ): Promise<Project> {
    const project = await ProjectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.userId !== userId) {
      throw new ForbiddenError();
    }

    return project;
  }

  /**
   * Updates a single project, ensuring ownership.
   * @param projectId The ID of the project.
   * @param userId The ID of the user updating the project.
   * @param data The data to update.
   * @returns The updated project.
   */
  public static async updateProject(
    projectId: string,
    userId: string,
    data: Partial<Pick<Project, 'name'>>
  ): Promise<Project> {
    await this.getProjectById(projectId, userId);

    const updatedProject = await ProjectRepository.update(projectId, data);

    return updatedProject;
  }

  /**
   * Deletes a single project, ensuring ownership.
   * @param projectId The ID of the project.
   * @param userId The ID of the user deleting the project.
   */
  public static async deleteProject(
    projectId: string,
    userId: string
  ): Promise<void> {
    await this.getProjectById(projectId, userId);

    await ProjectRepository.deleteById(projectId);
  }
}
