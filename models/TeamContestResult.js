import mongoose from "mongoose";

const { Schema } = mongoose;

const TeamContestResultSchema = new Schema(
  {
    contestId: { type: Schema.Types.ObjectId, ref: "Contest", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    points: { type: Number, required: true },
    penalty: { type: Number, default: null },
    rank: { type: Number, default: null },
    memberCount: { type: Number, required: true },
    matchedMembers: { type: Number, required: true },
    fetchedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

TeamContestResultSchema.index({ contestId: 1, teamId: 1 }, { unique: true });

export const TeamContestResult =
  mongoose.models.TeamContestResult ||
  mongoose.model("TeamContestResult", TeamContestResultSchema);
