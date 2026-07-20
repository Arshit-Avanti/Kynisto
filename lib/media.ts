import { HttpError } from "@/lib/security";

export type SupportedMediaType = "image" | "video";

export type ValidatedMedia = {
  mediaType: SupportedMediaType;
  extension: string;
  maxBytes: number;
};

const MEDIA_TYPES = new Map<string, ValidatedMedia>([
  ["image/jpeg", { mediaType: "image", extension: "jpg", maxBytes: 8 * 1024 * 1024 }],
  ["image/png", { mediaType: "image", extension: "png", maxBytes: 8 * 1024 * 1024 }],
  ["image/webp", { mediaType: "image", extension: "webp", maxBytes: 8 * 1024 * 1024 }],
  ["image/avif", { mediaType: "image", extension: "avif", maxBytes: 8 * 1024 * 1024 }],
  ["video/mp4", { mediaType: "video", extension: "mp4", maxBytes: 40 * 1024 * 1024 }],
  ["video/webm", { mediaType: "video", extension: "webm", maxBytes: 40 * 1024 * 1024 }],
  ["video/quicktime", { mediaType: "video", extension: "mov", maxBytes: 40 * 1024 * 1024 }],
]);

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}

export function validateMediaFile(file: File): ValidatedMedia {
  const descriptor = MEDIA_TYPES.get(file.type.toLowerCase());
  if (!descriptor) {
    throw new HttpError(415, "Use JPEG, PNG, WebP, AVIF, MP4, WebM or MOV media.", "UNSUPPORTED_MEDIA");
  }
  if (file.size <= 0 || file.size > descriptor.maxBytes) {
    const limit = Math.round(descriptor.maxBytes / 1024 / 1024);
    throw new HttpError(413, `${descriptor.mediaType === "image" ? "Image" : "Video"} must be smaller than ${limit} MB.`, "FILE_TOO_LARGE");
  }
  return descriptor;
}

export async function verifyMediaSignature(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 64).arrayBuffer());
  if (file.type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === "image/png") return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (file.type === "image/webp") return ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP";
  if (file.type === "image/avif") return ascii(bytes, 4, 8) === "ftyp" && /avif|avis/.test(ascii(bytes, 8, 32));
  if (file.type === "video/webm") return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  if (file.type === "video/mp4" || file.type === "video/quicktime") {
    return ascii(bytes, 4, 8) === "ftyp";
  }
  return false;
}

export async function mediaChecksum(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

export function safeMediaName(file: File): string {
  const value = file.name.replace(/[^\p{L}\p{N}._ -]+/gu, "").trim().slice(0, 160);
  return value || `kynisto-${Date.now()}`;
}

export function optionalInteger(value: FormDataEntryValue | null, min: number, max: number): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
}
