import mongoose from "mongoose";
import { assertConfigReady } from "@/lib/config/env.js";

const globalCache = globalThis;
if (!globalCache.__nccMongooseCache) {
  globalCache.__nccMongooseCache = { conn: null, promise: null, uri: null };
}

/**
 * Establishes and reuses a singleton Mongoose connection across Next.js hot reloads.
 * When `overrideUri` is supplied (tests / standalone scripts), binds to that URI cleanly.
 */
export async function connectDb(overrideUri) {
  const uri = overrideUri ?? assertConfigReady("core").mongodbUri;
  const cache = globalCache.__nccMongooseCache;

  if (cache.conn && cache.uri === uri && mongoose.connection.readyState === 1) {
    return cache.conn;
  }

  if (cache.uri !== uri && mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    cache.conn = null;
    cache.promise = null;
  }

  if (!cache.promise) {
    cache.uri = uri;
    cache.promise = mongoose
      .connect(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      })
      .then((m) => {
        cache.conn = m;
        return m;
      })
      .catch((err) => {
        cache.promise = null;
        cache.conn = null;
        throw err;
      });
  }

  return cache.promise;
}

export async function disconnectDb() {
  const cache = globalCache.__nccMongooseCache;
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  cache.conn = null;
  cache.promise = null;
  cache.uri = null;
}
