import mongoose, { Model, Schema } from 'mongoose';

import { IAnalyticsEvent } from './event.model';

const DeadLetterEventSchema: Schema<IAnalyticsEvent> = new Schema(
  {
    projectId: { type: String, required: true },
    eventName: { type: String, required: true },
    path: { type: String },
    userAgent: { type: String },
    ipAddress: { type: String },
    properties: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

const DeadLetterEvent: Model<IAnalyticsEvent> = mongoose.model<IAnalyticsEvent>(
  'DeadLetterEvent',
  DeadLetterEventSchema
);

export default DeadLetterEvent;
