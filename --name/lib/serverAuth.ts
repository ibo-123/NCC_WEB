import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from './api';
import User from '@/models/User.model';

export const authenticateUser = async (request: NextRequest) => {
  try {
    await connectDB();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

    const user = await User.findById(decoded.id).select('-password');
    return user;
  } catch (error) {
    console.error('Server authenticate error:', error);
    return null;
  }
};

export default authenticateUser;
