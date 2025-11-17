import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { getEventsSchema } from '../schema';
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
      const { projectId } = getEventsSchema.parse({
        params: req.params,
      }).params;
      const userId = req.currentUser!.id;

      const { page, limit, eventName } = getEventsSchema.parse({
        query: req.query,
      }).query;

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
}
