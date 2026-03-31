import { Schema, model } from 'mongoose';

const impersonationLogSchema = new Schema({
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  action: {
    type: String,
    enum: ['impersonate_start', 'impersonate_end'],
    required: true,
  },
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Compound indexes for analytics
impersonationLogSchema.index({ adminId: 1, timestamp: -1 });
impersonationLogSchema.index({ userId: 1, timestamp: -1 });

const ImpersonationLog = model('ImpersonationLog', impersonationLogSchema);

export default ImpersonationLog;