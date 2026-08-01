"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from "react";
import { apiFetch, uploadFormData } from "@/lib/client-api";
import { formatMediaSize, prepareMedia, type PreparedMedia } from "@/lib/client-media";

type Asset = {
  id: string;
  publicUrl: string;
  thumbnailUrl: string | null;
  mediaType: "image" | "video";
  originalName: string;
  caption: string | null;
  sizeBytes: number;
  durationSeconds: number | null;
  sortOrder: number;
  featured: number;
  cropX: number;
  cropY: number;
};

type Pending = PreparedMedia & {
  id: string;
  caption: string;
  progress: number;
  status: "ready" | "uploading" | "failed";
  error: string;
};

export function CatalogMediaControl({
  ownerType,
  itemId,
  storeId,
  itemName,
  onChanged,
}: {
  ownerType: "product" | "service";
  itemId: string;
  storeId: string;
  itemName: string;
  onChanged: (message: string) => Promise<void>;
}) {
  const galleryId = useId();
  const cameraImageId = useId();
  const cameraVideoId = useId();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const aborts = useRef(new Map<string, AbortController>());
  const pendingRef = useRef<Pending[]>([]);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ ownerType, itemId, storeId });
    const result = await apiFetch<{ items: Asset[] }>(`/api/catalog-media?${params}`);
    setAssets(result.items);
  }, [itemId, ownerType, storeId]);

  useEffect(() => {
    if (open) void load().catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load media."));
  }, [load, open]);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);
  useEffect(() => () => {
    pendingRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    aborts.current.forEach((controller) => controller.abort());
  }, []);

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])].slice(0, 12);
    event.target.value = "";
    if (!files.length) return;
    setError("");
    try {
      const prepared = await Promise.all(files.map(prepareMedia));
      setPending((current) => [...current, ...prepared.map((item) => ({
        ...item, id: crypto.randomUUID(), caption: "", progress: 0, status: "ready" as const, error: "",
      }))]);
    } catch (selectionError) {
      setError(selectionError instanceof Error ? selectionError.message : "Media could not be prepared.");
    }
  }

  function removePending(id: string) {
    aborts.current.get(id)?.abort();
    setPending((current) => {
      const target = current.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  async function uploadOne(id: string) {
    const target = pending.find((item) => item.id === id);
    if (!target) return;
    const controller = new AbortController();
    aborts.current.set(id, controller);
    setPending((current) => current.map((item) => item.id === id ? { ...item, status: "uploading", progress: 0, error: "" } : item));
    const form = new FormData();
    form.set("ownerType", ownerType);
    form.set("itemId", itemId);
    form.set("storeId", storeId);
    form.set("file", target.file);
    form.set("caption", target.caption);
    form.set("altText", target.caption || itemName);
    if (target.width) form.set("width", String(target.width));
    if (target.height) form.set("height", String(target.height));
    if (target.durationSeconds != null) form.set("durationSeconds", String(target.durationSeconds));
    if (target.thumbnail) form.set("thumbnail", target.thumbnail);
    try {
      await uploadFormData("/api/catalog-media", form, {
        signal: controller.signal,
        onProgress: (progress) => setPending((current) => current.map((item) => item.id === id ? { ...item, progress } : item)),
      });
      removePending(id);
      await load();
      await onChanged(`${ownerType === "product" ? "Product" : "Service"} media uploaded`);
    } catch (uploadError) {
      if ((uploadError as Error).name === "AbortError") return;
      setPending((current) => current.map((item) => item.id === id ? {
        ...item, status: "failed", error: uploadError instanceof Error ? uploadError.message : "Upload failed.",
      } : item));
    } finally {
      aborts.current.delete(id);
    }
  }

  async function uploadAll() {
    const ids = pending.filter((item) => item.status !== "uploading").map((item) => item.id);
    for (const id of ids) await uploadOne(id);
  }

  async function update(action: "feature" | "edit", asset: Asset) {
    setBusy(true); setError("");
    try {
      const caption = action === "edit" ? window.prompt("Caption", asset.caption ?? "") : undefined;
      if (action === "edit" && caption === null) return;
      await apiFetch("/api/catalog-media", {
        method: "PATCH",
        json: { action, ownerType, itemId, storeId, assetId: asset.id, caption, cropX: asset.cropX, cropY: asset.cropY },
      });
      await load(); await onChanged(action === "feature" ? "Cover media updated" : "Media details updated");
    } catch (updateError) { setError(updateError instanceof Error ? updateError.message : "Media could not be updated."); }
    finally { setBusy(false); }
  }

  async function move(asset: Asset, direction: -1 | 1) {
    const index = assets.findIndex((item) => item.id === asset.id);
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= assets.length) return;
    const next = [...assets];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setAssets(next);
    try {
      await apiFetch("/api/catalog-media", { method: "PATCH", json: { action: "reorder", ownerType, itemId, storeId, assetIds: next.map((item) => item.id) } });
    } catch (moveError) { setError(moveError instanceof Error ? moveError.message : "Order could not be saved."); await load(); }
  }

  async function removeSelected() {
    const assetIds = [...selected];
    if (!assetIds.length || !window.confirm(`Delete ${assetIds.length} selected media item${assetIds.length === 1 ? "" : "s"} permanently?`)) return;
    setBusy(true); setError("");
    try {
      await apiFetch("/api/catalog-media", { method: "DELETE", json: { ownerType, itemId, storeId, assetIds } });
      setSelected(new Set()); await load(); await onChanged("Selected media deleted");
    } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "Media could not be deleted."); }
    finally { setBusy(false); }
  }

  const cover = useMemo(() => assets.find((item) => Boolean(item.featured)) ?? assets[0], [assets]);
  return <div className="catalogMediaControl">
    <button className="catalogMediaTrigger" type="button" onClick={() => setOpen((value) => !value)}>
      {cover ? <img src={cover.thumbnailUrl || cover.publicUrl} alt="" loading="lazy" /> : <span>＋</span>}
      <b>{assets.length ? `${assets.length} media` : "Add media"}</b>
    </button>
    {open && <div className="catalogMediaPanel" aria-busy={busy}>
      <div className="catalogMediaToolbar">
        <label htmlFor={galleryId}>Gallery<input id={galleryId} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime" onChange={choose} /></label>
        <label htmlFor={cameraImageId}>Camera<input id={cameraImageId} type="file" accept="image/*" capture="environment" onChange={choose} /></label>
        <label htmlFor={cameraVideoId}>Record<input id={cameraVideoId} type="file" accept="video/*" capture="environment" onChange={choose} /></label>
        {selected.size > 0 && <button className="dangerText" type="button" onClick={() => void removeSelected()}>{selected.size} selected · Delete</button>}
      </div>
      {error && <small className="productImageError" role="alert">{error}</small>}
      {pending.length > 0 && <div className="pendingMediaGrid">{pending.map((item) => <article key={item.id}>
        {item.mediaType === "image" ? <img src={item.previewUrl} alt="Upload preview" /> : <video src={item.previewUrl} controls preload="metadata" />}
        <input value={item.caption} onChange={(event) => setPending((current) => current.map((value) => value.id === item.id ? { ...value, caption: event.target.value } : value))} placeholder="Optional caption" maxLength={500} />
        <small>{formatMediaSize(item.file.size)}{item.durationSeconds ? ` · ${item.durationSeconds}s` : ""}</small>
        {item.status === "uploading" && <progress max="100" value={item.progress}>{item.progress}%</progress>}
        {item.error && <em>{item.error}</em>}
        <div><button type="button" onClick={() => void uploadOne(item.id)} disabled={item.status === "uploading"}>{item.status === "failed" ? "Retry" : "Upload"}</button><button type="button" onClick={() => removePending(item.id)}>{item.status === "uploading" ? "Cancel" : "Remove"}</button></div>
      </article>)}</div>}
      {pending.length > 1 && <button className="portalButton" type="button" onClick={() => void uploadAll()}>Upload all</button>}
      <div className="catalogAssetGrid">{assets.map((asset, index) => <article key={asset.id} className={selected.has(asset.id) ? "selected" : ""}>
        <label><input type="checkbox" checked={selected.has(asset.id)} onChange={() => setSelected((current) => { const next = new Set(current); if (next.has(asset.id)) next.delete(asset.id); else next.add(asset.id); return next; })} /><span className="srOnly">Select {asset.originalName}</span></label>
        {asset.mediaType === "image"
          ? <img src={asset.publicUrl} alt={asset.caption || itemName} loading="lazy" style={{ objectPosition: `${asset.cropX}% ${asset.cropY}%` }} />
          : <video src={asset.publicUrl} poster={asset.thumbnailUrl || undefined} controls preload="metadata" />}
        <small>{asset.featured ? "Cover · " : ""}{asset.mediaType}{asset.durationSeconds ? ` · ${asset.durationSeconds}s` : ""}</small>
        <div><button type="button" onClick={() => void move(asset, -1)} disabled={index === 0}>←</button><button type="button" onClick={() => void move(asset, 1)} disabled={index === assets.length - 1}>→</button>{asset.mediaType === "image" && !asset.featured && <button type="button" onClick={() => void update("feature", asset)}>Cover</button>}<button type="button" onClick={() => void update("edit", asset)}>Edit</button></div>
      </article>)}</div>
    </div>}
  </div>;
}
