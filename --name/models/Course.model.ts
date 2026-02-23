import mongoose, { Schema, Document } from 'mongoose';

interface ICourse extends Document {
  title: string;
  description: string;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  videoUrl?: string;
  instructor?: mongoose.Types.ObjectId;
  enrolledUsers?: any[];
  isActive?: boolean;
}

const EnrolledSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  enrolledAt: { type: Date, default: Date.now },
  progress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false }
});

const CourseSchema: Schema = new Schema(
  {
    title: { type: String, required: true, index: true },
    description: { type: String },
    category: { type: String, index: true },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    tags: [{ type: String }],
    videoUrl: { type: String },
    instructor: { type: Schema.Types.ObjectId, ref: 'User' },
    enrolledUsers: [EnrolledSchema],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);