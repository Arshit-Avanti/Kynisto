"use client";

import { useMemo, useRef, useState, useCallback, type FormEvent, type DragEvent } from "react";
import { apiFetch } from "@/lib/client-api";

type DataItem = Record<string, unknown>;

function parseJsonArray(value: unknown): number[] {
  if (Array.isArray(value)) return value.map(Number);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) return parsed.map(Number);
    } catch {
      return [0, 1, 2, 3, 4, 5, 6];
    }
  }
  return [0, 1, 2, 3, 4, 5, 6];
}

function firstHours(value: unknown): { open: string; close: string } {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as Record<string, { open?: string; close?: string }>;
      const first = Object.values(parsed)[0];
      if (first?.open && first.close) return { open: first.open, close: first.close };
    } catch {
      return { open: "09:00", close: "21:00" };
    }
  }
  return { open: "09:00", close: "21:00" };
}

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      const MAX_DIM = 1200;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) { height = Math.round(height * MAX_DIM / width); width = MAX_DIM; }
        else { width = Math.round(width * MAX_DIM / height); height = MAX_DIM; }
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        else resolve(file);
      }, "image/jpeg", 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export function OwnerStoreEditor({
  categories,
  store,
  onSubmit,
}: {
  categories: DataItem[];
  store?: DataItem;
  onSubmit: (body: unknown, photoFile?: File) => Promise<void>;
}) {
  const [categoryId, setCategoryId] = useState(String(store?.categoryId ?? ""));
  const children = useMemo(() => {
    const category = categories.find((item) => String(item.id) === categoryId);
    return Array.isArray(category?.children) ? category.children as DataItem[] : [];
  }, [categories, categoryId]);
  const openingDays = parseJsonArray(store?.openingDays);
  const hours = firstHours(store?.businessHours);
  const text = (key: string, fallback = "") => String(store?.[key] ?? fallback);

  // Photo upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const existingLogo = text("logoUrl") || null;

  const handleFileSelect = useCallback(async (file: File) => {
    setUploadError("");
    const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED.includes(file.type)) {
      setUploadError("Please choose a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Photo must be smaller than 5 MB.");
      return;
    }
    try {
      const compressed = await compressImage(file);
      const url = URL.createObjectURL(compressed);
      setPreviewUrl(url);
      setSelectedFile(compressed);
    } catch {
      setUploadError("Could not process the image. Please try another file.");
    }
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void handleFileSelect(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFileSelect(file);
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSubmit(
      { ...Object.fromEntries(form), openingDays: form.getAll("openingDay").map(Number) },
      selectedFile ?? undefined,
    );
  }

  return (
    <form className="portalForm" onSubmit={submit}>
      {/* ── Business Photo ────────────────────────────────────────── */}
      <div className="storePhotoSection full">
        <h3>Business Photo</h3>
        <div
          className={`photoUploadArea ${isDragging ? "dragging" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          aria-label="Upload business photo"
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
        >
          {previewUrl || existingLogo ? (
            <img src={previewUrl ?? existingLogo!} alt="Business photo preview" className="photoPreview" />
          ) : (
            <div className="photoPlaceholder">
              <span>📷</span>
              <p>Drag & Drop or Click to Browse</p>
              <small>JPG, JPEG, PNG, WEBP · Max 5 MB</small>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleInputChange}
          style={{ display: "none" }}
          aria-hidden="true"
        />
        {(previewUrl || existingLogo) && (
          <div className="photoActions">
            <button type="button" onClick={() => fileInputRef.current?.click()}>
              {previewUrl ? "Change Photo" : "Update Photo"}
            </button>
            {previewUrl && (
              <button
                type="button"
                onClick={() => { setPreviewUrl(null); setSelectedFile(null); }}
                className="danger"
              >
                Remove Selection
              </button>
            )}
          </div>
        )}
        {uploadError && <p className="authError" role="alert">{uploadError}</p>}
        {existingLogo && !previewUrl && (
          <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.5rem" }}>
            Current photo shown above. To upload to your store media library, use the <strong>Media</strong> tab.
          </p>
        )}
      </div>

      {/* ── Business Details ──────────────────────────────────────── */}
      <label>Store name<input name="name" defaultValue={text("name")} required /></label>
      <label>Business type<input name="businessType" defaultValue={text("businessType", "Local business")} required /></label>
      <label>Category<select name="categoryId" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required><option value="">Choose category</option>{categories.map((category) => <option key={String(category.id)} value={String(category.id)}>{String(category.name)}</option>)}</select></label>
      <label>Subcategory<select name="subcategoryId" defaultValue={text("subcategoryId")}><option value="">Optional</option>{children.map((child) => <option key={String(child.id)} value={String(child.id)}>{String(child.name)}</option>)}</select></label>
      <label className="full">Description<textarea name="description" defaultValue={text("description", "Tell customers what makes your local business useful and trustworthy.")} required /></label>
      <label className="full">Full address<input name="address" defaultValue={text("address", "Main Market Road, DLF Ankur Vihar")} required /></label>
      <label>Area<input name="area" defaultValue={text("area", "DLF Ankur Vihar")} /></label>
      <label>City<input name="city" defaultValue={text("city", "Loni")} /></label>
      <label>State<input name="state" defaultValue={text("state", "Uttar Pradesh")} /></label>
      <label>Country<input name="country" defaultValue={text("country", "India")} /></label>
      <label>PIN code<input name="postalCode" defaultValue={text("postalCode", "201102")} /></label>
      <label>Phone<input name="phone" defaultValue={text("phone")} /></label>
      <label>WhatsApp<input name="whatsapp" defaultValue={text("whatsapp")} /></label>
      <label>Email<input name="email" type="email" defaultValue={text("email")} /></label>
      <label>Website<input name="website" type="url" defaultValue={text("website")} /></label>
      <label>Latitude<input name="latitude" type="number" step="any" defaultValue={text("latitude", "28.7381")} /></label>
      <label>Longitude<input name="longitude" type="number" step="any" defaultValue={text("longitude", "77.2669")} /></label>
      <label className="full">Google Maps URL<input name="googleMapsUrl" type="url" defaultValue={text("googleMapsUrl")} /></label>
      <label>Opens<input name="openTime" type="time" defaultValue={hours.open} /></label>
      <label>Closes<input name="closeTime" type="time" defaultValue={hours.close} /></label>
      <fieldset className="dayChecks full"><legend>Opening days</legend>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => <label key={day}><input name="openingDay" type="checkbox" value={index} defaultChecked={openingDays.includes(index)} />{day}</label>)}</fieldset>
      <div className="formActions"><button className="portalButton" type="submit">{store ? "Save changes" : "Submit business"}</button></div>
    </form>
  );
}
