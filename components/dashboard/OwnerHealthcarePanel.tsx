"use client";

import { useCallback, useEffect, useMemo, useRef, useState, startTransition, type FormEvent } from "react";
import { apiFetch } from "@/lib/client-api";
import { OwnerHealthcareQRCard } from "./OwnerHealthcareQRCard";
import { ClinicPatientsTab, PatientHistoryModal } from "@/components/healthcare/ClinicPatientsTab";
import { ClinicPrescriptionsTab } from "@/components/healthcare/ClinicPrescriptionsTab";
import { ClinicFollowupsTab } from "@/components/healthcare/ClinicFollowupsTab";
import { PrescriptionDesigner } from "@/components/healthcare/PrescriptionDesigner";
import { DoctorPrescriptionModal } from "@/components/healthcare/DoctorPrescriptionModal";
import { PrescriptionView } from "@/components/healthcare/PrescriptionView";
import type { PrescriptionRecord } from "@/lib/prescriptions";

type Item = Record<string, string | number | null | undefined>;
type Doctor = { id: string; name: string; specialization?: string; consultationMinutes?: number; consultationFee?: number; status?: string };
type Appointment = { id: string; appointmentDate: string; timeSlot: string; durationMinutes: number; status: string; doctorId?: string; doctorName?: string; patientName?: string; patientPhone?: string; queueEntryId?: string; userName?: string };
type Data = { profile?: Item; entries?: Item[]; analytics?: Item[]; history?: Item[]; events?: Item[]; appointments?: Appointment[]; doctors?: Doctor[] };

type DoctorFormState = { open: boolean; editing: Doctor | null };

function stopEvent(e: FormEvent) { e.preventDefault(); }

let _cachedOwnerAudioCtx: AudioContext | null = null;
let _lastOwnerChimeTime = 0;

function playNewPatientChime() {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - _lastOwnerChimeTime < 2000) return;
  _lastOwnerChimeTime = now;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!_cachedOwnerAudioCtx || _cachedOwnerAudioCtx.state === "closed") {
      _cachedOwnerAudioCtx = new AudioContextClass();
    }
    const ctx = _cachedOwnerAudioCtx;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.15); // D6
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

