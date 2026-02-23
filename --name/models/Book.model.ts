import mongoose, { Schema, Document } from 'mongoose';

interface IBook extends Document {
  title: string;
  author: string;
  description?: string;
  category?: string;
  coverImage?: string;
  fileUrl: string;
  fileSize?: number;
  uploadedBy?: mongoose.Types.ObjectId;
  downloads?: number;
  isActive?: boolean;
}

const BookSchema: Schema = new Schema(
  {
    title: { type: String, required: true, index: true },
    author: { type: String, required: true },
    description: { type: String },
    category: { type: String, index: true },
    coverImage: { type: String },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    downloads: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.models.Book || mongoose.model<IBook>('Book', BookSchema);