export interface GetEventOptions {
  projectId: string;
  userId: string;
  page: number;
  limit: number;
  eventName?: string;
}

export interface GetStatsOptions {
  projectId: string;
  userId: string;
  days: number;
}

export interface GetRealTimeStatsOptions {
  projectId: string;
  userId: string;
  minutes: number;
}