export function OwnerHealthcarePanel({ storeId }: { storeId: string }) {
  const [data, setData] = useState<Data>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [doctorForm, setDoctorForm] = useState<DoctorFormState>({ open: false, editing: null });
  const [activeTab, setActiveTab] = useState<
    "queue" | "patients" | "prescriptions" | "followups" | "designer" | "settings" | "appointments" | "doctors"
  >("queue");
  const [prescriptionModal, setPrescriptionModal] = useState<{
    open: boolean;
    patientName?: string;
    patientPhone?: string;
    userId?: string;
    patientEmail?: string;
    queueEntryId?: string;
    doctorName?: string;
    doctorId?: string;
    tokenNumber?: number;
    reissueTarget?: PrescriptionRecord | null;
  }>({ open: false });
  const [viewingPrescriptionId, setViewingPrescriptionId] = useState<string | null>(null);
  const [viewingPatientHistory, setViewingPatientHistory] = useState<{ id: string; name: string; phone?: string } | null>(null);

  const prevWaitingCountRef = useRef<number>(-1);
  const prevEntriesSignatureRef = useRef<string>("");
  const sseActiveRef = useRef<boolean>(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }, []);

  const handleIncomingData = useCallback((result: Data) => {
    const entries = result.entries ?? [];
    const waitingCount = entries.filter((e) => e.status === "waiting" || e.status === "called").length;
    const currentSignature = entries.map((e) => `${e.id}:${e.status}:${e.arrivalStatus}:${(e as any).prescriptionStatus || ""}`).join("|");

    if (prevWaitingCountRef.current !== -1) {
      if (waitingCount > prevWaitingCountRef.current) {
        playNewPatientChime();
        showToast("🔔 New patient joined the queue!");
      } else if (currentSignature !== prevEntriesSignatureRef.current && prevEntriesSignatureRef.current !== "") {
        // Status changed (e.g. running late, arrived, etc.)
        const runningLate = entries.find((e) => e.arrivalStatus === "running_late");
        if (runningLate) {
          showToast(`⚠️ Patient #${runningLate.tokenNumber ?? ""} reported running late`);
        }
      }
    }

    prevWaitingCountRef.current = waitingCount;
    prevEntriesSignatureRef.current = currentSignature;

    startTransition(() => {
      setData((prev) => {
        const newHistory = (result.history && result.history.length > 0) ? result.history : (prev.history || []);
        const newAnalytics = (result.analytics && result.analytics.length > 0) ? result.analytics : (prev.analytics || []);
        const newEvents = (result.events && result.events.length > 0) ? result.events : (prev.events || []);

        // Deep diff comparison to prevent pointless component re-renders that cause UI stutter & lag
        const prevEntriesSig = (prev.entries ?? []).map((e) => `${e.id}:${e.status}:${e.arrivalStatus}:${(e as any).prescriptionStatus || ""}`).join("|");
        const nextEntriesSig = currentSignature;
        const prevProfileSig = JSON.stringify(prev.profile ?? {});
        const nextProfileSig = JSON.stringify(result.profile ?? {});
        const prevApptsSig = JSON.stringify(prev.appointments ?? []);
        const nextApptsSig = JSON.stringify(result.appointments ?? []);
        const prevDocsSig = JSON.stringify(prev.doctors ?? []);
        const nextDocsSig = JSON.stringify(result.doctors ?? []);
        const prevHistorySig = JSON.stringify(prev.history ?? []);
        const nextHistorySig = JSON.stringify(newHistory);

        if (
          prevEntriesSig === nextEntriesSig &&
          prevProfileSig === nextProfileSig &&
          prevApptsSig === nextApptsSig &&
          prevDocsSig === nextDocsSig &&
          prevHistorySig === nextHistorySig
        ) {
          // No data has changed: return exact previous state reference to completely avoid re-render
          return prev;
        }

        return {
          ...prev,
          ...result,
          history: newHistory,
          analytics: newAnalytics,
          events: newEvents,
        };
      });
      setError("");
    });
  }, [showToast]);

  const load = useCallback(async (isFast = false) => {
    try {
      const url = `/api/owner/healthcare?storeId=${encodeURIComponent(storeId)}${isFast ? "&fast=1" : ""}`;
      const result = await apiFetch<Data>(url);
      handleIncomingData(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Queue could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [storeId, handleIncomingData]);

  useEffect(() => {
    void load(false);
    let isDisposed = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleNextPoll = () => {
      if (isDisposed) return;
      const isHidden = typeof document !== "undefined" && document.hidden;
      // High-performance polling: If SSE is active, poll lazily; otherwise poll smoothly every 4s
      const delay = isHidden ? 20000 : (sseActiveRef.current ? 12000 : 4000);
      pollTimer = setTimeout(() => {
        if (isDisposed) return;
        void load(true);
        scheduleNextPoll();
      }, delay);
    };
    scheduleNextPoll();

    const handleVisibility = () => {
      if (!document.hidden && !isDisposed) {
        void load(true);
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibility);
    }

    let source: EventSource | null = null;
    try {
      source = new EventSource(`/api/healthcare/queue/manage-stream?storeId=${encodeURIComponent(storeId)}`);
      source.onopen = () => {
        sseActiveRef.current = true;
      };
      source.onerror = () => {
        sseActiveRef.current = false;
      };
      source.addEventListener("queue", (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data) as { queue: Data };
          if (payload?.queue) {
            handleIncomingData(payload.queue);
            setLoading(false);
          }
        } catch {}
      });
    } catch {}

    return () => {
      isDisposed = true;
      if (pollTimer) clearTimeout(pollTimer);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
      if (source) {
        source.close();
        source = null;
      }
    };
  }, [load, storeId, handleIncomingData]);

  // Ensure daily history is loaded when settings tab is opened
  useEffect(() => {
    if (activeTab === "settings" && (!data.history || data.history.length === 0)) {
      void load(false);
    }
  }, [activeTab, data.history, load]);

  // --- Queue actions ---
  const action = useCallback(async (name: string, extra: Record<string, unknown> = {}) => {
    if (busy) return;
    setBusy(name);
    setError("");
    try {
      const updated = await apiFetch<Data>("/api/owner/healthcare", { method: "PATCH", json: { action: name, storeId, ...extra } });
      startTransition(() => {
        setData(updated);
        showToast("Queue updated");
      });
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Queue action failed.");
    } finally {
      setBusy("");
    }
  }, [busy, storeId, showToast]);

  const configure = useCallback((e: FormEvent<HTMLFormElement>) => {
    stopEvent(e);
    const form = new FormData(e.currentTarget);
    void action("configure", {
      ownerQueueEnabled: form.get("ownerQueueEnabled") === "on",
      acceptingPatients: form.get("acceptingPatients") === "on",
      allowAppointments: form.get("allowAppointments") === "on",
      consultationMinutes: Number(form.get("consultationMinutes")),
      openingTime: form.get("openingTime"),
      closingTime: form.get("closingTime"),
      maximumDailyPatients: Number(form.get("maximumDailyPatients")),
      gracePeriodMinutes: Number(form.get("gracePeriodMinutes")),
    });
  }, [action]);

  const addPatient = useCallback((kind: "add_walk_in" | "add_emergency") => {
    const patientName = window.prompt(kind === "add_emergency" ? "Emergency patient name" : "Walk-in patient name");
    if (!patientName) return;
    const patientPhone = window.prompt("Patient contact details (optional)") ?? "";
    void action(kind, { patientName, patientPhone });
  }, [action]);

  // --- Doctor CRUD ---
  const saveDoctor = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    stopEvent(e);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const specialization = String(form.get("specialization") ?? "").trim() || undefined;
    const consultationMinutes = Number(form.get("consultationMinutes") ?? 15);
    const consultationFee = Number(form.get("consultationFee") ?? 500);
    if (!name) { setError("Doctor name is required."); return; }
    setBusy("doctor");
    setError("");
    try {
      const editing = doctorForm.editing;
      await apiFetch("/api/healthcare/doctors", {
        method: "POST",
        json: editing
          ? { action: "update", storeId, doctorId: editing.id, name, specialization, consultationMinutes, consultationFee }
          : { action: "add", storeId, name, specialization, consultationMinutes, consultationFee },
      });
      showToast(editing ? "Doctor updated" : "Doctor added");
      setDoctorForm({ open: false, editing: null });
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save doctor.");
    } finally {
      setBusy("");
    }
  }, [doctorForm.editing, storeId, load, showToast]);

  const removeDoctor = useCallback(async (doctorId: string, name: string) => {
    if (!window.confirm(`Remove Dr. ${name} from this clinic?`)) return;
    setBusy("remove_doctor");
    try {
      await apiFetch("/api/healthcare/doctors", { method: "POST", json: { action: "remove", storeId, doctorId } });
      showToast("Doctor removed");
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove doctor.");
    } finally {
      setBusy("");
    }
  }, [storeId, load, showToast]);

  // --- Derived state ---
  const { profile, entries, waiting, inConsultation, called, nextPatient, activationStatus, queueEligible } = useMemo(() => {
    const prof = data.profile ?? {};
    const ent = data.entries ?? [];
    const w = ent.filter((e) => e.status === "waiting");
    const c = ent.find((e) => e.status === "called");
    const inCons = ent.find((e) => e.status === "in_consultation");
    const act = String(prof.queueActivationStatus ?? "not_requested");
    const elig = prof.providerType !== "pharmacy";
    return {
      profile: prof,
      entries: ent,
      waiting: w,
      inConsultation: inCons,
      called: c,
      nextPatient: w[0],
      activationStatus: act,
      queueEligible: elig,
    };
  }, [data.profile, data.entries]);

  // --- Render helpers ---
  const renderArrivalBadge = (entry: Item) => {
    const arrival = String(entry.arrivalStatus ?? "waiting");
    const lateMin = entry.lateMinutes;
    if (arrival === "running_late") return <span className="healthcareBadge running_late">Late{lateMin ? ` ~${lateMin}m` : ""}</span>;
    if (arrival === "arrived") return <span className="healthcareBadge arrived">Arrived</span>;
    if (arrival === "leaving_now") return <span className="healthcareBadge leaving_now">Leaving now</span>;
    return null;
  };

  const renderStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      called: "healthcareBadge called", in_consultation: "healthcareBadge in_consultation",
      waiting: "healthcareBadge waiting", no_show: "healthcareBadge no_show",
      completed: "healthcareBadge completed", skipped: "healthcareBadge skipped",
      cancelled: "healthcareBadge cancelled", removed: "healthcareBadge removed",
    };
    return <span className={map[status] ?? "healthcareBadge"}>{status.replace(/_/g, " ")}</span>;
  };

  const renderedQueueTable = useMemo(() => {
    return entries.map((entry) => {
      const isActive = entry.status === "called" || entry.status === "in_consultation";
      const isCalling = entry.status === "called";
      const isInConsultation = entry.status === "in_consultation";
      const isWaiting = entry.status === "waiting";
      const isCompleted = entry.status === "completed";
      
      // If we don't want to show certain statuses we can skip them, but user says "completed patients of the day remain visible".
      if (entry.status === "cancelled" || entry.status === "removed" || entry.status === "no_show" || entry.status === "skipped") {
        return null;
      }

      return (
        <article key={String(entry.id)} className={isActive ? "active" : ""} style={isCompleted ? { opacity: 0.8, background: '#f8fafc' } : {}}>
          <b>#{entry.tokenNumber}</b>
          <div className="flex flex-col flex-1 gap-2" style={{ flex: 1 }}>
            <span>
              <strong>
                {entry.isEmergency ? "🚨 Emergency · " : entry.isWalkIn ? "Walk-in · " : ""}
                {String(entry.patientName ?? "Patient")}
              </strong>
              <small className="flex items-center gap-1.5 flex-wrap">
                {renderStatusBadge(String(entry.status))}
                {renderArrivalBadge(entry)}
                {entry.doctorName && <span className="text-slate-400">Dr. {String(entry.doctorName)}</span>}
                <span className="text-slate-500">{new Date(Number(entry.joinedAt) * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                {entry.patientPhone && <span className="text-slate-500">{String(entry.patientPhone)}</span>}
              </small>
            </span>
            
            {/* PRESCRIPTION SECTION */}
            <div className="mt-2 p-3 bg-slate-50 rounded border border-slate-200 text-sm">
              {isWaiting || isCalling ? (
                <div className="text-slate-500">Prescription: Not available yet</div>
              ) : isInConsultation ? (
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setPrescriptionModal({
                        open: true,
                        patientName: String(entry.patientName ?? "Patient"),
                        patientPhone: String(entry.patientPhone ?? ""),
                        userId: entry.userId ? String(entry.userId) : undefined,
                        patientEmail: entry.patientEmail ? String(entry.patientEmail) : undefined,
                        queueEntryId: String(entry.id),
                        doctorName: String(entry.doctorName ?? ""),
                        doctorId: String(entry.doctorId ?? ""),
                      })
                    }
                    className="portalButtonSm primary"
                    style={{ background: "#059669", color: "#ffffff", fontWeight: 800 }}
                  >
                    ℞ Issue Prescription
                  </button>
                </div>
              ) : isCompleted ? (
                entry.prescriptionStatus === 'issued' ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="healthcareBadge" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>
                        🟢 Prescription Issued ✓ {entry.prescriptionNumber ? `(${entry.prescriptionNumber})` : ''}
                      </span>
                      {entry.prescriptionFollowUpDate && (
                        <span className="healthcareBadge" style={{ background: '#f3f4f6', color: '#374151' }}>
                          📅 Follow-up: {entry.prescriptionFollowUpDate} {entry.prescriptionFollowUpFee ? `· ₹${entry.prescriptionFollowUpFee}` : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setViewingPrescriptionId(String(entry.prescriptionId || entry.id))} className="portalButtonSm">👁️ View Prescription</button>
                      <button onClick={() => setViewingPatientHistory({ id: String(entry.id), name: String(entry.patientName), phone: String(entry.patientPhone || "") })} className="portalButtonSm">📋 View Patient History</button>
                    </div>
                  </div>
                ) : entry.prescriptionStatus === 'draft' ? (
                  <div className="flex flex-col gap-2">
                    <div><span className="healthcareBadge" style={{ background: '#fef08a', color: '#854d0e', border: '1px solid #fde047' }}>🟡 Draft Saved</span></div>
                    <div>
                      <button onClick={() => setPrescriptionModal({ open: true, patientName: String(entry.patientName ?? "Patient"), patientPhone: String(entry.patientPhone ?? ""), userId: entry.userId ? String(entry.userId) : undefined, patientEmail: entry.patientEmail ? String(entry.patientEmail) : undefined, queueEntryId: String(entry.id), doctorName: String(entry.doctorName ?? ""), doctorId: String(entry.doctorId ?? "") })} className="portalButtonSm">✏️ Continue Prescription →</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 p-3 bg-red-50 border border-red-200 rounded">
                    <div className="text-red-700 font-semibold">🔴 Prescription Not Issued</div>
                    <div>
                      <button onClick={() => setPrescriptionModal({ open: true, patientName: String(entry.patientName ?? "Patient"), patientPhone: String(entry.patientPhone ?? ""), userId: entry.userId ? String(entry.userId) : undefined, patientEmail: entry.patientEmail ? String(entry.patientEmail) : undefined, queueEntryId: String(entry.id), doctorName: String(entry.doctorName ?? ""), doctorId: String(entry.doctorId ?? ""), tokenNumber: entry.tokenNumber ? Number(entry.tokenNumber) : undefined })} className="portalButtonSm primary" style={{ background: '#10b981', color: 'white', padding: '8px 16px', fontSize: '14px' }}>Issue Prescription →</button>
                    </div>
                  </div>
                )
              ) : null}
            </div>
          </div>
          <div className="tableActions">
            {/* Arrival management */}
            {(isWaiting || isCalling || isInConsultation) && (
              <button
                onClick={() => void action("mark_arrived", { entryId: entry.id })}
                disabled={Boolean(busy)}
                className="portalButtonSm success"
                title="Mark patient as physically arrived"
              >✓ Arrived</button>
            )}
            {/* Call / Consultation flow */}
            {isCalling && (
              <button
                onClick={() => void action("start_consultation", { entryId: entry.id })}
                disabled={Boolean(busy)}
                className="portalButtonSm primary"
              >▶ Start Consult</button>
            )}
            {isCalling && (
              <button onClick={() => void action("recall", { entryId: entry.id })} disabled={Boolean(busy)}>Recall</button>
            )}
            {(isCalling || isInConsultation) && (
              <button onClick={() => void action("complete", { entryId: entry.id })} disabled={Boolean(busy)} className="portalButtonSm success">
                Complete
              </button>
            )}
            {/* Waiting-only */}
            {isWaiting && (
              <button onClick={() => void action("skip", { entryId: entry.id })} disabled={Boolean(busy)}>Skip</button>
            )}
            {/* Call button for waiting patients */}
            {isWaiting && (
              <button
                onClick={() => void action("call_patient", { entryId: entry.id })}
                disabled={Boolean(busy)}
                className="portalButtonSm primary"
                style={{ background: "#2563eb", color: "#ffffff", fontWeight: 700 }}
                title="Call this patient to the counter"
              >Call</button>
            )}
            {/* No-show for called patients */}
            {isCalling && (
              <button
                onClick={() => void action("mark_no_show", { entryId: entry.id })}
                disabled={Boolean(busy)}
                className="portalButtonSm warning"
                title="Mark patient as no-show"
              >No-show</button>
            )}
            {/* Remove */}
            {(isWaiting || isCalling || isInConsultation) && (
              <button className="dangerButton" onClick={() => void action("remove", { entryId: entry.id })} disabled={Boolean(busy)}>Remove</button>
            )}

          </div>
        </article>
      );
    });
  }, [entries, action, busy]);

  const renderedHistory = useMemo(() => {
    const list = data.history ?? [];
    if (!list.length) {
      return (
        <div style={{ padding: "16px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
          No previous queue history recorded yet.
        </div>
      );
    }
    return list.slice(0, 7).map((day) => (
      <div key={String(day.serviceDate)} className="historyRow">
        <span className="historyDate">{String(day.serviceDate)}</span>
        <b>{String(day.completed)}/{String(day.total)} completed</b>
        <small>{String(day.skipped ?? 0)} skipped · {String(day.emergency ?? 0)} emergency</small>
      </div>
    ));
  }, [data.history]);

  const renderedAppointments = useMemo(() => {
    const appts = data.appointments ?? [];
    if (!appts.length) return <p className="portalEmpty">No appointments scheduled for today.</p>;
    return appts.map((a) => {
      const isCheckedIn = a.status === "checked_in";
      const isCancelled = a.status === "cancelled";
      return (
        <article key={a.id} className={`appointmentRow ${isCheckedIn ? "active" : ""} ${isCancelled ? "dimmed" : ""}`}>
          <b className="timeSlot">{a.timeSlot}</b>
          <span>
            <strong>{a.patientName ?? a.userName ?? "Patient"}</strong>
            <small>
              {a.doctorName ? `Dr. ${a.doctorName} · ` : ""}{a.durationMinutes}m
              {a.patientPhone ? ` · ${a.patientPhone}` : ""}
            </small>
          </span>
          {renderStatusBadge(a.status)}
          {a.queueEntryId && <span className="healthcareBadge in_queue">In queue</span>}
        </article>
      );
    });
  }, [data.appointments]);

  const renderedDoctors = useMemo(() => {
    const docs = data.doctors ?? [];
    return docs.map((d) => (
      <article key={d.id} className="doctorRow">
        <div>
          <strong>Dr. {d.name}</strong>
          {d.specialization && <small>{d.specialization}</small>}
          <small>{d.consultationMinutes ?? 15}m per consultation · <b style={{ color: "#10b981", fontWeight: 700 }}>₹{d.consultationFee ?? 500}</b> fee</small>
        </div>
        <div className="tableActions">
          <button onClick={() => setDoctorForm({ open: true, editing: d })}>Edit</button>
          <button className="dangerButton" onClick={() => void removeDoctor(d.id, d.name)} disabled={Boolean(busy)}>Remove</button>
        </div>
      </article>
    ));
  }, [data.doctors, busy, removeDoctor]);

  // --- Not loaded ---
  if (loading) return <div className="portalSkeleton"><span /><span /><span /></div>;
  if (error && !data.profile) return (
    <section className="portalCard">
      <div className="healthcareSetup">
        <span>+</span>
        <h2>Healthcare queue is unavailable</h2>
        <p>{error}</p>
        <small>Live Queue is available only to verified Healthcare businesses after administrator approval.</small>
      </div>
    </section>
  );

  // --- Activation gate ---
  if (activationStatus !== "approved") return <>
    <div className="portalTitleRow">
      <div>
        <span className="portalEyebrow">Healthcare operations</span>
        <h1>Live Queue activation</h1>
        <p>Live Queue is optional and requires administrator approval.</p>
      </div>
    </div>
    {error && <p className="authError" role="alert">{error}</p>}
    <section className="portalCard">
      <div className="healthcareSetup">
        <span>+</span>
        <h2>
          {activationStatus === "pending" ? "Activation request pending"
            : activationStatus === "suspended" ? "Live Queue suspended"
            : activationStatus === "rejected" ? "Activation request rejected"
            : "Request Live Queue"}
        </h2>
        <p>{String(profile.queueDecisionReason ?? (activationStatus === "pending" ? "An administrator is reviewing your request." : "Configure remote patient queueing after approval."))}</p>
        <small>Only verified hospitals, clinics, dental clinics, diagnostic labs, eye clinics, and veterinary clinics can request this feature.</small>
        {queueEligible && profile.verificationStatus === "verified" && activationStatus !== "pending" && activationStatus !== "suspended" && (
          <button className="portalButton" type="button" disabled={Boolean(busy)} onClick={() => void action("request_activation")}>
            Request activation
          </button>
        )}
      </div>
    </section>
  </>;

  // --- Main panel ---
  const currentlyActive = inConsultation ?? called;

  return <>
    <div className="portalTitleRow">
      <div>
        <span className="portalEyebrow">Central Clinic & Doctor Management</span>
        <h1>Healthcare</h1>
        <p>Manage today&apos;s patient queue, consultation records, prescriptions, and follow-ups.</p>
      </div>
      <span className={`statusPill ${String(profile.status ?? "closed")}`}>{String(profile.status ?? "closed")}</span>
    </div>

    {error && <p className="authError" role="alert">{error}</p>}

    {/* Stats */}
    <div className="statsGrid queueStatsGrid">
      <article className="statCard">
        <span>#</span>
        <small>{inConsultation ? "In consultation" : "Now serving"}</small>
        <strong>{currentlyActive?.tokenNumber ?? "—"}</strong>
      </article>
      <article className="statCard">
        <span>→</span>
        <small>Next patient</small>
        <strong>{called && !inConsultation ? nextPatient?.tokenNumber ?? "—" : nextPatient?.tokenNumber ?? "—"}</strong>
      </article>
      <article className="statCard">
        <span>…</span>
        <small>Waiting</small>
        <strong>{waiting.length}</strong>
      </article>
      <article className="statCard">
        <span>◷</span>
        <small>Consultation</small>
        <strong>{profile.consultationMinutes}m</strong>
      </article>
      {(data.appointments?.length ?? 0) > 0 && (
        <article className="statCard">
          <span>📅</span>
          <small>Appointments today</small>
          <strong>{data.appointments?.length ?? 0}</strong>
        </article>
      )}
    </div>

    {/* Control bar */}
    <div className="queueControlBar" aria-label="Queue controls">
      <button onClick={() => void action("open")} disabled={Boolean(busy) || !profile.adminQueueEnabled || !profile.ownerQueueEnabled || profile.status === "open"}>Start queue</button>
      <button onClick={() => void action(profile.status === "paused" ? "resume" : "pause")} disabled={Boolean(busy) || (profile.status !== "open" && profile.status !== "paused")}>
        {profile.status === "paused" ? "Resume" : "Pause"}
      </button>
      <button onClick={() => void action("call_next")} className="primary" disabled={Boolean(busy) || profile.status !== "open" || !!called || !!inConsultation}>
        Call next
      </button>
      {called && !inConsultation && (
        <button onClick={() => void action("start_consultation")} className="primary" disabled={Boolean(busy)}>
          ▶ Start Consult
        </button>
      )}
      <button onClick={() => addPatient("add_walk_in")} disabled={Boolean(busy) || (profile.status !== "open" && profile.status !== "paused")}>+ Walk-in</button>
      <button onClick={() => addPatient("add_emergency")} disabled={Boolean(busy) || (profile.status !== "open" && profile.status !== "paused")}>+ Emergency</button>
      <button onClick={() => void action("close")} disabled={Boolean(busy) || profile.status === "closed"}>End queue</button>
    </div>

    {/* Currently serving banner */}
    {currentlyActive && (
      <div className={`calledPatientBanner ${inConsultation ? "inConsultation" : ""}`}>
        <div className="calledPatientHeader">
          <span>{inConsultation ? "IN CONSULTATION" : "NOW SERVING"}</span>
          <strong>{currentlyActive.tokenNumber}</strong>
        </div>
        <div className="calledPatientInfo">
          <b>{String(currentlyActive.isEmergency ? "🚨 Emergency · " : currentlyActive.isWalkIn ? "Walk-in · " : "")}{String(currentlyActive.patientName ?? "Patient")}</b>
          <small className="flex items-center gap-2 flex-wrap">
            {renderArrivalBadge(currentlyActive)}
            {currentlyActive.doctorName && <span>Dr. {String(currentlyActive.doctorName)}</span>}
            {currentlyActive.patientPhone && <span>{String(currentlyActive.patientPhone)}</span>}
          </small>
        </div>
        <div className="calledPatientActions">
          {!inConsultation && (
            <>
              <button onClick={() => void action("mark_arrived", { entryId: currentlyActive.id })} disabled={Boolean(busy)} className="portalButtonSm success">✓ Arrived</button>
              <button onClick={() => void action("start_consultation", { entryId: currentlyActive.id })} disabled={Boolean(busy)} className="portalButtonSm primary">▶ Start Consult</button>
              <button onClick={() => void action("recall", { entryId: currentlyActive.id })} disabled={Boolean(busy)}>Recall</button>
            </>
          )}
          <button onClick={() => void action("complete", { entryId: currentlyActive.id })} disabled={Boolean(busy)} className="portalButtonSm success">
            {inConsultation ? "✓ Done" : "Complete"}
          </button>
          <button
            type="button"
            onClick={() =>
              setPrescriptionModal({
                open: true,
                patientName: String(currentlyActive.patientName ?? "Patient"),
                patientPhone: String(currentlyActive.patientPhone ?? ""),
                userId: currentlyActive.userId ? String(currentlyActive.userId) : undefined,
                patientEmail: currentlyActive.patientEmail ? String(currentlyActive.patientEmail) : undefined,
                queueEntryId: String(currentlyActive.id),
              })
            }
            className="portalButtonSm primary"
            style={{ background: "#059669", color: "#ffffff", fontWeight: 800 }}
          >
            ℞ Prescribe & Complete
          </button>
          {!inConsultation && (
            <button onClick={() => void action("mark_no_show", { entryId: currentlyActive.id })} disabled={Boolean(busy)} className="portalButtonSm warning">No-show</button>
          )}
          <button onClick={() => void action("skip", { entryId: currentlyActive.id })} disabled={Boolean(busy)}>Skip</button>
          <button className="dangerButton" onClick={() => void action("remove", { entryId: currentlyActive.id })} disabled={Boolean(busy)}>Remove</button>
        </div>
      </div>
    )}

    {/* Tab navigation */}
    <div className="healthcareTabs" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
      <button
        className={`healthcareTab ${activeTab === "queue" ? "active" : ""}`}
        onClick={() => setActiveTab("queue")}
      >
        Live Queue ({entries.length})
      </button>
      <button
        className={`healthcareTab ${activeTab === "patients" ? "active" : ""}`}
        onClick={() => setActiveTab("patients")}
      >
        Patients
      </button>
      <button
        className={`healthcareTab ${activeTab === "prescriptions" ? "active" : ""}`}
        onClick={() => setActiveTab("prescriptions")}
      >
        Prescription History
      </button>
      <button
        className={`healthcareTab ${activeTab === "followups" ? "active" : ""}`}
        onClick={() => setActiveTab("followups")}
      >
        Follow-ups
      </button>
      <button
        className={`healthcareTab ${activeTab === "designer" ? "active" : ""}`}
        onClick={() => setActiveTab("designer")}
      >
        Prescription Design
      </button>
      <button
        className={`healthcareTab ${activeTab === "appointments" ? "active" : ""}`}
        onClick={() => setActiveTab("appointments")}
      >
        Appointments ({data.appointments?.length ?? 0})
      </button>
      <button
        className={`healthcareTab ${activeTab === "doctors" ? "active" : ""}`}
        onClick={() => setActiveTab("doctors")}
      >
        Doctors ({data.doctors?.length ?? 0})
      </button>
      <button
        className={`healthcareTab ${activeTab === "settings" ? "active" : ""}`}
        onClick={() => setActiveTab("settings")}
      >
        Settings
      </button>
    </div>

    {/* Tab content */}
    {activeTab === "queue" && (
      <div className="portalGrid healthcareQueueGrid">
        <section className="portalCard">
          <div className="portalCardHeader">
            <h2>Today&apos;s waiting list</h2>
            <small>{entries.length} tokens issued</small>
          </div>
          <div className="queueTable">{renderedQueueTable}</div>
        </section>
      </div>
    )}

    {activeTab === "appointments" && (
      <div className="portalGrid">
        <section className="portalCard">
          <div className="portalCardHeader">
            <h2>Today&apos;s appointments</h2>
            <small>{data.appointments?.length ?? 0} scheduled</small>
          </div>
          <div className="appointmentList">{renderedAppointments}</div>
        </section>
      </div>
    )}

    {activeTab === "doctors" && (
      <div className="portalGrid">
        <section className="portalCard">
          <div className="portalCardHeader">
            <h2>Doctors at this clinic</h2>
            <button className="portalButtonSm" onClick={() => setDoctorForm({ open: true, editing: null })}>+ Add doctor</button>
          </div>

          {doctorForm.open && (
            <form className="doctorForm" onSubmit={saveDoctor}>
              <h3>{doctorForm.editing ? "Edit doctor" : "Add doctor"}</h3>
              <label>
                <span>Name</span>
                <input name="name" type="text" required placeholder="Dr. Sharma" defaultValue={doctorForm.editing?.name ?? ""} />
              </label>
              <label>
                <span>Specialization</span>
                <input name="specialization" type="text" placeholder="General Medicine" defaultValue={doctorForm.editing?.specialization ?? ""} />
              </label>
              <label>
                <span>Consultation time (min)</span>
                <input name="consultationMinutes" type="number" min="5" max="180" defaultValue={doctorForm.editing?.consultationMinutes ?? 15} />
              </label>
              <label>
                <span>Consultation fee (₹)</span>
                <input name="consultationFee" type="number" min="0" max="100000" step="1" placeholder="500" defaultValue={doctorForm.editing?.consultationFee ?? 500} />
              </label>
              <div className="formActions">
                <button className="portalButton" type="submit" disabled={busy === "doctor"}>{busy === "doctor" ? "Saving…" : doctorForm.editing ? "Save changes" : "Add doctor"}</button>
                <button type="button" onClick={() => setDoctorForm({ open: false, editing: null })}>Cancel</button>
              </div>
            </form>
          )}

          <div className="doctorList">{renderedDoctors}</div>
          {(data.doctors?.length ?? 0) === 0 && !doctorForm.open && <p className="portalEmpty">No doctors added yet.</p>}
        </section>
      </div>
    )}

    {activeTab === "settings" && (
      <div className="portalGrid healthcareQueueGrid">
        <section className="portalCard">
          <div className="portalCardHeader">
            <h2>Queue settings</h2>
            <small>{String(profile.verificationStatus ?? "")}</small>
          </div>
          <form
            key={`${storeId}:${profile.consultationMinutes}:${profile.openingTime}:${profile.closingTime}:${profile.maximumDailyPatients}:${profile.gracePeriodMinutes}:${profile.allowAppointments}`}
            className="toggleList"
            onSubmit={configure}
          >
            <label>
              <span><b>Live Queue</b><small>{profile.adminQueueEnabled ? "Approved by admin" : "Disabled by admin"}</small></span>
              <input name="ownerQueueEnabled" type="checkbox" defaultChecked={Boolean(profile.ownerQueueEnabled)} disabled={!profile.adminQueueEnabled} />
            </label>
            <label>
              <span><b>Accepting patients</b><small>Controls new online joins</small></span>
              <input name="acceptingPatients" type="checkbox" defaultChecked={Boolean(profile.acceptingPatients)} />
            </label>
            <label>
              <span><b>Allow appointments</b><small>Controls online doctor appointment booking</small></span>
              <input name="allowAppointments" type="checkbox" defaultChecked={Boolean(profile.allowAppointments ?? true)} />
            </label>
            <label>
              <span><b>Consultation time</b><small>Minutes used for wait estimates</small></span>
              <input aria-label="Consultation minutes" name="consultationMinutes" type="number" min="5" max="180" defaultValue={Number(profile.consultationMinutes ?? 15)} />
            </label>
            <label>
              <span><b>Grace period</b><small>Minutes a no-show patient is held before removal</small></span>
              <input aria-label="Grace period minutes" name="gracePeriodMinutes" type="number" min="5" max="120" defaultValue={Number(profile.gracePeriodMinutes ?? 30)} />
            </label>
            <label>
              <span><b>Queue opens</b><small>Published schedule · India Standard Time</small></span>
              <input aria-label="Queue opening time" name="openingTime" type="time" defaultValue={String(profile.openingTime ?? "09:00")} />
            </label>
            <label>
              <span><b>Queue closes</b><small>Published schedule · India Standard Time</small></span>
              <input aria-label="Queue closing time" name="closingTime" type="time" defaultValue={String(profile.closingTime ?? "18:00")} />
            </label>
            <label>
              <span><b>Maximum daily tokens</b><small>Includes online and walk-in patients</small></span>
              <input aria-label="Maximum daily tokens" name="maximumDailyPatients" type="number" min="1" max="1000" defaultValue={Number(profile.maximumDailyPatients ?? 100)} />
            </label>
            <button className="portalButton" type="submit" disabled={Boolean(busy)}>
              {busy === "configure" ? "Saving…" : "Save queue settings"}
            </button>
          </form>
          <div className="portalCard" style={{ marginTop: "1.5rem", padding: "1.5rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "16px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#166534", marginBottom: "0.5rem" }}>
              🎨 Prescription Design
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#15803d", marginBottom: "1rem" }}>
              Customize your clinic logo, doctor credentials, header, typography, colors, and margins with the live Canva-like designer.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab("designer")}
              className="portalButton"
              style={{ background: "#059669", color: "#ffffff" }}
            >
              Open Prescription Designer →
            </button>
          </div>
          <div className="queueHistory"><h3>Daily history</h3>{renderedHistory}</div>
        </section>
      </div>
    )}

    {activeTab === "patients" && (
      <ClinicPatientsTab
        storeId={storeId}
        onPrescribeForPatient={(name, phone) =>
          setPrescriptionModal({ open: true, patientName: name, patientPhone: phone })
        }
        onViewPrescription={() => {
          setActiveTab("prescriptions");
        }}
      />
    )}

    {activeTab === "prescriptions" && (
      <ClinicPrescriptionsTab
        storeId={storeId}
        storeName={String(profile.name || "Clinic")}
        onNewPrescription={() => setPrescriptionModal({ open: true })}
        onReissuePrescription={(rx) =>
          setPrescriptionModal({ open: true, reissueTarget: rx })
        }
      />
    )}

    {activeTab === "followups" && (
      <ClinicFollowupsTab
        storeId={storeId}
        onToast={showToast}
        onPrescribeForFollowUp={(name, phone) =>
          setPrescriptionModal({ open: true, patientName: name, patientPhone: phone })
        }
      />
    )}

    {activeTab === "designer" && (
      <PrescriptionDesigner
        storeId={storeId}
        storeName={String(profile.name || "Clinic")}
        onToast={showToast}
      />
    )}

    {prescriptionModal.open && (
      <DoctorPrescriptionModal
        storeId={storeId}
        storeName={String(profile.name || "Clinic")}
        onClose={() => setPrescriptionModal({ open: false })}
        onSuccess={(prescriptionId, rxNumber) => {
          setPrescriptionModal({ open: false });
          showToast(`Prescription #${rxNumber} issued successfully!`);
          void load();
          setActiveTab("prescriptions");
        }}
        initialPatientName={prescriptionModal.patientName}
        initialPatientPhone={prescriptionModal.patientPhone}
        initialUserId={prescriptionModal.userId}
        initialPatientEmail={prescriptionModal.patientEmail}
        queueEntryId={prescriptionModal.queueEntryId}
        doctors={data.doctors}
        reissueTarget={prescriptionModal.reissueTarget}
      />
    )}

    {viewingPrescriptionId && (
      <QuickPrescriptionModal
        storeId={storeId}
        queueEntryId={viewingPrescriptionId}
        onClose={() => setViewingPrescriptionId(null)}
      />
    )}

    {viewingPatientHistory && (
      <PatientHistoryModal
        storeId={storeId}
        patientName={viewingPatientHistory.name}
        patientPhone={viewingPatientHistory.phone}
        onClose={() => setViewingPatientHistory(null)}
        onViewPrescription={(rxId) => {
          setViewingPatientHistory(null);
          setViewingPrescriptionId(rxId);
        }}
      />
    )}

    <OwnerHealthcareQRCard />
    {toast && <div className="portalToast" role="status">✓ {toast}</div>}
  </>;
}

function QuickPrescriptionModal({ storeId, queueEntryId, onClose }: { storeId: string; queueEntryId: string; onClose: () => void }) {
  const [rx, setRx] = useState<PrescriptionRecord | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    apiFetch<{ prescription?: PrescriptionRecord; prescriptions?: PrescriptionRecord[] }>(
      `/api/healthcare/prescriptions?queueEntryId=${encodeURIComponent(queueEntryId)}`
    )
      .then((res) => {
        if (res?.prescription) {
          setRx(res.prescription);
        } else if (res?.prescriptions && res.prescriptions.length > 0) {
          const found = res.prescriptions.find((p: PrescriptionRecord) => p.queueEntryId === queueEntryId || p.id === queueEntryId) || res.prescriptions[0];
          setRx(found);
        } else {
          return apiFetch<{ prescriptions: PrescriptionRecord[] }>(`/api/healthcare/prescriptions?storeId=${encodeURIComponent(storeId)}`)
            .then((storeRes) => {
              const found = storeRes?.prescriptions?.find((p: PrescriptionRecord) => p.queueEntryId === queueEntryId || p.id === queueEntryId);
              if (found) setRx(found);
              else setError("Prescription not found.");
            });
        }
      })
      .catch((e: Error) => setError(e.message || "Failed to load prescription"));
  }, [storeId, queueEntryId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col relative">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-slate-100 rounded-full shadow-sm text-slate-500 cursor-pointer">
          ✕
        </button>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {error ? <div className="p-8 text-center text-red-500 font-medium">{error}</div> :
           rx ? <PrescriptionView prescription={rx} onClose={onClose} /> :
           <div className="p-8 text-center text-slate-500 font-medium">Loading prescription details...</div>}
        </div>
      </div>
    </div>
  );
}
