import mongoose from "mongoose";

const { Schema } = mongoose;

const AttendanceRecordSchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "AttendanceSession", required: true },
    lectureId: { type: Schema.Types.ObjectId, ref: "Lecture", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    submittedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

AttendanceRecordSchema.index({ sessionId: 1, userId: 1 }, { unique: true });
AttendanceRecordSchema.index({ userId: 1, submittedAt: -1 });

export const AttendanceRecord =
  mongoose.models.AttendanceRecord ||
  mongoose.model("AttendanceRecord", AttendanceRecordSchema);
