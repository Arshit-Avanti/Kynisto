"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { apiFetch } from "@/lib/client-api";
import {
  Activity,
  Stethoscope,
  HeartPulse,
  ShieldAlert,
  Clock,
  MapPin,
  Star,
  Users,
  CheckCircle2,
  Building2,
  Phone,
  ArrowRight,
  Search,
  Sparkles,
  Ticket,
  AlertCircle,
  X
} from "lucide-react";

type Provider = {
  id: string; name: string; slug: string; description: string; address: string; area: string;
  rating: number; reviews: number; providerType: string; acceptingPatients: number;
  emergencyAvailable: number; adminQueueEnabled: number; ownerQueueEnabled: number;
  queueActivationStatus: string; queueStatus: string | null; currentTokenNumber: number; consultationMinutes: number;
  openingTime: string; closingTime: string; maximumDailyPatients: number; waitingCount: number;
  logoUrl?: string | null;
};

type TypeItem = { value: string; label: string };

type QueueState = {
  status: string; storeName: string; consultationMinutes: number; currentTokenNumber: number; waitingCount: number;
  queueAvailable: boolean; withinOperatingHours: boolean; capacityAvailable: boolean;
  openingTime: string; closingTime: string; maximumDailyPatients: number; dailyPatientCount: number;
  acceptingPatients: number; adminQueueEnabled: number; ownerQueueEnabled: number;
  verificationStatus: string; queueActivationStatus: string; arrivalReminder: boolean;
  activeQueue: null | { storeId: string; storeName: string; storeSlug: string; tokenNumber: number; status: string; expiresAt: number };
  entry: null | { id: string; tokenNumber: number; status: string; position: number; estimatedWaitMinutes: number; arrivalStatus: string; expiresAt: number };
};

const categoryIcons: Record<string, React.ElementType> = {
  clinic: Stethoscope,
  hospital: Building2,
  dental_clinic: HeartPulse,
  diagnostic_lab: Activity,
  pharmacy: Sparkles,
  eye_clinic: Stethoscope,
  veterinary_clinic: Activity,
};

