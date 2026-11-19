import mongoose from "mongoose";
import { connectDb } from "./connect.js";

/**
 * Executes `fn(session)` inside a MongoDB multi-document ACID transaction.
 * Requires a MongoDB replica set.
 */
export async function runInTransaction(fn) {
  await connectDb();
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

export function isDuplicateKeyError(error) {
  if (!error) return false;
  if (error.code === 11000) return true;
  if (error.cause && error.cause.code === 11000) return true;
  return false;
}

export function sessionOpt(session) {
  return session ? { session } : {};
}
