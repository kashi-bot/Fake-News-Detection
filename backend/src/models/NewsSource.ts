import { Schema, model } from 'mongoose';

const newsSourceSchema = new Schema({
  domain: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  category: {
  type: String,
  enum: ['OFFICIAL_GOVERNMENT', 'OFFICIAL_ORGANIZATION', 'ESTABLISHED_PUBLISHER', 'SPECIALIZED_PUBLICATION', 'SATIRE', 'UNKNOWN_PUBLISHER'],
  default: 'UNKNOWN_PUBLISHER'
  },
  country: String,
  isOfficial: { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ['verified', 'pending', 'rejected'], default: 'verified' },
  enabled: { type: Boolean, default: true },
  notes: String,
}, { timestamps: true });



export const NewsSource = model('NewsSource', newsSourceSchema);