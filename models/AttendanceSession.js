import mongoose from "mongoose";

const { Schema } = mongoose;
const AEAD_REGEX = /^v1\.[0-9a-f]{8}(\.[A-Za-z0-9_-]+){3}$/;

const AttendanceSessionSchema = new Schema(
  {
    lectureId: { type: Schema.Types.ObjectId, ref: "Lecture", required: true },
    codeEnc: {
      type: String,
      select: false,
      default: null,
      validate: {
        validator: (v) => v === null || v === undefined || AEAD_REGEX.test(v),
        message: "Invalid encrypted attendance code shape",
      },
    },
    openedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    opensAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

AttendanceSessionSchema.index(
  { lectureId: 1 },
  {
    unique: true,
    partialFilterExpression: { closedAt: null },
  },
);

export const AttendanceSession =
  mongoose.models.AttendanceSession ||
  mongoose.model("AttendanceSession", AttendanceSessionSchema);
