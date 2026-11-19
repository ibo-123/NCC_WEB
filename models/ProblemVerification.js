import mongoose from "mongoose";

const { Schema } = mongoose;

const ProblemVerificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    problemId: { type: Schema.Types.ObjectId, ref: "Problem", required: true },
    status: { type: String, enum: ["pending", "solved", "failed"], required: true },
    platform: { type: String, enum: ["codeforces", "leetcode"], required: true },
    solvedAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },
    lastCheckedAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
    failureReason: { type: String, default: null, maxlength: 250 },
  },
  { timestamps: true },
);

ProblemVerificationSchema.index({ userId: 1, problemId: 1 }, { unique: true });

export const ProblemVerification =
  mongoose.models.ProblemVerification ||
  mongoose.model("ProblemVerification", ProblemVerificationSchema);
