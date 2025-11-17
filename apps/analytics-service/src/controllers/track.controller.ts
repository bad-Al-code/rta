import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { TrackService } from '../services';

export class TrackController {
  public static async trackEvent(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { projectId, eventName, path, properties } = req.body;

      await TrackService.queueEvent({
        projectId,
        eventName,
        path,
        properties,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
      });

      res.status(StatusCodes.ACCEPTED).json({ message: 'Event accepted' });
    } catch (error) {
      next(error);
    }
  }
}
