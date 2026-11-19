import mongoose from "mongoose";

const { Schema } = mongoose;

const TopicSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    order: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

TopicSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
  },
);
TopicSchema.index({ order: 1 });

export const Topic = mongoose.models.Topic || mongoose.model("Topic", TopicSchema);