export function HealthcareDiscovery() {
  const requestedProvider = useSearchParams().get("provider") ?? "";
  const [items, setItems] = useState<Provider[]>([]);
  const [types, setTypes] = useState<TypeItem[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [queueOnly, setQueueOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeStore, setActiveStore] = useState(requestedProvider);
  const [queueState, setQueueState] = useState<QueueState | null>(null);
  const [queueLoading, setQueueLoading] = useState(Boolean(requestedProvider));
  const [queueBusy, setQueueBusy] = useState("");
  const canJoinQueue = role === "customer" || role === "admin";

  const queueUnavailableMessage =
    queueState && !queueState.queueAvailable
      ? !queueState.withinOperatingHours
        ? `Queue is closed. Operating hours are ${queueState.openingTime} – ${queueState.closingTime}.`
        : !queueState.capacityAvailable
        ? `Queue is full. Maximum daily capacity of ${queueState.maximumDailyPatients} patients reached.`
        : "Queue is currently closed."
      : "";

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ q: query, type, queue: String(queueOnly) });
      const result = await apiFetch<{ items: Provider[]; types: TypeItem[] }>(`/api/healthcare?${params}`);
      setItems(result.items); setTypes(result.types);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Healthcare providers could not be loaded."); }
    finally { if (!silent) setLoading(false); }
  }, [query, queueOnly, type]);

  const updateQueueState = useCallback((next: QueueState | null) => {
    setQueueState((current) => JSON.stringify(current) === JSON.stringify(next) ? current : next);
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 180); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => {
    apiFetch<{ user: { role: string } | null }>("/api/auth/me")
      .then((result) => setRole(result.user?.role ?? null))
      .catch(() => setRole(null))
      .finally(() => setAuthReady(true));
  }, []);
  useEffect(() => {
    if (!canJoinQueue) return;
    apiFetch<{ state: QueueState | null; activeStoreId: string | null }>("/api/healthcare/queue")
      .then((result) => {
        if (result.activeStoreId && result.state) {
          setActiveStore(result.activeStoreId);
          updateQueueState(result.state);
          setQueueLoading(false);
        }
      })
      .catch(() => undefined);
  }, [canJoinQueue, updateQueueState]);
  useEffect(() => {
    if (!activeStore || !canJoinQueue) return;
    let active = true;
    setQueueLoading(true);
    apiFetch<{ state: QueueState }>(`/api/healthcare/queue?storeId=${encodeURIComponent(activeStore)}`)
      .then((result) => { if (active) updateQueueState(result.state); })
      .catch((stateError) => { if (active) setError(stateError instanceof Error ? stateError.message : "Queue status could not be loaded."); })
      .finally(() => { if (active) setQueueLoading(false); });
    const source = new EventSource(`/api/healthcare/queue/stream?storeId=${encodeURIComponent(activeStore)}`);
    source.addEventListener("queue", (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { state: QueueState };
      updateQueueState(payload.state);
      setQueueLoading(false);
    });
    return () => { active = false; source.close(); };
  }, [activeStore, canJoinQueue, updateQueueState]);

  const activeProvider = useMemo(() => items.find((item) => item.id === activeStore), [activeStore, items]);

  async function queueAction(action: "join" | "leave" | "cancel") {
    if (!canJoinQueue) {
      if (role === "store_owner") setError("Queue joining is available to customers and administrators.");
      else window.location.assign(`/login?returnTo=${encodeURIComponent("/healthcare")}`);
      return;
    }
    if (!activeStore || queueBusy) return;
    setQueueBusy(action);
    setError("");
    try {
      const result = await apiFetch<{ state: QueueState }>("/api/healthcare/queue", { method: "POST", json: { action, storeId: activeStore } });
      updateQueueState(result.state);
      void load(true);
    } catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Queue action failed."); }
    finally { setQueueBusy(""); }
  }

  async function updateArrival(arrivalStatus: "leaving_now" | "running_late") {
    if (!activeStore || queueBusy) return;
    setQueueBusy(arrivalStatus);
    setError("");
    try {
      const result = await apiFetch<{ state: QueueState }>("/api/healthcare/queue", { method: "POST", json: { action: "update_arrival", storeId: activeStore, arrivalStatus } });
      updateQueueState(result.state);
    } catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Arrival update failed."); }
    finally { setQueueBusy(""); }
  }

  async function reportQueue() {
    if (!activeStore || !queueState?.entry) return;
    const reason = window.prompt("Describe the queue issue");
    if (!reason) return;
    try { await apiFetch("/api/healthcare/queue", { method: "POST", json: { action: "report", storeId: activeStore, entryId: queueState.entry.id, reason } }); }
    catch (reportError) { setError(reportError instanceof Error ? reportError.message : "Report could not be submitted."); }
  }

  function selectQueue(storeId: string) {
    if (storeId === activeStore) return;
    setError("");
    setQueueState(null);
    setQueueLoading(canJoinQueue);
    setActiveStore(storeId);
  }

  const arrivalNotice = queueState?.arrivalReminder && queueState.entry ? (
    <div className="queueArrivalReminder flex items-center gap-3 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-white mb-6 backdrop-blur-xl">
      <AlertCircle size={24} className="text-orange-400 shrink-0" />
      <div>
        <b className="block text-sm font-bold">Your turn is approaching!</b>
        <span className="text-xs text-slate-300">Please arrive at {activeProvider?.name ?? "the clinic"}. Approx. {queueState.entry.estimatedWaitMinutes} min wait.</span>
      </div>
    </div>
  ) : null;

  return (
    <main className="healthPage min-h-screen bg-[#140A0C] text-slate-100 p-4 md:p-8">
      {arrivalNotice}
      <header className="healthNav flex items-center justify-between py-4 border-b border-orange-500/15 mb-8">
        <Link href="/" className="healthBrand flex items-center gap-3">
          <KynistoLogo showTagline />
          <span className="px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-xs font-bold text-orange-400">Healthcare Portal</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-semibold">
          <Link href="/" className="hover:text-orange-400 transition-colors">Local Discovery</Link>
          <Link href="/dashboard" className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-lg shadow-orange-500/20">My Dashboard</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="healthHero relative overflow-hidden rounded-3xl p-8 md:p-12 mb-10 border border-orange-500/20 bg-gradient-to-br from-slate-900/90 via-[#1c0c0f]/80 to-slate-900/90 backdrop-blur-xl shadow-2xl">
        <div className="max-w-3xl relative z-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-xs font-extrabold text-orange-400 uppercase tracking-widest mb-4">
            <Activity size={14} /> Verified Healthcare Network
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight mb-4">
            Local care, <em className="not-italic text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">without the waiting-room guesswork.</em>
          </h1>
          <p className="text-slate-300 text-base md:text-lg mb-8">
            Find verified clinics & doctors near DLF Ankur Vihar. Track live queue status and join remotely before leaving home.
          </p>

          <form className="healthSearch flex flex-col md:flex-row gap-3 p-2 rounded-2xl bg-white/5 border border-white/15 backdrop-blur-xl mb-6" onSubmit={(event) => { event.preventDefault(); void load(); }}>
            <div className="flex-1 flex items-center gap-3 px-4 py-2">
              <Search size={20} className="text-orange-400 shrink-0" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search clinic, doctor, diagnostic lab or pharmacy…"
                className="w-full bg-transparent border-0 text-white placeholder-slate-400 focus:outline-none text-base"
              />
            </div>
            <button type="submit" className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all">
              Find Care
            </button>
          </form>

          <div className="healthTrust flex flex-wrap gap-6 text-xs text-slate-300 font-semibold">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-400" /> <b className="text-white">{items.length}</b> Verified Providers</span>
            <span className="flex items-center gap-1.5"><MapPin size={16} className="text-orange-400" /> <b className="text-white">28.7381° N</b> Local Results</span>
            <span className="flex items-center gap-1.5"><Ticket size={16} className="text-orange-400" /> <b className="text-white">Live</b> Queue Tokens</span>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="careTypes grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-10" aria-label="Healthcare categories">
        {types.map((item) => {
          const IconComponent = categoryIcons[item.value] ?? Stethoscope;
          const isActive = type === item.value;
          return (
            <button
              type="button"
              key={item.value}
              onClick={() => setType(isActive ? "" : item.value)}
              className={`flex flex-col items-center p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                isActive
                  ? "bg-gradient-to-br from-orange-500/25 to-red-500/25 border-orange-500 text-white shadow-lg shadow-orange-500/20 -translate-y-1"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20"
              }`}
            >
              <IconComponent size={24} className={`mb-2 ${isActive ? "text-orange-400" : "text-slate-400"}`} />
              <span className="text-xs font-bold text-center">{item.label}</span>
            </button>
          );
        })}
      </section>

      {/* Provider List */}
      <section className="healthResults mb-12">
        <div className="resultsHeading flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Verified Local Care</span>
            <h2 className="text-2xl font-black text-white">{type ? types.find((item) => item.value === type)?.label : "All Healthcare Providers"}</h2>
          </div>
          <label className="queueToggle flex items-center gap-2 cursor-pointer bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold text-slate-200">
            <input type="checkbox" checked={queueOnly} onChange={(event) => setQueueOnly(event.target.checked)} className="accent-orange-500" />
            <span>Show Live Queues Open Now</span>
          </label>
        </div>

        {error && <p className="healthError p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-6" role="alert">{error}</p>}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-3xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="providerGrid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((provider) => {
              const queueEnabled = Boolean(provider.queueActivationStatus === "approved" && provider.adminQueueEnabled && provider.ownerQueueEnabled);
              const queueOpen = Boolean(queueEnabled && provider.queueStatus === "open");
              const queueJoinable = Boolean(queueOpen && provider.acceptingPatients);
              const IconComp = categoryIcons[provider.providerType] ?? Stethoscope;

              return (
                <article
                  key={provider.id}
                  className={`providerCard p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
                    activeStore === provider.id
                      ? "bg-gradient-to-b from-slate-900/95 to-[#1e0e11]/95 border-orange-500 shadow-2xl shadow-orange-500/20 -translate-y-1"
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:-translate-y-1"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        {provider.logoUrl ? (
                          <img src={provider.logoUrl} alt={provider.name} className="w-12 h-12 rounded-2xl object-cover border border-white/20" />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
                            <IconComp size={22} />
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-400">
                            {types.find((item) => item.value === provider.providerType)?.label}
                          </span>
                          <h3 className="text-lg font-bold text-white leading-snug">{provider.name}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold shrink-0">
                        <Star size={12} fill="currentColor" /> {Number(provider.rating).toFixed(1)}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 mb-4">{provider.description || "Verified local medical clinic & doctor consultation."}</p>
                    <address className="not-italic text-xs text-slate-400 flex items-center gap-1.5 mb-4">
                      <MapPin size={14} className="text-orange-400 shrink-0" /> {provider.address}
                    </address>

                    {queueEnabled && (
                      <div className={`p-4 rounded-2xl border mb-4 ${queueOpen ? "bg-emerald-500/10 border-emerald-500/30" : "bg-slate-800/40 border-slate-700/40"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${queueOpen ? "text-emerald-400" : "text-slate-400"}`}>
                            {queueOpen ? "● LIVE QUEUE OPEN" : "QUEUE CLOSED"}
                          </span>
                          {queueOpen && (
                            <span className="text-xs font-extrabold text-white">Serving #{provider.currentTokenNumber || 1}</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-300 flex items-center justify-between">
                          <span>{provider.waitingCount} patients waiting</span>
                          <span>~{provider.consultationMinutes || 15} min/patient</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {`max ${provider.maximumDailyPatients}`}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <Link
                      href={`/stores/${provider.slug}`}
                      className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs text-center border border-white/10 transition-colors"
                    >
                      View Profile
                    </Link>
                    {queueEnabled && (
                      <button
                        type="button"
                        disabled={!queueJoinable}
                        onClick={() => selectQueue(provider.id)}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          activeStore === provider.id
                            ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                            : queueJoinable
                            ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                            : "bg-slate-800 text-slate-500 cursor-not-allowed"
                        }`}
                      >
                        {activeStore === provider.id ? "Queue Selected" : queueJoinable ? "Join Live Queue" : "Queue Closed"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Floating Queue Dock */}
      {activeStore && (
        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-[420px] z-50 p-6 rounded-3xl bg-slate-950/95 border border-orange-500/40 shadow-2xl backdrop-blur-2xl text-white">
          <button
            type="button"
            onClick={() => { setActiveStore(""); setQueueState(null); setQueueLoading(false); }}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 block mb-1">
              LIVE QUEUE · {queueState?.status === "open" ? "OPEN" : "READY"}
            </span>
            <h3 className="text-xl font-black text-white">{activeProvider?.name ?? queueState?.storeName ?? "Healthcare Clinic"}</h3>
          </div>

          {queueLoading && !queueState ? (
            <div className="py-6 text-center text-sm text-slate-400">Loading live queue radar…</div>
          ) : queueState?.entry ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">YOUR TICKET</span>
                  <strong className="text-3xl font-black text-white">#{queueState.entry.tokenNumber}</strong>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-300 block">{queueState.entry.status === "called" ? "Your turn!" : "People ahead"}</span>
                  <strong className="text-xl font-bold text-orange-400">{queueState.entry.status === "called" ? "Proceed inside" : Math.max(0, queueState.entry.position - 1)}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={Boolean(queueBusy)}
                  onClick={() => void updateArrival("leaving_now")}
                  className="py-2.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-300 font-bold text-xs hover:bg-orange-500/30 transition-colors"
                >
                  I’m Leaving Now
                </button>
                <button
                  type="button"
                  disabled={Boolean(queueBusy)}
                  onClick={() => void updateArrival("running_late")}
                  className="py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs hover:bg-amber-500/30 transition-colors"
                >
                  Running Late
                </button>
              </div>

              <button
                type="button"
                disabled={Boolean(queueBusy)}
                onClick={() => void queueAction("cancel")}
                className="w-full py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 font-bold text-xs hover:bg-red-500/30 transition-colors"
              >
                Cancel My Ticket
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">{queueUnavailableMessage || "Join remotely and get notified when your turn approaches."}</p>
              <button
                type="button"
                onClick={() => void queueAction("join")}
                disabled={!authReady || queueLoading || Boolean(queueBusy) || role === "store_owner" || (canJoinQueue && !queueState?.queueAvailable)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
              >
                {queueBusy === "join" ? "Joining…" : "Join Live Queue"}
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
