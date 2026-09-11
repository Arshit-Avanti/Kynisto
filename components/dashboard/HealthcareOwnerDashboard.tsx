"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/client-api";
import type { SessionUser } from "@/lib/auth";
import { OwnerHealthcarePanel } from "@/components/dashboard/OwnerHealthcarePanel";
import { OwnerStoreEditor } from "@/components/dashboard/OwnerStoreEditor";
import {
  isOwnerWorkspaceView,
  OwnerWorkspacePanel,
} from "@/components/dashboard/OwnerWorkspacePanel";
import { ChatCenter } from "@/components/dashboard/ChatCenter";
import { UserSubscriptionDashboard } from "@/components/subscription/UserSubscriptionDashboard";
import { CatalogPanel } from "@/components/dashboard/CatalogPanel";
import { OwnerMembershipEditor } from "@/components/dashboard/OwnerMembershipEditor";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Award,
  BarChart2,
  Bell,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Crown,
  FileText,
  Heart,
  HelpCircle,
  ImageIcon,
  LayoutDashboard,
  List,
  MapPin,
  MessageSquare,
  Package,
  Percent,
  Phone,
  Plus,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Stethoscope,
  Tags,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";

type Store = Record<string, string | number | null | undefined>;
type Item = Record<string, string | number | null | undefined>;

interface VitalsRecord {
  id: string;
  patientName: string;
  tokenNumber?: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  spo2: number;
  temperature: number;
  weightKg: number;
  heightCm: number;
  bmi: string;
  bmiCategory: string;
  bloodSugar?: number;
  recordedAt: string;
}

const SPECIALTY_PRESETS = [
  { id: "all", label: "All Departments" },
  { id: "general", label: "General OPD" },
  { id: "pediatrics", label: "Pediatrics" },
  { id: "cardiology", label: "Cardiology" },
  { id: "orthopedics", label: "Orthopedics" },
  { id: "dental", label: "Dental Care" },
  { id: "dermatology", label: "Dermatology" },
  { id: "ent", label: "ENT" },
  { id: "gynecology", label: "Gynecology" },
];

