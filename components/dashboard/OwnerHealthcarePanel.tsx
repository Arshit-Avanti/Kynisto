"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/client-api";

type Item = Record<string, string | number | null | undefined>;
type Data = { profile?: Item; entries?: Item[]; analytics?: Item[]; history?: Item[]; events?: Item[] };

export function OwnerHealthcarePanel({ storeId }: { storeId: string }) {
  const [data, setData] = useState<Data>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await apiFetch<Data>(`/api/owner/healthcare?storeId=${encodeURIComponent(storeId)}`));
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Queue could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    void load();
    const source = new EventSource(`/api/healthcare/queue/manage-stream?storeId=${encodeURIComponent(storeId)}`);
    source.addEventListener("queue", (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { queue: Data };
      setData(payload.queue);
      setLoading(false);
    });
    return () => source.close();
  }, [load, storeId]);

  async function action(name: string, extra: Record<string, unknown> = {}) {
    if (busy) return;
    setBusy(name);
    setError("");
    try {
      await apiFetch("/api/owner/healthcare", { method: "PATCH", json: { action: name, storeId, ...extra } });
      setToast("Queue updated");
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Queue action failed.");
    } finally {
      setBusy("");
    }
  }

  function configure(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void action("configure", {
      ownerQueueEnabled: form.get("ownerQueueEnabled") === "on",
      acceptingPatients: form.get("acceptingPatients") === "on",
      consultationMinutes: Number(form.get("consultationMinutes")),
      openingTime: form.get("openingTime"),
      closingTime: form.get("closingTime"),
      maximumDailyPatients: Number(form.get("maximumDailyPatients")),
    });
  }

  function addPatient(kind: "add_walk_in" | "add_emergency") {
    const patientName = window.prompt(kind === "add_emergency" ? "Emergency patient name" : "Walk-in patient name");
    if (!patientName) return;
    const patientPhone = window.prompt("Patient contact details (optional)") ?? "";
    void action(kind, { patientName, patientPhone });
  }

  if (loading) return <div className="portalSkeleton"><span /><span /><span /></div>;
  if (error && !data.profile) return <section className="portalCard"><div className="healthcareSetup"><span>+</span><h2>Healthcare queue is unavailable</h2><p>{error}</p><small>Live Queue is available only to verified Healthcare businesses after administrator approval.</small></div></section>;

  const profile = data.profile ?? {};
  const entries = data.entries ?? [];
  const waiting = entries.filter((entry) => entry.status === "waiting");
  const called = entries.find((entry) => entry.status === "called");
  const nextPatient = waiting[0];
  const activationStatus = String(profile.queueActivationStatus ?? "not_requested");
  const queueEligible = profile.providerType !== "pharmacy";

  if (activationStatus !== "approved") return <>
    <div className="portalTitleRow"><div><span className="portalEyebrow">Healthcare operations</span><h1>Live Queue activation</h1><p>Live Queue is optional and requires administrator approval.</p></div></div>
    {error && <p className="authError" role="alert">{error}</p>}
    <section className="portalCard"><div className="healthcareSetup"><span>+</span><h2>{activationStatus === "pending" ? "Activation request pending" : activationStatus === "suspended" ? "Live Queue suspended" : activationStatus === "rejected" ? "Activation request rejected" : "Request Live Queue"}</h2><p>{String(profile.queueDecisionReason ?? (activationStatus === "pending" ? "An administrator is reviewing your request." : "Configure remote patient queueing after approval."))}</p><small>Only verified hospitals, clinics, dental clinics, diagnostic labs, eye clinics, and veterinary clinics can request this feature.</small>{queueEligible && profile.verificationStatus === "verified" && activationStatus !== "pending" && activationStatus !== "suspended" && <button className="portalButton" type="button" disabled={Boolean(busy)} onClick={() => void action("request_activation")}>Request activation</button>}</div></section>
  </>;

  return <>
    <div className="portalTitleRow"><div><span className="portalEyebrow">Healthcare operations</span><h1>Live Queue</h1><p>Manage today&apos;s patient flow for this provider only.</p></div><span className={`statusPill ${profile.status}`}>{String(profile.status ?? "closed")}</span></div>
    {error && <p className="authError" role="alert">{error}</p>}
    <div className="statsGrid queueStatsGrid">
      <article className="statCard"><span>#</span><small>Current patient</small><strong>{called?.tokenNumber ?? "—"}</strong></article>
      <article className="statCard"><span>→</span><small>Next patient</small><strong>{nextPatient?.tokenNumber ?? "—"}</strong></article>
      <article className="statCard"><span>…</span><small>Waiting</small><strong>{waiting.length}</strong></article>
      <article className="statCard"><span>◷</span><small>Consultation</small><strong>{profile.consultationMinutes}m</strong></article>
    </div>
    <div className="queueControlBar" aria-label="Queue controls">
      <button onClick={() => void action("open")} disabled={Boolean(busy) || !profile.adminQueueEnabled || !profile.ownerQueueEnabled || profile.status === "open"}>Start queue</button>
      <button onClick={() => void action(profile.status === "paused" ? "resume" : "pause")} disabled={Boolean(busy) || (profile.status !== "open" && profile.status !== "paused")}>{profile.status === "paused" ? "Resume" : "Pause"}</button>
      <button onClick={() => void action("call_next")} className="primary" disabled={Boolean(busy) || profile.status !== "open"}>Call next</button>
      <button onClick={() => addPatient("add_walk_in")} disabled={Boolean(busy) || (profile.status !== "open" && profile.status !== "paused")}>+ Walk-in</button>
      <button onClick={() => addPatient("add_emergency")} disabled={Boolean(busy) || (profile.status !== "open" && profile.status !== "paused")}>+ Emergency</button>
      <button onClick={() => void action("close")} disabled={Boolean(busy) || profile.status === "closed"}>End queue</button>
    </div>
    <div className="portalGrid healthcareQueueGrid">
      <section className="portalCard"><div className="portalCardHeader"><h2>Today&apos;s waiting list</h2><small>{entries.length} tokens issued</small></div>
        {called && <div className="calledPatient"><span>NOW SERVING</span><strong>{called.tokenNumber}</strong><div><b>{called.patientName}</b><small>{called.isEmergency ? "Emergency · " : called.isWalkIn ? "Walk-in · " : ""}{String(called.arrivalStatus ?? "waiting").replaceAll("_", " ")}</small></div><button onClick={() => void action("recall", { entryId: called.id })}>Recall</button><button onClick={() => void action("complete", { entryId: called.id })}>Complete</button><button onClick={() => void action("skip", { entryId: called.id })}>Skip</button><button className="dangerButton" onClick={() => void action("remove", { entryId: called.id })}>Remove</button></div>}
        <div className="queueTable">{entries.map((entry) => <article key={String(entry.id)} className={entry.status === "called" ? "active" : ""}><b>#{entry.tokenNumber}</b><span><strong>{entry.isEmergency ? "Emergency · " : entry.isWalkIn ? "Walk-in · " : ""}{entry.patientName}</strong><small>{entry.status} · {String(entry.arrivalStatus ?? "waiting").replaceAll("_", " ")} · {new Date(Number(entry.joinedAt) * 1000).toLocaleTimeString()}</small></span>{entry.status === "waiting" && <div className="tableActions"><button onClick={() => void action("skip", { entryId: entry.id })}>Skip</button><button className="dangerButton" onClick={() => void action("remove", { entryId: entry.id })}>Remove</button></div>}</article>)}</div>
      </section>
      <section className="portalCard"><div className="portalCardHeader"><h2>Queue settings</h2><small>{profile.verificationStatus}</small></div>
        <form key={`${storeId}:${profile.consultationMinutes}:${profile.openingTime}:${profile.closingTime}:${profile.maximumDailyPatients}`} className="toggleList" onSubmit={configure}><label><span><b>Live Queue</b><small>{profile.adminQueueEnabled ? "Approved by admin" : "Disabled by admin"}</small></span><input name="ownerQueueEnabled" type="checkbox" defaultChecked={Boolean(profile.ownerQueueEnabled)} disabled={!profile.adminQueueEnabled} /></label><label><span><b>Accepting patients</b><small>Controls new online joins</small></span><input name="acceptingPatients" type="checkbox" defaultChecked={Boolean(profile.acceptingPatients)} /></label><label><span><b>Consultation time</b><small>Minutes used for wait estimates</small></span><input aria-label="Consultation minutes" name="consultationMinutes" type="number" min="5" max="180" defaultValue={Number(profile.consultationMinutes ?? 15)} /></label><label><span><b>Queue opens</b><small>Published schedule · India Standard Time</small></span><input aria-label="Queue opening time" name="openingTime" type="time" defaultValue={String(profile.openingTime ?? "09:00")} /></label><label><span><b>Queue closes</b><small>Published schedule · India Standard Time</small></span><input aria-label="Queue closing time" name="closingTime" type="time" defaultValue={String(profile.closingTime ?? "18:00")} /></label><label><span><b>Maximum daily tokens</b><small>Includes online and walk-in patients</small></span><input aria-label="Maximum daily tokens" name="maximumDailyPatients" type="number" min="1" max="1000" defaultValue={Number(profile.maximumDailyPatients ?? 100)} /></label><button className="portalButton" type="submit" disabled={Boolean(busy)}>{busy === "configure" ? "Saving…" : "Save queue settings"}</button></form>
        <div className="queueHistory"><h3>Daily history</h3>{(data.history ?? []).slice(0, 7).map((day) => <div key={String(day.serviceDate)}><span>{day.serviceDate}</span><b>{day.completed}/{day.total} completed</b><small>{day.skipped} skipped</small></div>)}</div>
      </section>
    </div>
    {toast && <div className="portalToast" role="status">✓ {toast}</div>}
  </>;
}
