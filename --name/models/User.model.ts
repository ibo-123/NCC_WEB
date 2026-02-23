import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  studentId?: string;
  department?: string;
  role?: string;
  profileImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String },
    studentId: { type: String },
    department: { type: String },
    role: { type: String, enum: ['admin','president','vice-president','lecturer','member'], default: 'member' },
    profileImage: { type: String }
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
