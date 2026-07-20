"use client";

import { useEffect, useId, useState, type ChangeEvent, type FormEvent } from "react";
import { apiFetch } from "@/lib/client-api";

type ProductImageControlProps = {
  productId: string;
  storeId: string;
  productName: string;
  imageUrl?: string | null;
  onChanged: (message: string) => Promise<void>;
};

const ACCEPTED_IMAGES = "image/jpeg,image/png,image/webp,image/avif";

export function ProductImageControl({
  productId,
  storeId,
  productName,
  imageUrl,
  onChanged,
}: ProductImageControlProps) {
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    if (preview) URL.revokeObjectURL(preview);
    const file = event.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : "");
    setError("");
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get("file");
    if (!(file instanceof File) || file.size === 0) {
      setError("Choose an image first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = new FormData();
      payload.set("kind", "product");
      payload.set("storeId", storeId);
      payload.set("productId", productId);
      payload.set("altText", productName);
      payload.set("file", file);
      await apiFetch("/api/media", { method: "POST", body: payload });
      form.reset();
      if (preview) URL.revokeObjectURL(preview);
      setPreview("");
      await onChanged(imageUrl ? "Product image replaced" : "Product image uploaded");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!imageUrl || !window.confirm("Remove this product image?")) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch("/api/media", { method: "DELETE", json: { storeId, productId } });
      await onChanged("Product image removed");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Image could not be removed.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="productImageControl" aria-busy={busy}>
    <div className="productImagePreview">
      {preview || imageUrl
        ? <img src={preview || imageUrl || ""} alt={`${productName} preview`} />
        : <span aria-hidden="true">IMG</span>}
    </div>
    <form onSubmit={upload}>
      <label htmlFor={inputId}>{imageUrl ? "Replace image" : "Add image"}</label>
      <input id={inputId} name="file" type="file" accept={ACCEPTED_IMAGES} onChange={selectImage} required />
      <button type="submit" disabled={busy}>{busy ? "Saving…" : "Upload"}</button>
      {imageUrl && <button type="button" className="dangerText" onClick={() => void remove()} disabled={busy}>Remove</button>}
    </form>
    {error && <small className="productImageError" role="alert">{error}</small>}
  </div>;
}
