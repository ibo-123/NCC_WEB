import mongoose from "mongoose";

const { Schema } = mongoose;

const TeamSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 100 },
    inviteCode: { type: String, required: true, trim: true, uppercase: true, maxlength: 16 },
    captainId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["active", "disbanded"], default: "active", required: true },
    memberCount: { type: Number, default: 1, min: 0 },
    streakCurrent: { type: Number, default: null },
    streakLongest: { type: Number, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

TeamSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
  },
);
TeamSchema.index(
  { inviteCode: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  },
);

export const Team = mongoose.models.Team || mongoose.model("Team", TeamSchema);
