import mongoose from "mongoose";

const { Schema } = mongoose;

const ActivityEventSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "problem_solved",
        "attendance",
        "contest_result",
        "rating_change",
        "team_contest_result",
      ],
      required: true,
    },
    refId: { type: Schema.Types.ObjectId, required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", default: null },
    occurredAt: { type: Date, required: true },
    day: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  },
  { timestamps: true },
);

ActivityEventSchema.index({ userId: 1, type: 1, refId: 1 }, { unique: true });
ActivityEventSchema.index(
  { teamId: 1, day: 1 },
  { partialFilterExpression: { teamId: { $type: "objectId" } } },
);

export const ActivityEvent =
  mongoose.models.ActivityEvent || mongoose.model("ActivityEvent", ActivityEventSchema);
