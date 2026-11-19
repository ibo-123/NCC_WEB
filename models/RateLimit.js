import mongoose from "mongoose";

const { Schema } = mongoose;

const RateLimitSchema = new Schema(
  {
    key: { type: String, required: true },
    count: { type: Number, default: 0 },
    windowStartsAt: { type: Date, required: true },
    lockedUntil: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

RateLimitSchema.index({ key: 1 }, { unique: true });
RateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit = mongoose.models.RateLimit || mongoose.model("RateLimit", RateLimitSchema);
