import mongoose from "mongoose";

const { Schema } = mongoose;

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["announcement_published", "contest_published", "attendance_recorded"],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 1000 },
    href: { type: String, default: null, trim: true, maxlength: 500 },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification =
  mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
