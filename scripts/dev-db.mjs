import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { MongoBinary } from "mongodb-memory-server";
import mongoose from "mongoose";

const DB_PORT = 27017;
const DB_HOST = "127.0.0.1";
const DB_PATH = "/tmp/ncc-mongod-data";
const REPL_SET = "rs0";

function isPortOpen(port, host) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitForPort(port, host, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isPortOpen(port, host)) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Timed out waiting for MongoDB on ${host}:${port}`);
}

async function ensureReplicaSet() {
  const conn = await mongoose.createConnection(`mongodb://${DB_HOST}:${DB_PORT}/admin?directConnection=true`).asPromise();
  try {
    const admin = conn.db.admin();
    try {
      const status = await admin.command({ replSetGetStatus: 1 });
      if (status?.ok === 1) {
        return;
      }
    } catch {
      // Not initiated yet
    }
    await admin.command({
      replSetInitiate: {
        _id: REPL_SET,
        members: [{ _id: 0, host: `${DB_HOST}:${DB_PORT}` }],
      },
    });
    // Wait until PRIMARY
    for (let i = 0; i < 40; i += 1) {
      const hello = await admin.command({ hello: 1 });
      if (hello?.isWritablePrimary || hello?.ismaster) break;
      await new Promise((r) => setTimeout(r, 250));
    }
  } finally {
    await conn.close();
  }
}

async function main() {
  if (await isPortOpen(DB_PORT, DB_HOST)) {
    await ensureReplicaSet();
    console.log(`MongoDB replica set already running on mongodb://${DB_HOST}:${DB_PORT}/ncc_dsa?replicaSet=${REPL_SET}`);
    return;
  }

  fs.mkdirSync(DB_PATH, { recursive: true });
  const binPath = await MongoBinary.getPath();
  if (!binPath || !fs.existsSync(binPath)) {
    throw new Error(`MongoDB binary not found at ${path.resolve(binPath ?? "")}`);
  }

  const child = spawn(
    binPath,
    [
      "--dbpath",
      DB_PATH,
      "--port",
      String(DB_PORT),
      "--bind_ip",
      DB_HOST,
      "--replSet",
      REPL_SET,
      "--quiet",
    ],
    { stdio: "inherit" },
  );

  const forwardSignal = (sig) => {
    if (!child.killed) child.kill(sig);
  };
  process.on("SIGINT", () => forwardSignal("SIGINT"));
  process.on("SIGTERM", () => forwardSignal("SIGTERM"));

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });

  await waitForPort(DB_PORT, DB_HOST);
  await ensureReplicaSet();
  console.log(`MongoDB replica set ready at mongodb://${DB_HOST}:${DB_PORT}/ncc_dsa?replicaSet=${REPL_SET}`);
}

main().catch((err) => {
  console.error("Failed to start local MongoDB replica set:", err);
  process.exit(1);
});
