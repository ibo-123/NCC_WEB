import mongoose from "mongoose";

const { Schema } = mongoose;

const TeamMembershipSchema = new Schema(
  {
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["captain", "member"], required: true },
    status: { type: String, enum: ["active", "left"], default: "active", required: true },
    joinedAt: { type: Date, required: true },
    leftAt: { type: Date, default: null },
  },
  { timestamps: true },
);

TeamMembershipSchema.index({ teamId: 1, userId: 1 }, { unique: true });
TeamMembershipSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  },
);

export const TeamMembership =
  mongoose.models.TeamMembership || mongoose.model("TeamMembership", TeamMembershipSchema);
