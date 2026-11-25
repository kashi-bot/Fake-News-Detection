import { Schema, model } from 'mongoose';

const reportSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  verificationId: { type: Schema.Types.ObjectId, ref: 'Verification' },
  type: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['OPEN', 'INVESTIGATING', 'RESOLVED', 'REJECTED'], default: 'OPEN' },
  adminResponse: String,
}, { timestamps: true });

export const Report = model('Report', reportSchema);