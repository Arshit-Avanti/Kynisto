"use client";

export type PreparedMedia = {
  file: File;
  mediaType: "image" | "video";
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  thumbnail: File | null;
  previewUrl: string;
};

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 40 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg", "image/png", "image/webp", "image/avif",
  "video/mp4", "video/webm", "video/quicktime",
]);

function imageElement(file: Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("This image could not be opened.")); };
    image.src = url;
  });
}

function videoElement(file: Blob) {
  return new Promise<HTMLVideoElement>((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.onloadeddata = () => { URL.revokeObjectURL(url); resolve(video); };
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("This video could not be opened.")); };
    video.src = url;
  });
}

async function compressImage(file: File) {
  if (file.type === "image/avif" && file.size <= MAX_IMAGE_BYTES) {
    const image = await imageElement(file);
    return { file, width: image.naturalWidth, height: image.naturalHeight };
  }
  const image = await imageElement(file);
  const scale = Math.min(1, 1920 / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  if (scale === 1 && file.size <= 1.5 * 1024 * 1024) return { file, width, height };
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d", { alpha: false })?.drawImage(image, 0, 0, width, height);
  const type = file.type === "image/png" && file.size < 2 * 1024 * 1024 ? "image/png" : "image/webp";
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, .82));
  if (!blob) throw new Error("Image optimization failed.");
  const extension = type === "image/png" ? "png" : "webp";
  return {
    file: new File([blob], file.name.replace(/\.[^.]+$/, `.${extension}`), { type, lastModified: Date.now() }),
    width,
    height,
  };
}

async function prepareVideo(file: File) {
  if (file.size > MAX_VIDEO_BYTES) throw new Error("Video must be smaller than 40 MB.");
  const video = await videoElement(file);
  const width = video.videoWidth || null;
  const height = video.videoHeight || null;
  const durationSeconds = Number.isFinite(video.duration) ? Math.round(video.duration) : null;
  let thumbnail: File | null = null;
  if (width && height) {
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 720 / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", .76));
    if (blob) thumbnail = new File([blob], `${file.name}-thumbnail.webp`, { type: "image/webp" });
  }
  return { file, width, height, durationSeconds, thumbnail };
}

export async function prepareMedia(file: File): Promise<PreparedMedia> {
  if (!ALLOWED.has(file.type)) throw new Error("Use JPEG, PNG, WebP, AVIF, MP4, WebM or MOV media.");
  if (file.type.startsWith("image/")) {
    if (file.size > MAX_IMAGE_BYTES) throw new Error("Image must be smaller than 8 MB.");
    const prepared = await compressImage(file);
    return {
      ...prepared,
      mediaType: "image",
      durationSeconds: null,
      thumbnail: null,
      previewUrl: URL.createObjectURL(prepared.file),
    };
  }
  const prepared = await prepareVideo(file);
  return { ...prepared, mediaType: "video", previewUrl: URL.createObjectURL(file) };
}

export function formatMediaSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}

