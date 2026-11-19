import mongoose from "mongoose";

const { Schema } = mongoose;
const AEAD_REGEX = /^v1\.[0-9a-f]{8}(\.[A-Za-z0-9_-]+){3}$/;

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["student", "admin"], required: true },
    status: { type: String, enum: ["active", "restricted"], default: "active", required: true },
    restrictedAt: { type: Date, default: null },
    restrictedReason: { type: String, default: null, trim: true, maxlength: 500 },
    handles: {
      codeforces: { type: String, trim: true },
      leetcode: { type: String, trim: true },
    },
    ratingCurrent: { type: Number, default: null },
    twoFactor: {
      enabled: { type: Boolean, default: false },
      secretEnc: {
        type: String,
        select: false,
        default: null,
        validate: {
          validator: (v) => v === null || v === undefined || AEAD_REGEX.test(v),
          message: "Invalid encrypted 2FA secret shape",
        },
      },
      enabledAt: { type: Date, default: null },
      lastUsedStep: { type: Number, default: null },
    },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1, status: 1 });
UserSchema.index(
  { "handles.codeforces": 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 },
    partialFilterExpression: { "handles.codeforces": { $type: "string" } },
  },
);
UserSchema.index(
  { "handles.leetcode": 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 },
    partialFilterExpression: { "handles.leetcode": { $type: "string" } },
  },
);

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
