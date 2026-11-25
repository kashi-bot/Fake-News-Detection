import { Schema, model, InferSchemaType, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

const sessionSchema = new Schema({
  tokenHash: { type: String, required: true },
  userAgent: String,
  ip: String,
  expiresAt: { type: Date, required: true },
}, { _id: true });

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, index: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'moderator', 'admin', 'superadmin'], default: 'user', index: true },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true, index: true },
  avatar: String,
  lastLoginAt: Date,
  sessions: { type: [sessionSchema], default: [], select: false },
}, { timestamps: true });

userSchema.index({ createdAt: -1 });

userSchema.methods.setPassword = async function (plain: string) {
  this.passwordHash = await bcrypt.hash(plain, 12);
};
userSchema.methods.verifyPassword = function (plain: string) {
  return bcrypt.compare(plain, this.passwordHash);
};

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };
export const User = model('User', userSchema);