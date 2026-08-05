"use client";

import { useMemo, useRef, useState, useCallback, useEffect, type FormEvent, type DragEvent } from "react";
import { apiFetch } from "@/lib/client-api";

type DataItem = Record<string, unknown>;

// ─── GPS Location Types ───────────────────────────────────────────────────────
type GpsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; lat: number; lng: number; accuracy: number }
  | { status: "error"; code: "denied" | "unavailable" | "timeout" | "low_accuracy" | "unknown"; message: string };

type MapMode = "current" | "pin" | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── GPS Location Step Component ─────────────────────────────────────────────
function LocationStep({
  initialLat,
  initialLng,
  onConfirm,
  onSkip,
}: {
  initialLat?: number;
  initialLng?: number;
  onConfirm: (lat: number, lng: number, accuracy: number | null, verified: boolean) => void;
  onSkip: () => void;
}) {
  const [gps, setGps] = useState<GpsState>({ status: "idle" });
  const [mapMode, setMapMode] = useState<MapMode>(null);
  const [pinLat, setPinLat] = useState(initialLat ?? 28.7381);
  const [pinLng, setPinLng] = useState(initialLng ?? 77.2669);
  const [confirmed, setConfirmed] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Clean up geolocation watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGps({ status: "error", code: "unavailable", message: "Your browser or device does not support GPS location. Please enter coordinates manually." });
      return;
    }
    setGps({ status: "loading" });
    setMapMode("current");

    const options: PositionOptions = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (accuracy > 150) {
          // Very low accuracy — warn but still allow confirm
          setGps({ status: "success", lat: latitude, lng: longitude, accuracy });
        } else {
          setGps({ status: "success", lat: latitude, lng: longitude, accuracy });
        }
        setPinLat(latitude);
        setPinLng(longitude);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGps({ status: "error", code: "denied", message: "Location permission was denied. Please allow location access in your browser settings, then try again." });
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGps({ status: "error", code: "unavailable", message: "GPS signal unavailable. Make sure Location Services are enabled on your device, then retry." });
        } else if (error.code === error.TIMEOUT) {
          setGps({ status: "error", code: "timeout", message: "GPS timed out. Move to an open area with better signal, or try selecting your location on the map instead." });
        } else {
          setGps({ status: "error", code: "unknown", message: "Unable to determine your location. Please try again or use the map to pin your shop." });
        }
      },
      options,
    );
  }, []);

  const handleConfirm = () => {
    if (gps.status === "success") {
      onConfirm(gps.lat, gps.lng, gps.accuracy, true);
      setConfirmed(true);
    } else if (mapMode === "pin") {
      onConfirm(pinLat, pinLng, null, true);
      setConfirmed(true);
    }
  };

  const handleRetry = () => {
    setGps({ status: "idle" });
    setMapMode(null);
    setConfirmed(false);
  };

  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${pinLng - 0.005},${pinLat - 0.005},${pinLng + 0.005},${pinLat + 0.005}&layer=mapnik&marker=${pinLat},${pinLng}`;

  const accuracyColor = gps.status === "success"
    ? gps.accuracy <= 20 ? "#22c55e" : gps.accuracy <= 50 ? "#f59e0b" : "#ef4444"
    : "#64748b";

  const accuracyLabel = gps.status === "success"
    ? gps.accuracy <= 20 ? "Excellent" : gps.accuracy <= 50 ? "Good" : "Low accuracy – consider retrying"
    : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
        <div style={{ fontSize: "2rem", marginBottom: "6px" }}>📍</div>
        <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary, #f8fafc)" }}>
          Set Your Shop Location
        </h3>
        <p style={{ margin: "6px 0 0", fontSize: "0.85rem", color: "var(--text-secondary, #94a3b8)", lineHeight: 1.5 }}>
          This helps customers easily navigate to your shop — even if you&apos;re not on Google Maps.
        </p>
      </div>

      {/* Success Card */}
      {gps.status === "success" && !confirmed && (
        <div style={{
          background: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1))",
          border: "1px solid rgba(34,197,94,0.4)",
          borderRadius: "14px",
          padding: "16px 20px",
          animation: "fadeIn 0.4s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "1.4rem" }}>✅</span>
            <span style={{ fontWeight: 700, color: "#22c55e", fontSize: "1rem" }}>Location Found</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.85rem" }}>
            <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "10px" }}>
              <div style={{ color: "#94a3b8", fontSize: "0.75rem", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Latitude</div>
              <div style={{ color: "#f8fafc", fontWeight: 700, fontFamily: "monospace" }}>{gps.lat.toFixed(6)}</div>
            </div>
            <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "10px" }}>
              <div style={{ color: "#94a3b8", fontSize: "0.75rem", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Longitude</div>
              <div style={{ color: "#f8fafc", fontWeight: 700, fontFamily: "monospace" }}>{gps.lng.toFixed(6)}</div>
            </div>
          </div>
          <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: accuracyColor, flexShrink: 0 }} />
            <span style={{ color: accuracyColor, fontWeight: 600 }}>Accuracy: ±{Math.round(gps.accuracy)}m — {accuracyLabel}</span>
          </div>
        </div>
      )}

      {/* Confirmed Success */}
      {confirmed && (
        <div style={{
          background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.12))",
          border: "1px solid rgba(34,197,94,0.5)",
          borderRadius: "14px",
          padding: "20px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🎯</div>
          <div style={{ fontWeight: 700, color: "#22c55e", fontSize: "1rem", marginBottom: "4px" }}>Location Saved!</div>
          <div style={{ color: "#94a3b8", fontSize: "0.82rem" }}>
            {gps.status === "success"
              ? `${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}`
              : `${pinLat.toFixed(6)}, ${pinLng.toFixed(6)}`}
          </div>
          <button
            type="button"
            onClick={handleRetry}
            style={{ marginTop: "14px", padding: "7px 18px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.06)", color: "#cbd5e1", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}
          >
            🔄 Change Location
          </button>
        </div>
      )}

      {/* Error state */}
      {gps.status === "error" && (
        <div style={{
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.4)",
          borderRadius: "12px",
          padding: "14px 18px",
        }}>
          <div style={{ color: "#f87171", fontWeight: 600, marginBottom: "6px", fontSize: "0.9rem" }}>
            {gps.code === "denied" ? "🚫 Permission Denied" :
             gps.code === "timeout" ? "⏱️ GPS Timeout" :
             gps.code === "unavailable" ? "📡 GPS Unavailable" : "⚠️ Location Error"}
          </div>
          <p style={{ color: "#fca5a5", fontSize: "0.82rem", margin: 0, lineHeight: 1.55 }}>{gps.message}</p>
        </div>
      )}

      {/* Loading */}
      {gps.status === "loading" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", padding: "20px" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "50%",
            border: "3px solid rgba(255,87,34,0.2)",
            borderTopColor: "#FF5722",
            animation: "spin 0.8s linear infinite",
          }} />
          <div style={{ color: "#94a3b8", fontSize: "0.88rem", fontWeight: 500 }}>
            Fetching your GPS location…
          </div>
          <div style={{ color: "#64748b", fontSize: "0.78rem" }}>Please keep this window open</div>
        </div>
      )}

      {/* Map preview — show after success or when in pin mode */}
      {(gps.status === "success" || mapMode === "pin") && !confirmed && (
        <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", position: "relative" }}>
          <div style={{ padding: "8px 12px", background: "rgba(0,0,0,0.3)", fontSize: "0.78rem", color: "#94a3b8" }}>
            📌 {mapMode === "pin" ? "Drag the map to adjust — pin shows your selected location" : "Your GPS location on the map"}
          </div>
          <iframe
            title="Shop location map"
            src={mapSrc}
            style={{ width: "100%", height: "240px", border: "none", display: "block" }}
            loading="lazy"
            allowFullScreen={false}
          />
        </div>
      )}

      {/* Action Buttons — idle or error */}
      {!confirmed && gps.status !== "loading" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {(gps.status === "idle" || gps.status === "error") && (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                style={{
                  flex: 1,
                  minWidth: "160px",
                  padding: "13px 16px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #FF5722, #EF4444)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.92rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 16px rgba(255,87,34,0.4)",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
              >
                📍 Use Current Location
              </button>
              <button
                type="button"
                onClick={() => { setMapMode("pin"); setGps({ status: "idle" }); }}
                style={{
                  flex: 1,
                  minWidth: "160px",
                  padding: "13px 16px",
                  borderRadius: "12px",
                  border: "1px solid rgba(96,165,250,0.4)",
                  background: "rgba(96,165,250,0.1)",
                  color: "#60a5fa",
                  fontWeight: 700,
                  fontSize: "0.92rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background 0.15s ease",
                }}
              >
                🗺️ Select on Map
              </button>
            </div>
          )}

          {/* Map pin mode manual coordinate inputs */}
          {mapMode === "pin" && gps.status !== "success" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px" }}>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#94a3b8" }}>
                Enter coordinates or drag the embedded map to confirm your shop pin.
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.82rem", color: "#cbd5e1" }}>
                  Latitude
                  <input
                    type="number"
                    step="any"
                    value={pinLat}
                    onChange={(e) => setPinLat(Number(e.target.value))}
                    style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.25)", color: "#f8fafc", fontFamily: "monospace" }}
                  />
                </label>
                <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.82rem", color: "#cbd5e1" }}>
                  Longitude
                  <input
                    type="number"
                    step="any"
                    value={pinLng}
                    onChange={(e) => setPinLng(Number(e.target.value))}
                    style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.25)", color: "#f8fafc", fontFamily: "monospace" }}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Confirm / Retry buttons */}
          {(gps.status === "success" || mapMode === "pin") && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={handleConfirm}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.92rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(34,197,94,0.4)",
                }}
              >
                ✅ Confirm Location
              </button>
              <button
                type="button"
                onClick={handleRetry}
                style={{
                  padding: "12px 18px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#94a3b8",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                🔄 Retry
              </button>
            </div>
          )}
        </div>
      )}

      {/* Skip */}
      {!confirmed && (
        <button
          type="button"
          onClick={onSkip}
          style={{ background: "none", border: "none", color: "#64748b", fontSize: "0.8rem", cursor: "pointer", textDecoration: "underline", padding: "0 0 4px", alignSelf: "center" }}
        >
          Skip this step (use manual coordinates from Step 2)
        </button>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── Main OwnerStoreEditor Component ─────────────────────────────────────────
export function OwnerStoreEditor({
  categories,
  store,
  onSubmit,
}: {
  categories: DataItem[];
  store?: DataItem;
  onSubmit: (body: unknown, photoFile?: File) => Promise<void>;
}) {
  const [step, setStep] = useState(1);
  const [categoryId, setCategoryId] = useState(String(store?.categoryId ?? ""));

  // GPS state — persisted across steps so the confirmed values flow into the form
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsVerified, setGpsVerified] = useState(false);

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

  const handleGpsConfirm = (lat: number, lng: number, accuracy: number | null, verified: boolean) => {
    setGpsLat(lat);
    setGpsLng(lng);
    setGpsAccuracy(accuracy);
    setGpsVerified(verified);
    // Auto-advance to Step 4 (Photo & Hours) after a short delay for visual feedback
    setTimeout(() => setStep(4), 700);
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body: Record<string, unknown> = {
      ...Object.fromEntries(form),
      openingDays: form.getAll("openingDay").map(Number),
    };
    // Merge GPS data — override manual lat/lng if GPS was confirmed
    if (gpsVerified && gpsLat !== null && gpsLng !== null) {
      body.latitude = gpsLat;
      body.longitude = gpsLng;
      body.locationAccuracy = gpsAccuracy;
      body.locationVerified = true;
    } else {
      body.locationVerified = false;
    }
    await onSubmit(body, selectedFile ?? undefined);
  }

  // ─── Step indicator styles ──────────────────────────────────────────────────
  const stepBtn = (s: number) => ({
    fontWeight: step === s ? "bold" as const : "normal" as const,
    background: "none" as const,
    border: "none" as const,
    cursor: "pointer" as const,
    color: step === s ? "#FF5722" : "#64748b",
    padding: "0 2px",
    fontSize: "0.85rem",
  });

  return (
    <form className="portalForm" onSubmit={submit}>
      {/* Step indicator */}
      <div className="onboardingSteps" style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" onClick={() => setStep(1)} style={stepBtn(1)} aria-current={step === 1 ? "step" : undefined}>1. Basic Info</button>
        <span aria-hidden="true" style={{ color: "#cbd5e1" }}>/</span>
        <button type="button" onClick={() => setStep(2)} style={stepBtn(2)} aria-current={step === 2 ? "step" : undefined}>2. Location &amp; Contact</button>
        <span aria-hidden="true" style={{ color: "#cbd5e1" }}>/</span>
        <button type="button" onClick={() => setStep(3)} style={stepBtn(3)} aria-current={step === 3 ? "step" : undefined}>
          3. Shop Location {gpsVerified ? "✅" : ""}
        </button>
        <span aria-hidden="true" style={{ color: "#cbd5e1" }}>/</span>
        <button type="button" onClick={() => setStep(4)} style={stepBtn(4)} aria-current={step === 4 ? "step" : undefined}>4. Photo &amp; Hours</button>
      </div>

      {/* ── Step 1: Basic Info ─────────────────────────────────────────────── */}
      <div style={{ display: step === 1 ? "contents" : "none" }}>
        <label>Store / Business name<input name="name" defaultValue={text("name")} required placeholder="e.g. Ankur Vihar Plumbing Services" /></label>
        <label className="full">Business Type / Model
          <select
            name="businessType"
            defaultValue={text("businessType", "Physical Store / Shop")}
            required
            style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.15)", marginTop: "6px" }}
          >
            <option value="Physical Store / Shop" style={{ background: "#0F172A", color: "#FFF" }}>🏪 Physical Store / Shop (Retail, Grocery, Clinic, Pharmacy, Bakery)</option>
            <option value="Home Service Business" style={{ background: "#0F172A", color: "#FFF" }}>🛠️ Home Service Business (Plumber, Electrician, Carpenter, AC Repair, Cleaning, etc.)</option>
          </select>
        </label>
        <label>Category
          <select name="categoryId" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required>
            <option value="">Choose category</option>
            {categories.map((category) => <option key={String(category.id)} value={String(category.id)}>{String(category.name)}</option>)}
          </select>
        </label>
        <label>Subcategory / Service Specialty
          <select name="subcategoryId" defaultValue={text("subcategoryId")}>
            <option value="">Optional</option>
            {children.map((child) => <option key={String(child.id)} value={String(child.id)}>{String(child.name)}</option>)}
          </select>
        </label>
        <label className="full">Description<textarea name="description" defaultValue={text("description", "Tell customers what makes your business useful and trustworthy.")} required /></label>

        <div className="formActions full" style={{ marginTop: "16px" }}>
          <button type="button" className="portalButton" onClick={() => setStep(2)}>Next Step: Location</button>
        </div>
      </div>

      {/* ── Step 2: Location & Contact ─────────────────────────────────────── */}
      <div style={{ display: step === 2 ? "contents" : "none" }}>
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
        {/* Fallback manual lat/lng — auto-overridden by GPS step */}
        <label>Latitude<input name="latitude" type="number" step="any" defaultValue={String(gpsLat ?? text("latitude", "28.7381"))} /></label>
        <label>Longitude<input name="longitude" type="number" step="any" defaultValue={String(gpsLng ?? text("longitude", "77.2669"))} /></label>
        <label className="full">Google Maps URL<input name="googleMapsUrl" type="url" defaultValue={text("googleMapsUrl")} /></label>

        <div className="formActions full" style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
          <button type="button" className="portalButton secondary" onClick={() => setStep(1)}>Back</button>
          <button type="button" className="portalButton" onClick={() => setStep(3)}>Next: Set Shop Location</button>
        </div>
      </div>

      {/* ── Step 3: GPS Location ───────────────────────────────────────────── */}
      <div style={{ display: step === 3 ? "block" : "none" }}>
        <LocationStep
          initialLat={Number(text("latitude", "28.7381"))}
          initialLng={Number(text("longitude", "77.2669"))}
          onConfirm={handleGpsConfirm}
          onSkip={() => setStep(4)}
        />
        <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
          <button type="button" className="portalButton secondary" onClick={() => setStep(2)}>← Back</button>
          {!gpsVerified && (
            <button type="button" className="portalButton" onClick={() => setStep(4)}>Continue without GPS →</button>
          )}
        </div>
      </div>

      {/* ── Step 4: Photo & Hours ──────────────────────────────────────────── */}
      <div style={{ display: step === 4 ? "contents" : "none" }}>
        {/* GPS summary badge — shown if GPS was confirmed */}
        {gpsVerified && gpsLat !== null && (
          <div style={{
            gridColumn: "1 / -1",
            background: "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(16,185,129,0.08))",
            border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: "10px",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "4px",
            fontSize: "0.82rem",
          }}>
            <span style={{ fontSize: "1.1rem" }}>📍</span>
            <div>
              <span style={{ color: "#22c55e", fontWeight: 700 }}>GPS Location Confirmed</span>
              <span style={{ color: "#94a3b8", marginLeft: "8px" }}>
                {gpsLat.toFixed(5)}, {gpsLng!.toFixed(5)}
                {gpsAccuracy !== null && ` · ±${Math.round(gpsAccuracy)}m accuracy`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStep(3)}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "0.8rem", textDecoration: "underline" }}
            >
              Change
            </button>
          </div>
        )}

        {/* ── Business Photo ─────────────────────────────────────────────── */}
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
                <span aria-hidden="true">📷</span>
                <p>Drag &amp; Drop or Click to Browse</p>
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

        <label>Opens<input name="openTime" type="time" defaultValue={hours.open} /></label>
        <label>Closes<input name="closeTime" type="time" defaultValue={hours.close} /></label>
        <fieldset className="dayChecks full">
          <legend>Opening days</legend>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
            <label key={day}>
              <input name="openingDay" type="checkbox" value={index} defaultChecked={openingDays.includes(index)} />
              {day}
            </label>
          ))}
        </fieldset>

        <div className="formActions full" style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
          <button type="button" className="portalButton secondary" onClick={() => setStep(3)}>Back</button>
          <button className="portalButton" type="submit">{store ? "Save changes" : "Submit business"}</button>
        </div>
      </div>
    </form>
  );
}
