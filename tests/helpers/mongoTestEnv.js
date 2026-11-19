import crypto from "node:crypto";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { resetConfigCache } from "@/lib/config/env.js";
import { connectDb, disconnectDb } from "@/lib/db/connect.js";

export function randomKey32() {
  return crypto.randomBytes(32).toString("base64");
}

export function applyTestEnv(overrides = {}) {
  const sessionSecret = crypto.randomBytes(36).toString("base64url");
  const attKey = randomKey32();
  const twofaKey = randomKey32();

  const defaults = {
    NODE_ENV: "test",
    MONGODB_URI: "mongodb://127.0.0.1:27017/ncc_test?replicaSet=testset",
    SESSION_SECRET: sessionSecret,
    APP_URL: "http://localhost:3000",
    CAMPUS_TIMEZONE: "Africa/Addis_Ababa",
    BCRYPT_COST: "4",
    ATTENDANCE_CODE_ENCRYPTION_KEY: attKey,
    ATTENDANCE_DEFAULT_VALID_SECONDS: "600",
    ATTENDANCE_MAX_ATTEMPTS: "5",
    ATTENDANCE_LOCKOUT_SECONDS: "900",
    ADMIN_2FA_ENABLED: "true",
    TWOFA_ENCRYPTION_KEY: twofaKey,
    REGISTRATION_MODE: "open",
    RESTRICTED_CONTACT_EMAIL: "dsa-heads@ncc.edu",
    STREAK_QUALIFYING_TYPES: "problem_solved,attendance,contest_result,team_contest_result",
  };

  for (const [k, v] of Object.entries({ ...defaults, ...overrides })) {
    if (v === undefined || v === null) {
      delete process.env[k];
    } else {
      process.env[k] = String(v);
    }
  }
  resetConfigCache();
}

export async function startTestMongo(envOverrides = {}) {
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  const uri = replSet.getUri("ncc_dsa_test");
  applyTestEnv({ MONGODB_URI: uri, ...envOverrides });
  await connectDb(uri);

  return {
    uri,
    replSet,
    async clear() {
      const collections = mongoose.connection.collections;
      for (const col of Object.values(collections)) {
        await col.deleteMany({});
      }
    },
    async stop() {
      await disconnectDb();
      await replSet.stop();
      resetConfigCache();
    },
  };
}
