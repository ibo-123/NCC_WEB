import mongoose from "mongoose";

const { Schema } = mongoose;

const SessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
    lastUsedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
    userAgent: { type: String, default: null, maxlength: 256 },
    twoFactorVerified: { type: Boolean, required: true },
    reauthAt: { type: Date, default: null },
  },
  { timestamps: true },
);

SessionSchema.index({ tokenHash: 1 }, { unique: true });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
SessionSchema.index({ userId: 1 });

export const Session = mongoose.models.Session || mongoose.model("Session", SessionSchema);
