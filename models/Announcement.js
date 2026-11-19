import mongoose from "mongoose";

const { Schema } = mongoose;

const AnnouncementSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 10000 },
    type: {
      type: String,
      enum: ["general", "important", "contest", "lecture", "attendance"],
      required: true,
    },
    status: { type: String, enum: ["draft", "published"], default: "draft", required: true },
    publishedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

AnnouncementSchema.index({ status: 1, publishedAt: -1 });

export const Announcement =
  mongoose.models.Announcement || mongoose.model("Announcement", AnnouncementSchema);
