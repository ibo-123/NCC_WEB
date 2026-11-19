import mongoose from "mongoose";

const { Schema } = mongoose;

const ContestResultSchema = new Schema(
  {
    contestId: { type: Schema.Types.ObjectId, ref: "Contest", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    handle: { type: String, required: true, trim: true },
    rank: { type: Number, required: true },
    points: { type: Number, required: true },
    penalty: { type: Number, required: true },
    fetchedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

ContestResultSchema.index({ contestId: 1, userId: 1 }, { unique: true });

export const ContestResult =
  mongoose.models.ContestResult || mongoose.model("ContestResult", ContestResultSchema);
