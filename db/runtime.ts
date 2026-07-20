import { env } from "cloudflare:workers";

type RuntimeBindings = {
  DB?: D1Database;
  MEDIA?: R2Bucket;
};

export function getD1(): D1Database {
  const db = (env as unknown as RuntimeBindings).DB;
  if (!db) {
    throw new Error("Kynisto database binding is unavailable.");
  }
  return db;
}

export function getMediaBucket(): R2Bucket {
  const bucket = (env as unknown as RuntimeBindings).MEDIA;
  if (!bucket) {
    throw new Error("Kynisto media storage binding is unavailable.");
  }
  return bucket;
}
