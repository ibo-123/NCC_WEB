import mongoose from "mongoose";

const { Schema } = mongoose;

const RatingHistorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    previous: { type: Number, default: null },
    value: { type: Number, required: true },
    change: { type: Number, default: null },
    source: { type: String, enum: ["initial", "scheduled", "manual"], required: true },
    components: {
      problem: { type: Number, default: null },
      contest: { type: Number, default: null },
      attendance: { type: Number, default: null },
    },
    runId: { type: String, required: true },
    computedAt: { type: Date, required: true },
    formulaVersion: { type: String, default: null },
  },
  { timestamps: true },
);

RatingHistorySchema.index({ userId: 1, computedAt: -1 });

export const RatingHistory =
  mongoose.models.RatingHistory || mongoose.model("RatingHistory", RatingHistorySchema);
