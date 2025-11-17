import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { getEventsSchema, getProjectStatsSchema } from '../schema';
import { EventService } from '../services';

export class EventController {
  /**
   *
   * @param req
   * @param res
   * @param next
   */
  public static async getEvents(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { params, query } = getEventsSchema.parse({
        params: req.params,
        query: req.query,
      });

      const { projectId } = params;
      const { page, limit, eventName } = query;
      const userId = req.currentUser!.id;

      const result = await EventService.getEvents({
        projectId,
        userId,
        page,
        limit,
        eventName,
      });

      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   *
   * @param req
   * @param res
   * @param next
   */
  public static async getProjectStats(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { params, query } = getProjectStatsSchema.parse({
        params: req.params,
        query: req.query,
      });

      const { projectId } = params;
      const { days } = query;
      const userId = req.currentUser!.id;

      const stats = await EventService.getProjectStats({
        projectId,
        userId,
        days,
      });

      res.status(StatusCodes.OK).json({ stats });
    } catch (error) {
      next(error);
    }
  }
}
