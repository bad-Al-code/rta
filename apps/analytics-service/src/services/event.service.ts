import AnalyticsEvent from '../models/event.model';
import { ProjectService } from './project.service';

interface GetEventOptions {
  projectId: string;
  userId: string;
  page: number;
  limit: number;
  eventName?: string;
}

interface GetStatsOptions {
  projectId: string;
  userId: string;
  days: number;
}

export class EventService {
  /**
   * Retrieves a paginated list of events for a specific project, ensuring user ownership.
   * @param options The options for querying events.
   * @returns A paginated list of analytics events.
   */
  public static async getEvents(options: GetEventOptions) {
    const { projectId, userId, page, limit, eventName } = options;

    await ProjectService.getProjectById(projectId, userId);

    const query: { projectId: string; eventName?: string } = { projectId };
    if (eventName) {
      query.eventName = eventName;
    }

    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      AnalyticsEvent.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AnalyticsEvent.countDocuments(query),
    ]);

    return {
      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves aggregated statistics for a specific project.
   * @param options The options for the aggregation query.
   * @returns An object containing project statistics.
   */
  public static async getProjectStats(options: GetStatsOptions) {
    const { projectId, userId, days } = options;

    await ProjectService.getProjectById(projectId, userId);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const stats = await AnalyticsEvent.aggregate([
      {
        $match: {
          projectId: projectId,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $facet: {
          totalEvents: [{ $count: 'count' }],
          totalPages: [
            { $match: { eventName: 'pageview' } },
            { $group: { _id: '$path', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $project: { _id: 0, path: '$_id', count: '$count' } },
          ],
          eventCounts: [
            { $group: { _id: '$eventName', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $project: { _id: 0, eventName: '$_id', count: '$count' } },
          ],
        },
      },
      {
        $project: {
          totalEvents: {
            $ifNull: [{ $arrayElemAt: ['$totalEvents.count', 0] }, 0],
          },
          topPages: '$topPages',
          eventCounts: '$eventCounts',
        },
      },
    ]);

    return stats[0] || { totalEvents: 0, topPages: [], eventCounts: [] };
  }
}
