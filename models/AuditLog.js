import mongoose from "mongoose";

const { Schema } = mongoose;

const AuditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    action: { type: String, required: true, trim: true, maxlength: 80 },
    entityType: { type: String, required: true, trim: true, maxlength: 60 },
    entityId: { type: Schema.Types.ObjectId, default: null },
    summary: { type: String, required: true, trim: true, maxlength: 500 },
    meta: { type: Schema.Types.Mixed, default: null, select: false },
    correlationId: { type: String, required: true, trim: true, maxlength: 120 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

AuditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
