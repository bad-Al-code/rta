import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { createProjectSchema } from '../schema';
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
}
