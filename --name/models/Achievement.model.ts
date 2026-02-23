import mongoose, { Schema, Document } from 'mongoose';

interface IAchievement extends Document {
  title: string;
  description?: string;
  category?: string;
  points?: number;
  date?: Date;
  assignedTo?: mongoose.Types.ObjectId[];
  isTeamAchievement?: boolean;
  links?: string[];
  assignedBy?: mongoose.Types.ObjectId;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const AchievementSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String, index: true },
    points: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    assignedTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isTeamAchievement: { type: Boolean, default: false },
    links: [{ type: String }],
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

AchievementSchema.statics.getLeaderboard = async function(limit = 10, category = null) {
  const match = { isActive: true } as any;
  if (category) match.category = category;

  const leaderboard = await this.aggregate([
    { $match: match },
    { $unwind: '$assignedTo' },
    { $group: { _id: '$assignedTo', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1 } },
    { $limit: limit },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: { _id: 0, user: { _id: '$user._id', name: '$user.name', studentId: '$user.studentId', department: '$user.department' }, totalPoints: 1 } }
  ]);

  return leaderboard;
};

AchievementSchema.statics.getUserTotalPoints = async function(userId: string) {
  const result = await this.aggregate([
    { $match: { isActive: true, assignedTo: mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, total: { $sum: '$points' } } }
  ]);

  return result[0]?.total || 0;
};

export default mongoose.models.Achievement || mongoose.model<IAchievement>('Achievement', AchievementSchema);