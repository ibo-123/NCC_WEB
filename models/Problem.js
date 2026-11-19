import mongoose from "mongoose";

const { Schema } = mongoose;

const ProblemSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    topicId: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
    platform: { type: String, enum: ["codeforces", "leetcode"], required: true },
    value: { type: Number, default: null },
    url: { type: String, required: true, trim: true, maxlength: 500 },
    externalRef: {
      contestId: { type: Number },
      index: { type: String, trim: true },
      titleSlug: { type: String, trim: true },
    },
    status: { type: String, enum: ["draft", "published"], default: "draft", required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

ProblemSchema.index({ topicId: 1, status: 1 });
ProblemSchema.index({ title: "text" });

export const Problem = mongoose.models.Problem || mongoose.model("Problem", ProblemSchema);
