"use client";

import { useState } from "react";

export type ChatMedia = {
  mediaId?: string | null;
  mediaType?: "image" | "video" | null;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  originalName?: string | null;
  caption?: string | null;
  durationSeconds?: number | null;
};

export function ChatMediaMessage({
  message,
  canDelete,
  onDelete,
}: {
  message: ChatMedia;
  canDelete: boolean;
  onDelete: () => Promise<void>;
}) {
  const [fullscreen, setFullscreen] = useState(false);
  if (!message.mediaUrl || !message.mediaType) return null;
  const share = async () => {
    const url = new URL(message.mediaUrl!, window.location.origin).toString();
    if (navigator.share) await navigator.share({ title: message.originalName || "Kynisto chat media", url });
    else await navigator.clipboard.writeText(url);
  };
  return <div className="chatMediaMessage">
    {message.mediaType === "image"
      ? <button className="chatMediaOpen" type="button" onClick={() => setFullscreen(true)}><img src={message.mediaUrl} alt={message.caption || "Chat image"} loading="lazy" /></button>
      : <video src={message.mediaUrl} poster={message.thumbnailUrl || undefined} controls preload="metadata" playsInline />}
    <div className="chatMediaActions">
      <a href={`${message.mediaUrl}?download=1`} download={message.originalName || undefined}>Download</a>
      <button type="button" onClick={() => void share()}>Share</button>
      {canDelete && <button className="dangerText" type="button" onClick={() => void onDelete()}>Delete</button>}
    </div>
    {fullscreen && <div className="chatMediaLightbox" role="dialog" aria-modal="true" aria-label="Image preview" onClick={() => setFullscreen(false)}><button type="button" aria-label="Close preview">×</button><img src={message.mediaUrl} alt={message.caption || "Chat image"} /></div>}
  </div>;
}
