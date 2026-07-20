"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { apiFetch } from "@/lib/client-api";

type Provider = {
  id: string; name: string; slug: string; description: string; address: string; area: string;
  rating: number; reviews: number; providerType: string; acceptingPatients: number;
  emergencyAvailable: number; adminQueueEnabled: number; ownerQueueEnabled: number;
  queueActivationStatus: string; queueStatus: string | null; currentTokenNumber: number; consultationMinutes: number;
  openingTime: string; closingTime: string; maximumDailyPatients: number; waitingCount: number;
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

const icons: Record<string, string> = { hospital: "H", clinic: "+", dental_clinic: "D", diagnostic_lab: "⌁", pharmacy: "Rx", eye_clinic: "◉", veterinary_clinic: "V" };

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
    source.onerror = () => {
      // Keep the native EventSource retry behavior for continuous queue updates.
    };
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

  const arrivalNotice = queueState?.arrivalReminder && queueState.entry ? <div className="queueArrivalReminder" role="alert"><b>Your turn is approaching</b><span>Please arrive at {activeProvider?.name ?? "the clinic"}. Your estimated wait is about {queueState.entry.estimatedWaitMinutes} minutes.</span></div> : null;
  const queueUnavailableMessage = !queueState
    ? canJoinQueue ? "Queue details are being refreshed." : role === "store_owner" ? "Queue joining is available to customers and administrators." : "Log in to join this live queue."
    : queueState.status === "paused"
    ? "The queue is paused temporarily."
    : queueState.status !== "open"
      ? "The queue has not been started."
      : !queueState.acceptingPatients
        ? "This provider is not accepting online patients."
        : !queueState.capacityAvailable
          ? "Today’s token limit has been reached."
          : !queueState.queueAvailable
            ? "Live Queue is currently unavailable."
            : "";

  return <main className="healthPage">{arrivalNotice}
    <header className="healthNav"><Link href="/" className="healthBrand"><KynistoLogo /><span>Healthcare</span></Link><nav><Link href="/">Local discovery</Link><Link href="/dashboard">My dashboard</Link></nav></header>
    <section className="healthHero">
      <div><span className="healthKicker">Independent healthcare network · DLF Ankur Vihar</span><h1>Local care, <em>without the waiting-room guesswork.</em></h1><p>Find verified providers near Karawal Nagar and see live queue status before you leave home.</p>
        <form className="healthSearch" onSubmit={(event) => { event.preventDefault(); void load(); }}><label><span>Search healthcare</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Clinic, lab, pharmacy or provider name" /></label><button type="submit">Find care</button></form>
        <div className="healthTrust"><span><b>{items.length}</b> verified providers</span><span><b>28.7381° N</b> local results</span><span><b>Live</b> queue updates</span></div>
      </div>
      <aside className="queuePreview"><div className="queuePulse"><span /></div><small>LIVE QUEUE</small><strong>Know your turn</strong><p>Join remotely. Follow the current token. Arrive when your turn is close.</p><div><span>Now serving</span><b>{Math.max(1, ...items.map((item) => Number(item.currentTokenNumber ?? 0)))}</b></div></aside>
    </section>
    <section className="careTypes" aria-label="Healthcare types">{types.map((item) => <button type="button" key={item.value} className={type === item.value ? "active" : ""} onClick={() => setType(type === item.value ? "" : item.value)}><i>{icons[item.value]}</i><span>{item.label}<small>Near DLF Ankur Vihar</small></span></button>)}</section>
    <section className="healthResults">
      <div className="resultsHeading"><div><span>Verified local care</span><h2>{type ? types.find((item) => item.value === type)?.label : "All healthcare providers"}</h2></div><label className="queueToggle"><input type="checkbox" checked={queueOnly} onChange={(event) => setQueueOnly(event.target.checked)} /><span>Live Queue open now</span></label></div>
      {error && <p className="healthError" role="alert">{error}</p>}
      {loading ? <div className="healthSkeleton"><span /><span /><span /></div> : <div className="providerGrid">{items.map((provider) => {
        const queueEnabled = Boolean(provider.queueActivationStatus === "approved" && provider.adminQueueEnabled && provider.ownerQueueEnabled);
        const queueOpen = Boolean(queueEnabled && provider.queueStatus === "open");
        const queueJoinable = Boolean(queueOpen && provider.acceptingPatients);
        return <article key={provider.id} className={activeStore === provider.id ? "selected" : ""}><div className="providerTop"><i>{icons[provider.providerType]}</i><div><span>{types.find((item) => item.value === provider.providerType)?.label}</span><h3>{provider.name}</h3></div><b>★ {Number(provider.rating).toFixed(1)}</b></div>{queueEnabled && <span className="liveQueueBadge">● Live Queue Available</span>}<p>{provider.description}</p><address>{provider.address}</address><div className="providerMeta"><span>{provider.reviews} reviews</span><span>{provider.acceptingPatients ? "Accepting patients" : "Not accepting patients"}</span>{provider.emergencyAvailable ? <span>Emergency care</span> : null}</div>{queueEnabled && <div className={`queueStrip ${queueOpen ? "open" : "closed"}`}><div><small>{queueOpen ? "LIVE QUEUE OPEN" : provider.queueStatus === "paused" ? "QUEUE PAUSED" : "QUEUE CLOSED"}</small><b>{queueOpen ? `${provider.waitingCount} waiting · ${provider.consultationMinutes || 15} min/visit` : `${provider.openingTime ?? "09:00"}–${provider.closingTime ?? "18:00"}`}</b><span>{queueOpen ? `${provider.openingTime ?? "09:00"}–${provider.closingTime ?? "18:00"} · max ${provider.maximumDailyPatients || 100} tokens` : `${provider.consultationMinutes || 15} min/visit · max ${provider.maximumDailyPatients || 100} tokens`}</span></div>{queueOpen && <div><small>NOW SERVING</small><strong>{provider.currentTokenNumber || "—"}</strong></div>}</div>}<div className="providerActions"><Link href={`/stores/${provider.slug}`}>View profile</Link>{queueEnabled && <button type="button" disabled={!queueJoinable} onClick={() => selectQueue(provider.id)}>{activeStore === provider.id ? "Queue selected" : queueJoinable ? "Join / view live queue" : queueOpen ? "Not accepting new patients" : "Queue currently closed"}</button>}</div></article>;
      })}</div>}
      {!loading && !items.length && <div className="healthEmpty"><h3>No providers match these filters</h3><p>Try another type or show queues that are currently closed.</p></div>}
    </section>
    {activeStore && <div className={`queueDock ${queueBusy ? "isBusy" : ""}`} role="region" aria-label="Your live queue" aria-busy={queueLoading || Boolean(queueBusy)}><button className="dockClose" type="button" disabled={Boolean(queueBusy)} onClick={() => { setActiveStore(""); setQueueState(null); setQueueLoading(false); }} aria-label="Close queue panel">×</button><div><span>LIVE QUEUE · {queueState?.status === "open" ? "OPEN" : String(queueState?.status ?? (authReady ? "READY" : "CHECKING")).toUpperCase()}</span><h2>{activeProvider?.name ?? queueState?.storeName ?? "Healthcare provider"}</h2><p>Current token <b>{queueState?.currentTokenNumber || "—"}</b> · {queueState?.waitingCount ?? 0} waiting{queueState ? ` · ${queueState.consultationMinutes} min/visit · max ${queueState.maximumDailyPatients} tokens` : ""}</p></div>{queueLoading && !queueState ? <div className="queueDockLoader" role="status"><i /><span>Checking the live queue…</span></div> : queueState?.entry ? <><div className="patientToken"><small>YOUR TOKEN</small><strong>{queueState.entry.tokenNumber}</strong></div><div className="patientPosition"><small>{queueState.entry.status === "called" ? "Your turn" : "People ahead"}</small><b>{queueState.entry.status === "called" ? "Please proceed" : Math.max(0, queueState.entry.position - 1)}</b><span>Approx. {queueState.entry.estimatedWaitMinutes} min</span></div><div className="dockActions"><button type="button" disabled={Boolean(queueBusy)} onClick={() => void updateArrival("leaving_now")}>{queueBusy === "leaving_now" ? "Updating…" : "I’m leaving now"}</button><button type="button" disabled={Boolean(queueBusy)} onClick={() => void updateArrival("running_late")}>{queueBusy === "running_late" ? "Updating…" : "Running late"}</button><button type="button" disabled={Boolean(queueBusy)} onClick={() => void queueAction("cancel")}>{queueBusy === "cancel" ? "Leaving…" : "Cancel queue"}</button><button type="button" disabled={Boolean(queueBusy)} onClick={() => void reportQueue()}>Report issue</button></div></> : <div className="dockJoin"><p><b>{queueUnavailableMessage || "Join remotely and receive an alert as your turn approaches."}</b><span>{queueState ? ` Published hours ${queueState.openingTime}–${queueState.closingTime}.` : ""}</span></p><button type="button" onClick={() => void queueAction("join")} disabled={!authReady || queueLoading || Boolean(queueBusy) || role === "store_owner" || (canJoinQueue && !queueState?.queueAvailable)}>{queueBusy === "join" ? "Joining…" : queueLoading ? "Checking…" : !canJoinQueue ? role === "store_owner" ? "Customer / Admin only" : "Log in to join" : "Join Live Queue"}</button></div>}</div>}
    <footer className="healthFooter"><Link href="/"><KynistoLogo showTagline /></Link><p>Healthcare discovery is informational. For emergencies, contact local emergency services immediately.</p></footer>
  </main>;
}
