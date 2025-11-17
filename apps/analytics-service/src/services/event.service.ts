import AnalyticsEvent from '../models/event.model';
import { ProjectService } from './project.service';

interface GetEventOptions {
  projectId: string;
  userId: string;
  page: number;
  limit: number;
  eventName?: string;
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
}
