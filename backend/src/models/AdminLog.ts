import { Schema, model } from 'mongoose';

const adminLogSchema = new Schema({
  adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetType: String,
  targetId: Schema.Types.ObjectId,
  metadata: Schema.Types.Mixed,
}, { timestamps: true });

export const AdminLog = model('AdminLog', adminLogSchema);