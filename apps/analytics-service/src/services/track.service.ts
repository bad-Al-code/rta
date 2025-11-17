import {
  EVENT_QUEUE_KEY,
  REALTIME_METRIC_PREFIX,
  REALTIME_METRIC_TTL_SECONDS,
} from '../config/constants';
import logger from '../config/logger';
import { redisConnection } from '../config/redis';
import DeadLetterEvent from '../models/dead-letter-event.model';

interface TrackEventData {
  projectId: string;
  eventName: string;
  path?: string;
  properties?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export class TrackService {
  /**
   * Pushes a validated analytics event into the Redis queue.
   * @param data The event data to be queued.
   */
  public static async queueEvent(data: TrackEventData): Promise<void> {
    try {
      const redisClient = redisConnection.getClient();

      const timestampMinute = new Date(data.timestamp)
        .toISOString()
        .slice(0, 15);
      const realtimeKey = `${REALTIME_METRIC_PREFIX}:${data.projectId}:${timestampMinute}`;

      const multi = redisClient.multi();
      multi.lPush(EVENT_QUEUE_KEY, JSON.stringify(data));
      multi.incr(realtimeKey);
      multi.expire(realtimeKey, REALTIME_METRIC_TTL_SECONDS);

      await multi.exec();
    } catch (redisError) {
      logger.error(
        'CRITICAL: Redis queueing failed. Falling back to MongoDB dead-letter queue. %o',
        {
          error: (redisError as Error).message,
          eventData: data,
        }
      );

      try {
        await DeadLetterEvent.create(data);
      } catch (mongoError) {
        logger.error(
          'CATASTROPHIC: Fallback to MongoDB also failed. Event data is lost. %o',
          {
            error: (mongoError as Error).message,
            eventData: data,
          }
        );
      }
    }
  }
}
