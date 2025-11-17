import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import {
  createProjectSchema,
  projectParamSchema,
  updateProjectSchema,
} from '../schema';
import { ProjectService } from '../services';

export class ProjectController {
  public static async createProject(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { name } = createProjectSchema.parse({ body: req.body }).body;
      const userId = req.currentUser!.id;

      const project = await ProjectService.createProject({ name, userId });

      res.status(StatusCodes.CREATED).json({ project });
    } catch (error) {
      next(error);
    }
  }

  public static async getProjects(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.currentUser!.id;

      const projects = await ProjectService.getProjectsByUserId(userId);

      res.status(StatusCodes.OK).json({ projects });
    } catch (error) {
      next(error);
    }
  }

  public static async getProject(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { projectId } = projectParamSchema.parse({
        params: req.params,
      }).params;
      const userId = req.currentUser!.id;

      const project = await ProjectService.getProjectById(projectId, userId);

      res.status(StatusCodes.OK).json({ project });
    } catch (error) {
      next(error);
    }
  }

  public static async updateProject(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { projectId } = updateProjectSchema.parse({
        params: req.params,
      }).params;
      const userId = req.currentUser!.id;
      const { name } = updateProjectSchema.parse({ body: req.body }).body;

      const project = await ProjectService.updateProject(projectId, userId, {
        name,
      });

      res.status(StatusCodes.OK).json({ project });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteProject(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { projectId } = projectParamSchema.parse({
        params: req.params,
      }).params;
      const userId = req.currentUser!.id;

      await ProjectService.deleteProject(projectId, userId);

      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }
}
