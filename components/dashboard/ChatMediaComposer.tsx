"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { uploadFormData } from "@/lib/client-api";
import { formatMediaSize, prepareMedia, type PreparedMedia } from "@/lib/client-media";

export function ChatMediaComposer({
  conversationId,
  disabled,
  onSent,
  onError,
}: {
  conversationId: string;
  disabled: boolean;
  onSent: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const galleryId = useId();
  const cameraImageId = useId();
  const cameraVideoId = useId();
  const [media, setMedia] = useState<PreparedMedia | null>(null);
  const [caption, setCaption] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"ready" | "uploading" | "failed">("ready");
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const mediaRef = useRef<PreparedMedia | null>(null);

  useEffect(() => {
    mediaRef.current = media;
  }, [media]);
  useEffect(() => () => {
    controller.current?.abort();
    if (mediaRef.current) URL.revokeObjectURL(mediaRef.current.previewUrl);
  }, []);

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(""); onError("");
    try {
      const prepared = await prepareMedia(file);
      if (media) URL.revokeObjectURL(media.previewUrl);
      setMedia(prepared); setCaption(""); setProgress(0); setStatus("ready");
    } catch (selectionError) {
      onError(selectionError instanceof Error ? selectionError.message : "Media could not be prepared.");
    }
  }

  function clear() {
    controller.current?.abort();
    if (media) URL.revokeObjectURL(media.previewUrl);
    setMedia(null); setCaption(""); setProgress(0); setStatus("ready"); setError("");
  }

  async function send() {
    if (!media || disabled) return;
    const nextController = new AbortController();
    controller.current = nextController;
    setStatus("uploading"); setProgress(0); setError("");
    const form = new FormData();
    form.set("conversationId", conversationId);
    form.set("file", media.file);
    form.set("caption", caption);
    form.set("clientNonce", crypto.randomUUID());
    if (media.width) form.set("width", String(media.width));
    if (media.height) form.set("height", String(media.height));
    if (media.durationSeconds != null) form.set("durationSeconds", String(media.durationSeconds));
    if (media.thumbnail) form.set("thumbnail", media.thumbnail);
    try {
      await uploadFormData("/api/chat/media", form, { signal: nextController.signal, onProgress: setProgress });
      clear();
      await onSent();
    } catch (uploadError) {
      if ((uploadError as Error).name === "AbortError") return;
      const message = uploadError instanceof Error ? uploadError.message : "Upload failed.";
      setError(message); setStatus("failed"); onError(message);
    } finally {
      controller.current = null;
    }
  }

  return <div className="chatMediaComposer">
    <div className="chatMediaButtons">
      <label htmlFor={galleryId} aria-disabled={disabled}>＋ Media<input id={galleryId} type="file" disabled={disabled} accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime" onChange={choose} /></label>
      <label htmlFor={cameraImageId} aria-disabled={disabled}>Camera<input id={cameraImageId} type="file" disabled={disabled} accept="image/*" capture="environment" onChange={choose} /></label>
      <label htmlFor={cameraVideoId} aria-disabled={disabled}>Record<input id={cameraVideoId} type="file" disabled={disabled} accept="video/*" capture="environment" onChange={choose} /></label>
    </div>
    {media && <div className="chatMediaPreview">
      {media.mediaType === "image" ? <img src={media.previewUrl} alt="Selected upload preview" /> : <video src={media.previewUrl} controls preload="metadata" />}
      <div><input value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={1000} placeholder="Add an optional caption" /><small>{formatMediaSize(media.file.size)}{media.durationSeconds ? ` · ${media.durationSeconds}s` : ""}</small>{status === "uploading" && <progress max="100" value={progress}>{progress}%</progress>}{error && <em>{error}</em>}<span><button type="button" onClick={() => void send()} disabled={status === "uploading"}>{status === "failed" ? "Retry" : "Send media"}</button><button type="button" onClick={clear}>{status === "uploading" ? "Cancel" : "Remove"}</button></span></div>
    </div>}
  </div>;
}

