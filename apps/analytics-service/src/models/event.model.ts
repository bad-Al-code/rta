import mongoose, { Document, Schema } from 'mongoose';

interface EventProperties {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface IAnalyticsEvent extends Document {
  projectId: string;
  eventName: string;
  path?: string;
  userAgent?: string;
  ipAddress?: string;
  properties?: EventProperties;
  createdAt: Date;
}

const AnalyticsEventSchema: Schema<IAnalyticsEvent> = new Schema(
  {
    projectId: {
      type: String,
      required: true,
      index: true,
    },

    eventName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    path: {
      type: String,
      trim: true,
    },

    userAgent: {
      type: String,
    },

    ipAddress: {
      type: String,
    },

    properties: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

AnalyticsEventSchema.index({ projectId: 1, createdAt: -1 });

const AnalyticsEvent = mongoose.model<IAnalyticsEvent>(
  'AnalyticsEvent',
  AnalyticsEventSchema
);

export default AnalyticsEvent;
