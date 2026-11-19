import mongoose from "mongoose";

const { Schema } = mongoose;

const ContestSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", trim: true, maxlength: 4000 },
    mode: { type: String, enum: ["individual", "team"], default: "individual", required: true },
    platform: { type: String, enum: ["codeforces"], default: "codeforces", required: true },
    platformContestId: { type: String, required: true, trim: true, maxlength: 64 },
    url: { type: String, required: true, trim: true, maxlength: 1000 },
    invitationUrl: { type: String, default: null, trim: true, maxlength: 1000 },
    startsAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    publication: { type: String, enum: ["draft", "published"], default: "draft", required: true },
    resultsState: {
      type: String,
      enum: ["not_fetched", "fetched", "published"],
      default: "not_fetched",
      required: true,
    },
    lastFetchedAt: { type: Date, default: null },
    fetchSummary: {
      type: {
        processed: Number,
        matched: Number,
        unmatchedHandles: [String],
        teamsMatched: Number,
      },
      default: null,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

ContestSchema.index({ mode: 1, publication: 1, startsAt: -1 });

export const Contest = mongoose.models.Contest || mongoose.model("Contest", ContestSchema);
