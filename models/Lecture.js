import mongoose from "mongoose";

const { Schema } = mongoose;

const ResourceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    type: { type: String, enum: ["pdf", "link", "file"], required: true },
    url: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { _id: false },
);

const LectureSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", trim: true, maxlength: 4000 },
    scheduledAt: { type: Date, required: true },
    liveUrl: { type: String, default: null, trim: true, maxlength: 1000 },
    status: { type: String, enum: ["draft", "published"], default: "draft", required: true },
    resources: { type: [ResourceSchema], default: [] },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

LectureSchema.index({ status: 1, scheduledAt: 1 });

export const Lecture = mongoose.models.Lecture || mongoose.model("Lecture", LectureSchema);