export function HealthcareOwnerDashboard({ user }: { user: SessionUser }) {
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab") ?? "overview";
  const tab = rawTab === "queue" ? "healthcare" : rawTab;

  const [stores, setStores] = useState<Store[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [categories, setCategories] = useState<Item[]>([]);
  const [catalog, setCatalog] = useState<Item[]>([]);
  const [queueData, setQueueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // Media, reviews, and analytics state for healthcare
  const [media, setMedia] = useState<Item[]>([]);
  const [reviews, setReviews] = useState<Item[]>([]);
  const [analytics, setAnalytics] = useState<Item[]>([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPagination, setReviewPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // Exclusive features state
  const [emergencyTriage, setEmergencyTriage] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [vitalsList, setVitalsList] = useState<VitalsRecord[]>([]);

  // Vitals form inputs
  const [vitalsPatientName, setVitalsPatientName] = useState("");
  const [vitalsToken, setVitalsToken] = useState("");
  const [vitalsSystolic, setVitalsSystolic] = useState("120");
  const [vitalsDiastolic, setVitalsDiastolic] = useState("80");
  const [vitalsPulse, setVitalsPulse] = useState("72");
  const [vitalsSpO2, setVitalsSpO2] = useState("98");
  const [vitalsTemp, setVitalsTemp] = useState("98.6");
  const [vitalsWeight, setVitalsWeight] = useState("65");
  const [vitalsHeight, setVitalsHeight] = useState("170");
  const [vitalsSugar, setVitalsSugar] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }, []);

  const selectedStore = useMemo(() => {
    return stores.find((s) => String(s.id) === selectedId) ?? stores[0] ?? null;
  }, [stores, selectedId]);

  const mutateCatalog = useCallback(
    async (path: string, method: string, json: unknown, message: string) => {
      try {
        await apiFetch(path, { method, json });
        showToast(message);
        if (selectedStore && ["products", "services", "offers"].includes(tab)) {
          const res = await apiFetch<{ items: Item[] }>(
            `/api/owner/catalog?resource=${tab}&storeId=${encodeURIComponent(String(selectedStore.id))}`
          );
          setCatalog(res.items || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed");
      }
    },
    [selectedStore, tab, showToast]
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [overview, categoryData] = await Promise.all([
        apiFetch<{ stores: Store[] }>("/api/owner/overview").catch(() => ({ stores: [] })),
        apiFetch<{ items: Item[] }>("/api/categories?module=all").catch(() => ({ items: [] })),
      ]);

      const fetchedStores = overview.stores || [];
      setStores(fetchedStores);
      setCategories(categoryData.items || []);

      if (fetchedStores.length > 0) {
        const initialId = String(fetchedStores[0].id);
        setSelectedId(initialId);
        try {
          const q = await apiFetch<any>(`/api/owner/healthcare?storeId=${encodeURIComponent(initialId)}&fast=1`);
          setQueueData(q);
        } catch {}
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clinic information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedStore) return;
    const storeId = String(selectedStore.id);
    if (["products", "services", "offers"].includes(tab)) {
      apiFetch<{ items: Item[] }>(`/api/owner/catalog?resource=${tab}&storeId=${encodeURIComponent(storeId)}`)
        .then((res) => setCatalog(res.items || []))
        .catch((err) => setError(err instanceof Error ? err.message : "Failed to load items"));
    } else if (tab === "media") {
      apiFetch<{ items: Item[] }>(`/api/media?storeId=${encodeURIComponent(storeId)}`)
        .then((res) => setMedia(res.items || []))
        .catch(() => undefined);
    } else if (tab === "reviews") {
      apiFetch<{ items: Item[]; pagination: any }>(`/api/owner/reviews?storeId=${encodeURIComponent(storeId)}&page=${reviewPage}&limit=20`)
        .then((res) => {
          setReviews(res.items || []);
          if (res.pagination) setReviewPagination(res.pagination);
        })
        .catch(() => undefined);
    } else if (tab === "analytics") {
      apiFetch<{ items: Item[] }>("/api/owner/analytics")
        .then((res) => setAnalytics(res.items || []))
        .catch(() => undefined);
    }
  }, [selectedStore, tab, reviewPage]);

  // Calculated BMI
  const computedBmi = useMemo(() => {
    const w = parseFloat(vitalsWeight);
    const h = parseFloat(vitalsHeight);
    if (!w || !h || h <= 0) return { bmi: "—", category: "Normal" };
    const heightM = h / 100;
    const val = (w / (heightM * heightM)).toFixed(1);
    const num = parseFloat(val);
    let category = "Normal";
    if (num < 18.5) category = "Underweight";
    else if (num < 25) category = "Normal";
    else if (num < 30) category = "Overweight";
    else category = "Obese";
    return { bmi: val, category };
  }, [vitalsWeight, vitalsHeight]);

  // OPD Revenue calculation
  const opdRevenue = useMemo(() => {
    if (!queueData) return { totalRevenue: 0, completedCount: 0, waitingCount: 0, projectedRevenue: 0 };
    const entries = queueData.entries ?? [];
    const completed = entries.filter((e: any) => e.status === "completed");
    const waiting = entries.filter((e: any) => e.status === "waiting" || e.status === "called");
    const doctors = queueData.doctors ?? [];
    const defaultFee = doctors[0]?.consultationFee ?? 500;

    const totalRev = completed.reduce((sum: number, e: any) => {
      const doc = doctors.find((d: any) => String(d.id) === String(e.doctorId));
      return sum + Number(doc?.consultationFee ?? defaultFee);
    }, 0);

    const projectedRev = totalRev + waiting.length * defaultFee;

    return {
      totalRevenue: totalRev,
      completedCount: completed.length,
      waitingCount: waiting.length,
      projectedRevenue: projectedRev,
    };
  }, [queueData]);

  // Handle vitals log submission
  const handleLogVitals = (e: FormEvent) => {
    e.preventDefault();
    if (!vitalsPatientName.trim()) {
      showToast("Please enter patient name");
      return;
    }

    const newRec: VitalsRecord = {
      id: "vit-" + Date.now(),
      patientName: vitalsPatientName.trim(),
      tokenNumber: vitalsToken ? `#${vitalsToken}` : undefined,
      systolic: parseInt(vitalsSystolic) || 120,
      diastolic: parseInt(vitalsDiastolic) || 80,
      pulse: parseInt(vitalsPulse) || 72,
      spo2: parseInt(vitalsSpO2) || 98,
      temperature: parseFloat(vitalsTemp) || 98.6,
      weightKg: parseFloat(vitalsWeight) || 65,
      heightCm: parseFloat(vitalsHeight) || 170,
      bmi: computedBmi.bmi,
      bmiCategory: computedBmi.category,
      bloodSugar: vitalsSugar ? parseInt(vitalsSugar) : undefined,
      recordedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setVitalsList((prev) => [newRec, ...prev.slice(0, 19)]);
    setVitalsPatientName("");
    setVitalsToken("");
    showToast(`✓ Vitals logged for ${newRec.patientName}`);
  };

  // Toggle store status
  const toggleStoreStatus = async () => {
    if (!selectedStore) return;
    const current = String(selectedStore.status ?? "active");
    const newStatus = current === "closed" ? "active" : "closed";

    setStores((prev) =>
      prev.map((s) => (String(s.id) === String(selectedStore.id) ? { ...s, status: newStatus } : s))
    );

    try {
      await apiFetch("/api/owner/stores", {
        method: "PATCH",
        json: { action: "toggle_status", storeId: String(selectedStore.id), status: newStatus },
      });
      showToast(newStatus === "closed" ? "🔴 Clinic closed for patients" : "🟢 Clinic OPEN for consultations!");
    } catch (err) {
      showToast("Failed to update clinic status");
    }
  };

  // 1-Click quick setup for clinics
  const handleQuickSetupClinic = async () => {
    try {
      setLoading(true);
      setError("");
      const healthCat = categories.find(
        (c) =>
          String(c.name).toLowerCase().includes("clinic") ||
          String(c.name).toLowerCase().includes("health") ||
          String(c.module) === "healthcare"
      ) || categories[0] || { id: "category-05" };

      await apiFetch<{ storeId: string; ok: boolean }>("/api/owner/stores", {
        method: "POST",
        json: {
          name: user.name ? `${user.name}'s Medical Center` : "City Healthcare Clinic",
          businessType: "Local Physical Store / Business",
          categoryId: healthCat.id,
          address: "Healthcare Complex, Sector 12",
          city: "Metropolis",
          state: "State",
          country: "India",
          postalCode: "110001",
          phone: "+91 98765 43210",
          whatsapp: "+91 98765 43210",
          email: user.email || "clinic@kynisto.in",
          description: "Full-service medical clinic with OPD consultations, digital prescriptions, patient history, and live remote queue management.",
          businessHours: '{"monday":{"open":"09:00","close":"20:00"}}',
        },
      });

      showToast("🎉 Healthcare clinic created and activated!");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to set up clinic.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && stores.length === 0) {
    return (
      <div className="portalSkeleton">
        <span />
        <span />
        <span />
        <span />
      </div>
    );
  }

  // Get current India Standard Time string
  const istTimeString = new Date().toLocaleTimeString("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div style={{ overflowX: "clip", width: "100%" }}>
      {/* Top Banner & Clinic Identity */}
      <div
        className="portalTitleRow"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          background: "linear-gradient(135deg, rgba(240, 253, 244, 0.7) 0%, rgba(236, 253, 245, 0.4) 100%)",
          padding: "1.25rem 1.5rem",
          borderRadius: "20px",
          border: "1px solid rgba(16, 185, 129, 0.2)",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.25rem 0.65rem",
                borderRadius: "9999px",
                background: "#059669",
                color: "#ffffff",
                fontSize: "0.75rem",
                fontWeight: 800,
                letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}
            >
              <Stethoscope size={13} /> Healthcare Specialist Portal
            </span>
            <span style={{ color: "#059669", fontSize: "0.8rem", fontWeight: 700 }}>
              • IST {istTimeString}
            </span>
          </div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 900, margin: "0.2rem 0", color: "#0f172a" }}>
            {selectedStore ? String(selectedStore.name) : "Healthcare Clinic & Hospital Dashboard"}
          </h1>
          <p style={{ color: "#475569", margin: 0, fontSize: "0.9rem" }}>
            Real-time OPD queue, digital prescriptions, doctor schedules, patient records & clinical vitals.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {selectedStore && (
            <button
              type="button"
              onClick={toggleStoreStatus}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.6rem 1.25rem",
                borderRadius: "9999px",
                border: String(selectedStore.status) === "closed" ? "1.5px solid #ef4444" : "1.5px solid #10b981",
                background: String(selectedStore.status) === "closed" ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)",
                color: String(selectedStore.status) === "closed" ? "#dc2626" : "#059669",
                fontWeight: 800,
                fontSize: "0.92rem",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              }}
            >
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: String(selectedStore.status) === "closed" ? "#ef4444" : "#10b981",
                  boxShadow: String(selectedStore.status) === "closed" ? "0 0 8px #ef4444" : "0 0 8px #10b981",
                }}
              />
              {String(selectedStore.status) === "closed" ? "🔴 Clinic Closed (Click to Open)" : "🟢 Clinic Open for Consultations"}
            </button>
          )}
          {stores.length > 1 && (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              style={{
                padding: "0.65rem 1rem",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                fontWeight: 700,
                fontSize: "0.9rem",
              }}
            >
              {stores.map((s) => (
                <option key={String(s.id)} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && <p className="authError" role="alert">{error}</p>}

      {/* No Stores Found: 1-Click Setup */}
      {stores.length === 0 ? (
        <section className="portalCard" style={{ padding: "2.5rem", textAlign: "center", borderRadius: "20px" }}>
          <div style={{ maxWidth: "560px", margin: "0 auto" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#ecfdf5",
                color: "#059669",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1rem",
              }}
            >
              <Stethoscope size={32} />
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>
              Welcome to your Healthcare Practice
            </h2>
            <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
              Activate your clinic listing to unlock digital prescriptions, doctor scheduling, live remote queue tracking, and electronic medical records.
            </p>
            <button
              type="button"
              onClick={() => void handleQuickSetupClinic()}
              style={{
                background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                color: "#ffffff",
                padding: "0.85rem 2rem",
                borderRadius: "14px",
                fontWeight: 800,
                fontSize: "1rem",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(5, 150, 105, 0.3)",
              }}
            >
              ⚡ 1-Click Activate Healthcare Clinic & Queue
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* OVERVIEW TAB: Rich Healthcare Suite */}
          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Emergency Triage Alert Bar (Exclusive Feature) */}
              <div
                style={{
                  background: emergencyTriage ? "#fef2f2" : "#ffffff",
                  border: emergencyTriage ? "2px solid #ef4444" : "1px solid #e2e8f0",
                  padding: "1.25rem 1.5rem",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "1rem",
                  boxShadow: emergencyTriage ? "0 8px 24px rgba(239, 68, 68, 0.15)" : "0 2px 10px rgba(0,0,0,0.03)",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: emergencyTriage ? "#fee2e2" : "#f1f5f9",
                      color: emergencyTriage ? "#dc2626" : "#475569",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "1.05rem", color: emergencyTriage ? "#991b1b" : "#0f172a", display: "block" }}>
                      {emergencyTriage ? "🚨 High-Priority Emergency Triage Active" : "Emergency Triage Mode"}
                    </strong>
                    <small style={{ color: emergencyTriage ? "#b91c1c" : "#64748b" }}>
                      {emergencyTriage
                        ? "Broadcast alert is active on patient screens. Emergency cases bypass routine wait queues."
                        : "Enable to broadcast emergency triage status and prioritize critical trauma/OPD cases."}
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !emergencyTriage;
                    setEmergencyTriage(next);
                    showToast(next ? "🚨 Emergency triage broadcast ACTIVATED" : "✓ Emergency triage broadcast disabled");
                  }}
                  style={{
                    background: emergencyTriage ? "#dc2626" : "#0f172a",
                    color: "#ffffff",
                    border: "none",
                    padding: "0.6rem 1.25rem",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  {emergencyTriage ? "Disable Triage Alert" : "Activate Emergency Triage"}
                </button>
              </div>

              {/* Exclusive Healthcare Metrics: OPD Revenue, Consultations, Wait Times */}
              <div
                className="statsGrid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem",
                }}
              >
                <article
                  className="statCard"
                  style={{
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    padding: "1.25rem",
                    borderRadius: "18px",
                  }}
                >
                  <TrendingUp size={24} color="#059669" style={{ marginBottom: "0.5rem" }} />
                  <small style={{ color: "#475569", fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem" }}>
                    Today&apos;s OPD Revenue
                  </small>
                  <strong style={{ fontSize: "2rem", fontWeight: 900, color: "#065f46" }}>
                    ₹{opdRevenue.totalRevenue}
                  </strong>
                  <small style={{ color: "#059669", fontWeight: 600, marginTop: "0.2rem" }}>
                    Projected: ₹{opdRevenue.projectedRevenue}
                  </small>
                </article>

                <article
                  className="statCard"
                  style={{
                    background: "rgba(37, 99, 235, 0.08)",
                    border: "1px solid rgba(37, 99, 235, 0.3)",
                    padding: "1.25rem",
                    borderRadius: "18px",
                  }}
                >
                  <UserCheck size={24} color="#2563eb" style={{ marginBottom: "0.5rem" }} />
                  <small style={{ color: "#475569", fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem" }}>
                    Completed Consultations
                  </small>
                  <strong style={{ fontSize: "2rem", fontWeight: 900, color: "#1e40af" }}>
                    {opdRevenue.completedCount}
                  </strong>
                  <small style={{ color: "#3b82f6", fontWeight: 600, marginTop: "0.2rem" }}>
                    In Queue: {opdRevenue.waitingCount} patients
                  </small>
                </article>

                <article
                  className="statCard"
                  style={{
                    background: "rgba(168, 85, 247, 0.08)",
                    border: "1px solid rgba(168, 85, 247, 0.3)",
                    padding: "1.25rem",
                    borderRadius: "18px",
                  }}
                >
                  <Clock size={24} color="#9333ea" style={{ marginBottom: "0.5rem" }} />
                  <small style={{ color: "#475569", fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem" }}>
                    Avg. Consultation
                  </small>
                  <strong style={{ fontSize: "2rem", fontWeight: 900, color: "#581c87" }}>
                    {queueData?.profile?.consultationMinutes ?? 15}m
                  </strong>
                  <small style={{ color: "#a855f7", fontWeight: 600, marginTop: "0.2rem" }}>
                    Per patient token
                  </small>
                </article>

                <article
                  className="statCard"
                  style={{
                    background: "rgba(245, 158, 11, 0.08)",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    padding: "1.25rem",
                    borderRadius: "18px",
                  }}
                >
                  <Calendar size={24} color="#d97706" style={{ marginBottom: "0.5rem" }} />
                  <small style={{ color: "#475569", fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem" }}>
                    Appointments Scheduled
                  </small>
                  <strong style={{ fontSize: "2rem", fontWeight: 900, color: "#78350f" }}>
                    {queueData?.appointments?.length ?? 0}
                  </strong>
                  <small style={{ color: "#d97706", fontWeight: 600, marginTop: "0.2rem" }}>
                    Active OPD bookings
                  </small>
                </article>
              </div>

              {/* Department / Specialty Presets */}
              <div
                style={{
                  background: "#ffffff",
                  padding: "1rem 1.25rem",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  overflowX: "auto",
                }}
              >
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>
                  Clinical Department:
                </span>
                {SPECIALTY_PRESETS.map((dept) => (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => setSelectedSpecialty(dept.id)}
                    style={{
                      padding: "0.4rem 0.85rem",
                      borderRadius: "9999px",
                      border: "none",
                      background: selectedSpecialty === dept.id ? "#059669" : "#f1f5f9",
                      color: selectedSpecialty === dept.id ? "#ffffff" : "#475569",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {dept.label}
                  </button>
                ))}
              </div>

              {/* Grid: Clinical Tools & Vitals Logger (Left) + Queue Snapshot & Fast Actions (Right) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                  gap: "1.5rem",
                }}
              >
                {/* Clinical Tools: Vitals Quick-Logger */}
                <section
                  className="portalCard"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "20px",
                    padding: "1.5rem",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: "1px solid #f1f5f9",
                      paddingBottom: "0.75rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Activity size={20} color="#059669" />
                      <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                        Clinical Tools & Vitals Logger
                      </h2>
                    </div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "0.2rem 0.5rem",
                        borderRadius: "6px",
                        background: "#ecfdf5",
                        color: "#059669",
                      }}
                    >
                      Nursing Intake
                    </span>
                  </div>

                  <form onSubmit={handleLogVitals} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", display: "block" }}>
                          Patient Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Ramesh Kumar"
                          value={vitalsPatientName}
                          onChange={(e) => setVitalsPatientName(e.target.value)}
                          required
                          style={{
                            width: "100%",
                            padding: "0.55rem 0.75rem",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            fontSize: "0.9rem",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", display: "block" }}>
                          Token #
                        </label>
                        <input
                          type="number"
                          placeholder="12"
                          value={vitalsToken}
                          onChange={(e) => setVitalsToken(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.55rem 0.75rem",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            fontSize: "0.9rem",
                          }}
                        />
                      </div>
                    </div>

                    {/* Vitals inputs: BP, Pulse, SpO2, Temp */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem" }}>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", display: "block" }}>
                          BP (mmHg)
                        </label>
                        <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                          <input
                            type="number"
                            value={vitalsSystolic}
                            onChange={(e) => setVitalsSystolic(e.target.value)}
                            title="Systolic"
                            style={{
                              width: "50%",
                              padding: "0.45rem",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              fontSize: "0.85rem",
                              textAlign: "center",
                            }}
                          />
                          <span>/</span>
                          <input
                            type="number"
                            value={vitalsDiastolic}
                            onChange={(e) => setVitalsDiastolic(e.target.value)}
                            title="Diastolic"
                            style={{
                              width: "50%",
                              padding: "0.45rem",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              fontSize: "0.85rem",
                              textAlign: "center",
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", display: "block" }}>
                          Pulse (bpm)
                        </label>
                        <input
                          type="number"
                          value={vitalsPulse}
                          onChange={(e) => setVitalsPulse(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.45rem",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            fontSize: "0.85rem",
                            textAlign: "center",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", display: "block" }}>
                          SpO2 (%)
                        </label>
                        <input
                          type="number"
                          value={vitalsSpO2}
                          onChange={(e) => setVitalsSpO2(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.45rem",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            fontSize: "0.85rem",
                            textAlign: "center",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", display: "block" }}>
                          Temp (°F)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={vitalsTemp}
                          onChange={(e) => setVitalsTemp(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.45rem",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            fontSize: "0.85rem",
                            textAlign: "center",
                          }}
                        />
                      </div>
                    </div>

                    {/* Weight, Height, BMI */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem" }}>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", display: "block" }}>
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={vitalsWeight}
                          onChange={(e) => setVitalsWeight(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.45rem",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            fontSize: "0.85rem",
                            textAlign: "center",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", display: "block" }}>
                          Height (cm)
                        </label>
                        <input
                          type="number"
                          value={vitalsHeight}
                          onChange={(e) => setVitalsHeight(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.45rem",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            fontSize: "0.85rem",
                            textAlign: "center",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", display: "block" }}>
                          BMI
                        </label>
                        <div
                          style={{
                            padding: "0.45rem",
                            borderRadius: "6px",
                            background: "#f8fafc",
                            border: "1px solid #cbd5e1",
                            fontSize: "0.85rem",
                            textAlign: "center",
                            fontWeight: 800,
                            color: "#0f172a",
                          }}
                        >
                          {computedBmi.bmi}
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", display: "block" }}>
                          Sugar (mg/dL)
                        </label>
                        <input
                          type="number"
                          placeholder="Random"
                          value={vitalsSugar}
                          onChange={(e) => setVitalsSugar(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.45rem",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            fontSize: "0.85rem",
                            textAlign: "center",
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      style={{
                        marginTop: "0.5rem",
                        background: "#059669",
                        color: "#ffffff",
                        padding: "0.65rem",
                        borderRadius: "10px",
                        fontWeight: 800,
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                      }}
                    >
                      + Save Patient Vitals to Record
                    </button>
                  </form>

                  {/* Recently logged vitals */}
                  {vitalsList.length > 0 && (
                    <div style={{ marginTop: "1.25rem" }}>
                      <small style={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem" }}>
                        Recently Logged Vitals ({vitalsList.length})
                      </small>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem", maxHeight: "160px", overflowY: "auto" }}>
                        {vitalsList.slice(0, 5).map((rec) => (
                          <div
                            key={rec.id}
                            style={{
                              padding: "0.6rem 0.8rem",
                              background: "#f8fafc",
                              borderRadius: "8px",
                              border: "1px solid #f1f5f9",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: "0.82rem",
                            }}
                          >
                            <div>
                              <strong>{rec.tokenNumber ? `${rec.tokenNumber} ` : ""}{rec.patientName}</strong>
                              <span style={{ color: "#64748b", marginLeft: "0.5rem" }}>{rec.recordedAt}</span>
                            </div>
                            <div style={{ fontWeight: 700, color: "#059669" }}>
                              BP: {rec.systolic}/{rec.diastolic} · Pulse: {rec.pulse} · SpO2: {rec.spo2}% · BMI: {rec.bmi}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {/* Quick Healthcare Navigation & Prescriptions Hub */}
                <section
                  className="portalCard"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "20px",
                    padding: "1.5rem",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderBottom: "1px solid #f1f5f9",
                        paddingBottom: "0.75rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Stethoscope size={20} color="#059669" />
                        <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                          Clinical Practice Modules
                        </h2>
                      </div>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>
                        Instant Access
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <a
                        href="?tab=queue"
                        style={{
                          padding: "1rem",
                          borderRadius: "14px",
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          textDecoration: "none",
                          color: "#166534",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.3rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <Activity size={18} />
                          <b style={{ fontSize: "0.95rem" }}>Live Queue</b>
                        </div>
                        <small style={{ color: "#15803d" }}>
                          {queueData?.entries?.length ?? 0} active patient tokens
                        </small>
                      </a>

                      <a
                        href="?tab=prescriptions"
                        style={{
                          padding: "1rem",
                          borderRadius: "14px",
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          textDecoration: "none",
                          color: "#1e40af",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.3rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <FileText size={18} />
                          <b style={{ fontSize: "0.95rem" }}>Prescriptions</b>
                        </div>
                        <small style={{ color: "#2563eb" }}>
                          Issue, track & reissue Rx
                        </small>
                      </a>

                      <a
                        href="?tab=doctors"
                        style={{
                          padding: "1rem",
                          borderRadius: "14px",
                          background: "#faf5ff",
                          border: "1px solid #e9d5ff",
                          textDecoration: "none",
                          color: "#6b21a8",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.3rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <Users size={18} />
                          <b style={{ fontSize: "0.95rem" }}>Doctors & Fees</b>
                        </div>
                        <small style={{ color: "#7e22ce" }}>
                          {queueData?.doctors?.length ?? 0} doctors configured
                        </small>
                      </a>

                      <a
                        href="?tab=appointments"
                        style={{
                          padding: "1rem",
                          borderRadius: "14px",
                          background: "#fffbeb",
                          border: "1px solid #fde68a",
                          textDecoration: "none",
                          color: "#92400e",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.3rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <Calendar size={18} />
                          <b style={{ fontSize: "0.95rem" }}>Appointments</b>
                        </div>
                        <small style={{ color: "#b45309" }}>
                          {queueData?.appointments?.length ?? 0} scheduled today
                        </small>
                      </a>

                      <a
                        href="?tab=designer"
                        style={{
                          padding: "1rem",
                          borderRadius: "14px",
                          background: "#fdf2f8",
                          border: "1px solid #fbcfe8",
                          textDecoration: "none",
                          color: "#9d174d",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.3rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <Crown size={18} />
                          <b style={{ fontSize: "0.95rem" }}>Rx Designer</b>
                        </div>
                        <small style={{ color: "#be185d" }}>
                          Canva-like letterhead & logo
                        </small>
                      </a>

                      <a
                        href="?tab=patients"
                        style={{
                          padding: "1rem",
                          borderRadius: "14px",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          textDecoration: "none",
                          color: "#334155",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.3rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <UserCheck size={18} />
                          <b style={{ fontSize: "0.95rem" }}>Patients Directory</b>
                        </div>
                        <small style={{ color: "#64748b" }}>
                          Medical records & history
                        </small>
                      </a>

                      <a
                        href="?tab=products"
                        style={{
                          padding: "1rem",
                          borderRadius: "14px",
                          background: "#f0fdfa",
                          border: "1px solid #ccfbf1",
                          textDecoration: "none",
                          color: "#0f766e",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.3rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <Package size={18} />
                          <b style={{ fontSize: "0.95rem" }}>Products</b>
                        </div>
                        <small style={{ color: "#115e59" }}>
                          Health items, medicine & OTC
                        </small>
                      </a>

                      <a
                        href="?tab=inventory"
                        style={{
                          padding: "1rem",
                          borderRadius: "14px",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          textDecoration: "none",
                          color: "#334155",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.3rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <List size={18} />
                          <b style={{ fontSize: "0.95rem" }}>Inventory</b>
                        </div>
                        <small style={{ color: "#64748b" }}>
                          Stock levels & SKUs
                        </small>
                      </a>

                      <a
                        href="?tab=orders"
                        style={{
                          padding: "1rem",
                          borderRadius: "14px",
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          textDecoration: "none",
                          color: "#1e40af",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.3rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <ShoppingCart size={18} />
                          <b style={{ fontSize: "0.95rem" }}>Orders</b>
                        </div>
                        <small style={{ color: "#2563eb" }}>
                          Purchase orders & delivery
                        </small>
                      </a>

                      <a
                        href="?tab=services"
                        style={{
                          padding: "1rem",
                          borderRadius: "14px",
                          background: "#fdf4ff",
                          border: "1px solid #f5d0fe",
                          textDecoration: "none",
                          color: "#86198f",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.3rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <Briefcase size={18} />
                          <b style={{ fontSize: "0.95rem" }}>Services</b>
                        </div>
                        <small style={{ color: "#a21caf" }}>
                          Procedures & consultation fees
                        </small>
                      </a>

                      <a
                        href="?tab=offers"
                        style={{
                          padding: "1rem",
                          borderRadius: "14px",
                          background: "#fff1f2",
                          border: "1px solid #fecdd3",
                          textDecoration: "none",
                          color: "#be123c",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.3rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <Percent size={18} />
                          <b style={{ fontSize: "0.95rem" }}>Offers</b>
                        </div>
                        <small style={{ color: "#e11d48" }}>
                          Promotions & health packages
                        </small>
                      </a>

                      <a
                        href="?tab=coupons"
                        style={{
                          padding: "1rem",
                          borderRadius: "14px",
                          background: "#ecfeff",
                          border: "1px solid #cffafe",
                          textDecoration: "none",
                          color: "#0e7490",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.3rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <Tags size={18} />
                          <b style={{ fontSize: "0.95rem" }}>Coupons</b>
                        </div>
                        <small style={{ color: "#0891b2" }}>
                          Promo codes & discounts
                        </small>
                      </a>

                      <a
                        href="?tab=memberships"
                        style={{
                          padding: "1rem",
                          borderRadius: "14px",
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          textDecoration: "none",
                          color: "#166534",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.3rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <Shield size={18} />
                          <b style={{ fontSize: "0.95rem" }}>Membership Plans</b>
                        </div>
                        <small style={{ color: "#15803d" }}>
                          Loyalty passes & VIP care
                        </small>
                      </a>

                      <a
                        href="?tab=notifications"
                        style={{
                          padding: "1rem",
                          borderRadius: "14px",
                          background: "#fefce8",
                          border: "1px solid #fef08a",
                          textDecoration: "none",
                          color: "#854d0e",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.3rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <Bell size={18} />
                          <b style={{ fontSize: "0.95rem" }}>Notifications</b>
                        </div>
                        <small style={{ color: "#a16207" }}>
                          Clinic alerts & updates
                        </small>
                      </a>
                    </div>
                  </div>

                  {/* Prescription Designer Promo Box */}
                  <div
                    style={{
                      marginTop: "1.25rem",
                      padding: "1rem",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                      color: "#ffffff",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "0.95rem", display: "block" }}>
                        Digital Prescription Header Designer
                      </strong>
                      <small style={{ opacity: 0.9 }}>
                        Add your clinic logo, doctor registration #, and custom layout.
                      </small>
                    </div>
                    <a
                      href="?tab=designer"
                      style={{
                        background: "#ffffff",
                        color: "#059669",
                        padding: "0.45rem 0.9rem",
                        borderRadius: "8px",
                        fontWeight: 800,
                        fontSize: "0.82rem",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Open Designer →
                    </a>
                  </div>
                </section>
              </div>

              {/* Embedded Live Queue Management for immediate control */}
              {selectedStore && (
                <div style={{ marginTop: "1rem" }}>
                  <OwnerHealthcarePanel
                    storeId={String(selectedStore.id)}
                    initialTab="queue"
                    isShopOwnerMode={false}
                    isHealthcareDashboard={true}
                  />
                </div>
              )}
            </div>
          )}

          {/* DEDICATED HEALTHCARE TABS: Routed to OwnerHealthcarePanel with active initialTab */}
          {[
            "tools",
            "queue",
            "healthcare",
            "doctors",
            "appointments",
            "prescriptions",
            "designer",
            "patients",
            "followups",
            "settings",
          ].includes(tab) &&
            selectedStore && (
              <OwnerHealthcarePanel
                key={`${selectedStore.id}-${tab}`}
                storeId={String(selectedStore.id)}
                initialTab={tab === "healthcare" || tab === "tools" ? "queue" : tab}
                isShopOwnerMode={false}
                isHealthcareDashboard={true}
              />
            )}

          {/* DEDICATED CLINICAL TOOLS TAB */}
          {tab === "clinical_tools" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div className="portalTitleRow">
                <div>
                  <span className="portalEyebrow">Clinical Diagnostic Utilities</span>
                  <h1 style={{ fontSize: "2rem", fontWeight: 900 }}>Clinical Tools & Vitals Intake</h1>
                  <p style={{ color: "#64748b" }}>
                    Quick-logger for nursing intake, BMI calculation, and vital signs monitoring.
                  </p>
                </div>
              </div>

              <section
                className="portalCard"
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "20px",
                  padding: "2rem",
                }}
              >
                <form onSubmit={handleLogVitals} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "680px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.25rem" }}>
                        Patient Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Patient name"
                        value={vitalsPatientName}
                        onChange={(e) => setVitalsPatientName(e.target.value)}
                        required
                        style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.25rem" }}>
                        Queue Token (Optional)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 5"
                        value={vitalsToken}
                        onChange={(e) => setVitalsToken(e.target.value)}
                        style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem" }}>
                    <div>
                      <label style={{ fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.25rem" }}>
                        Blood Pressure
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <input
                          type="number"
                          placeholder="120"
                          value={vitalsSystolic}
                          onChange={(e) => setVitalsSystolic(e.target.value)}
                          style={{ width: "50%", padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1", textAlign: "center" }}
                        />
                        <span>/</span>
                        <input
                          type="number"
                          placeholder="80"
                          value={vitalsDiastolic}
                          onChange={(e) => setVitalsDiastolic(e.target.value)}
                          style={{ width: "50%", padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1", textAlign: "center" }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.25rem" }}>
                        Pulse (bpm)
                      </label>
                      <input
                        type="number"
                        placeholder="72"
                        value={vitalsPulse}
                        onChange={(e) => setVitalsPulse(e.target.value)}
                        style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1", textAlign: "center" }}
                      />
                    </div>

                    <div>
                      <label style={{ fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.25rem" }}>
                        SpO2 (%)
                      </label>
                      <input
                        type="number"
                        placeholder="98"
                        value={vitalsSpO2}
                        onChange={(e) => setVitalsSpO2(e.target.value)}
                        style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1", textAlign: "center" }}
                      />
                    </div>

                    <div>
                      <label style={{ fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.25rem" }}>
                        Temp (°F)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="98.6"
                        value={vitalsTemp}
                        onChange={(e) => setVitalsTemp(e.target.value)}
                        style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1", textAlign: "center" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem" }}>
                    <div>
                      <label style={{ fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.25rem" }}>
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="65"
                        value={vitalsWeight}
                        onChange={(e) => setVitalsWeight(e.target.value)}
                        style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1", textAlign: "center" }}
                      />
                    </div>

                    <div>
                      <label style={{ fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.25rem" }}>
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        placeholder="170"
                        value={vitalsHeight}
                        onChange={(e) => setVitalsHeight(e.target.value)}
                        style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1", textAlign: "center" }}
                      />
                    </div>

                    <div>
                      <label style={{ fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.25rem" }}>
                        Calculated BMI
                      </label>
                      <div
                        style={{
                          padding: "0.65rem",
                          borderRadius: "8px",
                          background: "#f8fafc",
                          border: "1px solid #cbd5e1",
                          textAlign: "center",
                          fontWeight: 800,
                        }}
                      >
                        {computedBmi.bmi} ({computedBmi.category})
                      </div>
                    </div>

                    <div>
                      <label style={{ fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.25rem" }}>
                        Blood Sugar (mg/dL)
                      </label>
                      <input
                        type="number"
                        placeholder="Random glucose"
                        value={vitalsSugar}
                        onChange={(e) => setVitalsSugar(e.target.value)}
                        style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1", textAlign: "center" }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: "#059669",
                      color: "#ffffff",
                      padding: "0.85rem",
                      borderRadius: "12px",
                      fontWeight: 800,
                      fontSize: "1rem",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    + Log & Save Vitals to Record
                  </button>
                </form>

                {vitalsList.length > 0 && (
                  <div style={{ marginTop: "2rem" }}>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "1rem" }}>
                      Patient Intake Logs ({vitalsList.length})
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {vitalsList.map((rec) => (
                        <div
                          key={rec.id}
                          style={{
                            padding: "1rem 1.25rem",
                            background: "#f8fafc",
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "0.5rem",
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: "1rem", color: "#0f172a" }}>
                              {rec.tokenNumber ? `${rec.tokenNumber} · ` : ""}
                              {rec.patientName}
                            </strong>
                            <small style={{ color: "#64748b", marginLeft: "0.75rem" }}>
                              Recorded at {rec.recordedAt}
                            </small>
                          </div>
                          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                            <span style={{ padding: "0.25rem 0.6rem", borderRadius: "6px", background: "#dcfce7", color: "#166534", fontWeight: 700, fontSize: "0.82rem" }}>
                              BP: {rec.systolic}/{rec.diastolic}
                            </span>
                            <span style={{ padding: "0.25rem 0.6rem", borderRadius: "6px", background: "#eff6ff", color: "#1e40af", fontWeight: 700, fontSize: "0.82rem" }}>
                              Pulse: {rec.pulse} bpm
                            </span>
                            <span style={{ padding: "0.25rem 0.6rem", borderRadius: "6px", background: "#fef3c7", color: "#92400e", fontWeight: 700, fontSize: "0.82rem" }}>
                              SpO2: {rec.spo2}%
                            </span>
                            <span style={{ padding: "0.25rem 0.6rem", borderRadius: "6px", background: "#f3f4f6", color: "#374151", fontWeight: 700, fontSize: "0.82rem" }}>
                              Temp: {rec.temperature}°F
                            </span>
                            <span style={{ padding: "0.25rem 0.6rem", borderRadius: "6px", background: "#f5f3ff", color: "#5b21b6", fontWeight: 700, fontSize: "0.82rem" }}>
                              BMI: {rec.bmi} ({rec.bmiCategory})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* PROFILE, SUBSCRIPTION, CHAT, SUPPORT */}
          {tab === "profile" && selectedStore && (
            <section className="portalCard">
              <div className="portalCardHeader">
                <h2>Clinic profile & location</h2>
              </div>
              <OwnerStoreEditor
                categories={categories}
                store={selectedStore}
                onSubmit={async (body) => {
                  await apiFetch("/api/owner/stores", {
                    method: "PATCH",
                    json: { ...(body as object), storeId: selectedStore.id },
                  });
                  showToast("Clinic profile updated");
                  void loadData();
                }}
              />
            </section>
          )}

          {tab === "media" && selectedStore && (
            <div className="portalGrid">
              <section className="portalCard">
                <div className="portalCardHeader">
                  <h2>Upload clinic media</h2>
                  <small>JPEG, PNG, WebP or AVIF · max 8 MB</small>
                </div>
                <form
                  className="portalForm"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    form.set("storeId", String(selectedStore.id));
                    try {
                      await apiFetch("/api/media", { method: "POST", body: form });
                      e.currentTarget.reset();
                      const res = await apiFetch<{ items: Item[] }>(`/api/media?storeId=${encodeURIComponent(String(selectedStore.id))}`);
                      setMedia(res.items || []);
                      showToast("Media uploaded successfully");
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Upload failed");
                    }
                  }}
                >
                  <label>
                    Image type
                    <select name="kind">
                      <option value="logo">Clinic Logo</option>
                      <option value="banner">Clinic Banner</option>
                      <option value="gallery">Facility Photo</option>
                    </select>
                  </label>
                  <label>
                    Image
                    <input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required />
                  </label>
                  <label className="full">
                    Alt text
                    <input name="altText" placeholder="Describe the image (e.g. Clinic Reception)" />
                  </label>
                  <div className="formActions">
                    <button className="portalButton" type="submit" style={{ background: "#059669" }}>
                      Upload image
                    </button>
                  </div>
                </form>
              </section>
              <section className="portalCard">
                <div className="portalCardHeader">
                  <h2>Clinic media library</h2>
                  <small>{media.length} images</small>
                </div>
                <div className="mediaGrid">
                  {media.map((item) => (
                    <article key={String(item.id)}>
                      <img src={String(item.url)} alt={String(item.altText ?? "")} loading="lazy" />
                      <small>{item.kind}</small>
                      <button
                        type="button"
                        onClick={async () => {
                          await apiFetch("/api/media", { method: "DELETE", json: { imageId: item.id, storeId: selectedStore.id } });
                          setMedia((prev) => prev.filter((m) => m.id !== item.id));
                          showToast("Image removed");
                        }}
                      >
                        Delete
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          )}

          {tab === "reviews" && selectedStore && (
            <section className="portalCard">
              <div className="portalCardHeader">
                <h2>Patient reviews</h2>
                <small>{reviewPagination.total} total · Reply professionally to patient feedback</small>
              </div>
              {reviews.length ? (
                reviews.map((item) => (
                  <article className="ownerReview" key={String(item.id)}>
                    <div>
                      <span className={`statusPill ${String(item.status ?? "approved")}`}>{String(item.status ?? "approved")}</span>
                      <b>
                        <Star size={14} style={{ display: "inline", marginRight: "4px" }} /> {item.rating} · {item.reviewerName}
                      </b>
                      <p>{item.comment}</p>
                      {item.ownerReply && <small>Clinic reply: {item.ownerReply}</small>}
                    </div>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const reply = new FormData(e.currentTarget).get("reply");
                        await apiFetch("/api/owner/reviews", {
                          method: "PATCH",
                          json: { storeId: String(selectedStore.id), reviewId: item.id, reply },
                        });
                        showToast("Reply published");
                      }}
                    >
                      <input name="reply" defaultValue={String(item.ownerReply ?? "")} placeholder="Write a professional reply to patient" required />
                      <button className="portalButton secondary" type="submit">
                        Reply
                      </button>
                    </form>
                  </article>
                ))
              ) : (
                <p className="profileEmpty">No patient reviews for this clinic yet.</p>
              )}
            </section>
          )}

          {tab === "analytics" && (
            <section className="portalCard">
              <div className="portalCardHeader">
                <h2>OPD Analytics &amp; 30-Day Footfall</h2>
                <small>Patient views, direction searches &amp; consultation inquiries</small>
              </div>
              <div className="statsGrid">
                {[...new Set(analytics.map((item) => String(item.eventType)))].map((type) => (
                  <article className="statCard" key={type}>
                    <BarChart2 size={24} color="#059669" style={{ marginBottom: "0.5rem" }} />
                    <small>{type}</small>
                    <strong>{analytics.filter((item) => item.eventType === type).reduce((sum, item) => sum + Number(item.total), 0)}</strong>
                  </article>
                ))}
              </div>
            </section>
          )}

          {tab === "chat" && <ChatCenter user={user} />}
          {tab === "subscription" && <UserSubscriptionDashboard />}
          {["products", "services", "offers"].includes(tab) && selectedStore && (
            <CatalogPanel
              resource={tab as "products" | "services" | "offers"}
              storeId={String(selectedStore.id)}
              items={catalog}
              mutate={mutateCatalog}
              onChanged={async (message) => {
                if (selectedStore) {
                  const res = await apiFetch<{ items: Item[] }>(
                    `/api/owner/catalog?resource=${tab}&storeId=${encodeURIComponent(String(selectedStore.id))}`
                  );
                  setCatalog(res.items || []);
                }
                showToast(message);
              }}
              onError={setError}
            />
          )}
          {tab === "memberships" && selectedStore && (
            <OwnerMembershipEditor storeId={String(selectedStore.id)} />
          )}
          {isOwnerWorkspaceView(tab) && tab !== "settings" && selectedStore && (
            <OwnerWorkspacePanel
              key={`${tab}-${selectedStore.id}`}
              view={tab as any}
              storeId={String(selectedStore.id)}
              onToast={showToast}
              onError={setError}
            />
          )}
        </>
      )}

      {toast && (
        <div className="portalToast" role="status">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
