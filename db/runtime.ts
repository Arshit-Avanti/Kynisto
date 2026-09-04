import { env } from "cloudflare:workers";

type RuntimeBindings = {
  DB?: D1Database;
  MEDIA?: R2Bucket;
};

export interface AppMediaObject {
  body: ReadableStream | Uint8Array;
  httpMetadata?: {
    contentType?: string;
    cacheControl?: string;
  };
  httpEtag: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface AppMediaStorage {
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | Uint8Array | Blob | string,
    options?: {
      httpMetadata?: {
        contentType?: string;
        cacheControl?: string;
      };
      customMetadata?: Record<string, string>;
    },
  ): Promise<unknown>;

  get(key: string): Promise<AppMediaObject | null>;

  delete(keys: string | string[]): Promise<void>;
}

export function getD1(): D1Database {
  const db = (env as unknown as RuntimeBindings).DB;
  if (!db) {
    throw new Error("Kynisto database binding is unavailable.");
  }
  return db;
}

async function streamToUint8Array(value: unknown): Promise<Uint8Array> {
  if (!value) return new Uint8Array(0);
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (typeof value === "string") return new TextEncoder().encode(value);
  if (value instanceof Blob) {
    return new Uint8Array(await value.arrayBuffer());
  }
  if (typeof (value as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer === "function") {
    return new Uint8Array(await (value as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer());
  }
  if (typeof (value as { getReader?: () => ReadableStreamDefaultReader<Uint8Array> }).getReader === "function") {
    const reader = (value as ReadableStream<Uint8Array>).getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value: chunk } = await reader.read();
      if (done) break;
      if (chunk) chunks.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk));
    }
    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }
  return new Uint8Array(0);
}

class D1MediaFallbackStorage implements AppMediaStorage {
  private async ensureTable(): Promise<void> {
    const db = getD1();
    await db.prepare(
      "CREATE TABLE IF NOT EXISTS app_media_storage (key TEXT PRIMARY KEY, content BLOB NOT NULL, content_type TEXT NOT NULL, size_bytes INTEGER NOT NULL, created_at INTEGER NOT NULL)",
    ).run().catch(() => {});
  }

  async put(
    key: string,
    value: ReadableStream | ArrayBuffer | Uint8Array | Blob | string,
    options?: {
      httpMetadata?: { contentType?: string; cacheControl?: string };
      customMetadata?: Record<string, string>;
    },
  ): Promise<unknown> {
    await this.ensureTable();
    const db = getD1();
    const bytes = await streamToUint8Array(value);
    const contentType = options?.httpMetadata?.contentType || "application/octet-stream";
    const now = Math.floor(Date.now() / 1000);
    await db.prepare(
      "INSERT OR REPLACE INTO app_media_storage (key, content, content_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?)",
    ).bind(key, bytes, contentType, bytes.byteLength, now).run();
    return { key, size: bytes.byteLength };
  }

  async get(key: string): Promise<AppMediaObject | null> {
    await this.ensureTable();
    const db = getD1();
    const row = await db.prepare(
      "SELECT key, content, content_type AS contentType, size_bytes AS sizeBytes, created_at AS createdAt FROM app_media_storage WHERE key = ?",
    ).bind(key).first<{ key: string; content: unknown; contentType: string; sizeBytes: number; createdAt: number }>();

    if (!row || !row.content) return null;

    let bytes: Uint8Array;
    if (row.content instanceof Uint8Array) {
      bytes = row.content;
    } else if (row.content instanceof ArrayBuffer) {
      bytes = new Uint8Array(row.content);
    } else if (Array.isArray(row.content)) {
      bytes = new Uint8Array(row.content);
    } else if (typeof row.content === "string") {
      bytes = new TextEncoder().encode(row.content);
    } else {
      bytes = new Uint8Array(0);
    }

    const etag = `"${row.sizeBytes}-${row.createdAt}"`;
    return {
      body: bytes,
      httpMetadata: {
        contentType: row.contentType || "application/octet-stream",
        cacheControl: "public, max-age=31536000, immutable",
      },
      httpEtag: etag,
      size: bytes.byteLength,
      async arrayBuffer(): Promise<ArrayBuffer> {
        return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      },
    };
  }

  async delete(keys: string | string[]): Promise<void> {
    await this.ensureTable();
    const db = getD1();
    const list = Array.isArray(keys) ? keys : [keys];
    if (list.length === 0) return;
    const placeholders = list.map(() => "?").join(",");
    await db.prepare(`DELETE FROM app_media_storage WHERE key IN (${placeholders})`).bind(...list).run().catch(() => {});
  }
}

const fallbackStorage = new D1MediaFallbackStorage();

export function getMediaBucket(): AppMediaStorage | R2Bucket {
  const bucket = (env as unknown as RuntimeBindings).MEDIA;
  if (bucket && typeof bucket.get === "function" && typeof bucket.put === "function") {
    return bucket;
  }
  return fallbackStorage;
}
