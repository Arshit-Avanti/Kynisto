"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/client-api";
import { BulkDeleteBar, RowSelectCheckbox, SelectAllCheckbox, useAdminBulkSelection } from "@/components/dashboard/AdminBulkSelection";

type Item = Record<string, string | number | null | undefined>;
type QueueData = { profile: Item | null; entries: Item[]; analytics: Item[]; history: Item[]; events: Item[] };
type Data = { items: Item[]; stats: Item; reports: Item[]; types: string[]; queue: QueueData | null };
const emptyData: Data = { items: [], stats: {}, reports: [], types: [], queue: null };

export function AdminHealthcarePanel() {
  const [data, setData] = useState<Data>(emptyData);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async (storeId = "") => {
    const suffix = storeId ? `?storeId=${encodeURIComponent(storeId)}` : "";
    try {
      setData(await apiFetch<Data>(`/api/admin/healthcare${suffix}`));
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Healthcare operations could not be loaded.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!selectedId) return;
    const source = new EventSource(`/api/healthcare/queue/manage-stream?storeId=${encodeURIComponent(selectedId)}`);
    source.addEventListener("queue", (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { queue: QueueData };
      setData((current) => ({ ...current, queue: payload.queue }));
    });
    return () => source.close();
  }, [selectedId]);

  async function configureProvider(item: Item, values: { providerType?: string; verification?: string }) {
    try {
      await apiFetch("/api/admin/healthcare", { method: "PATCH", json: {
        action: "configure_provider",
        storeId: item.id,
        providerType: values.providerType ?? item.providerType ?? "clinic",
        verificationStatus: values.verification ?? item.verificationStatus ?? "pending",
      } });
      setToast("Healthcare provider updated");
      await load(selectedId);
    } catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Provider could not be updated."); }
  }

  async function queueAccess(item: Item, decision: "approve" | "reject" | "enable" | "disable" | "suspend" | "delete") {
    if (busy) return;
    let reason: string | null = null;
    if (decision === "reject" || decision === "suspend") {
      reason = window.prompt(`Reason to ${decision} Live Queue`)?.trim() ?? "";
      if (reason.length < 5) return;
    }
    if (decision === "delete" && !window.confirm(`Delete the complete queue for ${String(item.name)}? Active patients and queue entries will be permanently removed.`)) return;
    setBusy(`${item.id}:${decision}`);
    try {
      await apiFetch("/api/admin/healthcare", { method: "PATCH", json: { action: "queue_access", storeId: item.id, decision, reason } });
      setToast(`Queue ${decision} action completed`);
      if (decision === "delete" && selectedId === String(item.id)) setSelectedId("");
      await load(decision === "delete" ? "" : selectedId);
    } catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Queue access could not be changed."); }
    finally { setBusy(""); }
  }

  async function manageQueue(item: Item) {
    const id = String(item.id);
    setSelectedId(id);
    await load(id);
  }

  async function operate(queueAction: string, entryId?: unknown) {
    if (!selectedId || busy) return;
    if (queueAction === "reset" && !window.confirm("Reset today’s queue? Active patients will be removed and token numbering will restart at 1.")) return;
    let patientName: string | undefined;
    let patientPhone: string | undefined;
    if (queueAction === "add_walk_in" || queueAction === "add_emergency") {
      patientName = window.prompt(queueAction === "add_emergency" ? "Emergency patient name" : "Walk-in patient name")?.trim();
      if (!patientName) return;
      patientPhone = window.prompt("Patient contact details (optional)") ?? "";
    }
    setBusy(`${selectedId}:${queueAction}`);
    try {
      await apiFetch("/api/admin/healthcare", { method: "PATCH", json: { action: "queue_action", storeId: selectedId, queueAction, entryId, patientName, patientPhone } });
      setToast("Queue updated");
      await load(selectedId);
    } catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Queue action failed."); }
    finally { setBusy(""); }
  }

  async function configureQueue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId || busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(`${selectedId}:configure`);
    try {
      await apiFetch("/api/admin/healthcare", { method: "PATCH", json: {
        action: "configure_queue", storeId: selectedId,
        acceptingPatients: form.get("acceptingPatients") === "on",
        consultationMinutes: Number(form.get("consultationMinutes")),
        openingTime: form.get("openingTime"), closingTime: form.get("closingTime"),
        maximumDailyPatients: Number(form.get("maximumDailyPatients")),
      } });
      setToast("Queue settings saved");
      await load(selectedId);
    } catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Queue settings could not be saved."); }
    finally { setBusy(""); }
  }

  async function updateReport(reportId: unknown, status: string) {
    try { await apiFetch("/api/admin/healthcare", { method: "PATCH", json: { action: "update_report", reportId, status } }); await load(selectedId); }
    catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Report could not be updated."); }
  }

  const items = data.items.filter((item) => {
    const matchesSearch = !query || `${item.name} ${item.ownerName ?? ""} ${item.category}`.toLowerCase().includes(query.toLowerCase());
    const status = String(item.queueActivationStatus ?? "not_requested");
    const matchesFilter = !filter || (filter === "active" ? Boolean(item.adminQueueEnabled && item.ownerQueueEnabled && item.queueStatus === "open") : status === filter);
    return matchesSearch && matchesFilter;
  });
  const selection = useAdminBulkSelection(items.map((item) => String(item.id)));
  const selected = data.items.find((item) => String(item.id) === selectedId);
  const queueStatus = String(data.queue?.profile?.status ?? "closed");
  const entries = data.queue?.entries ?? [];
  const activeEntries = entries.filter((entry) => entry.status === "waiting" || entry.status === "called");

  async function bulkDelete() {
    try {
      await apiFetch("/api/admin/healthcare", { method: "DELETE", json: { storeIds: selection.selectedIds } });
      setToast(`${selection.selectedIds.length} healthcare provider${selection.selectedIds.length === 1 ? "" : "s"} deleted`);
      if (selection.selectedIds.includes(selectedId)) setSelectedId("");
      await load();
      return true;
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Healthcare providers could not be deleted.");
      return false;
    }
  }

  return <>
    <div className="portalTitleRow"><div><span className="portalEyebrow">Independent care network</span><h1>Healthcare Queue Management</h1><p>Approve optional queue access, operate every clinic queue, monitor usage, and resolve queue issues.</p></div></div>
    {error && <p className="authError" role="alert">{error}</p>}
    <div className="statsGrid queueStatsGrid"><article className="statCard"><span>+</span><small>Healthcare providers</small><strong>{data.items.length}</strong></article><article className="statCard"><span>●</span><small>Live queues</small><strong>{Number(data.stats.activeQueues ?? 0)}</strong></article><article className="statCard"><span>✓</span><small>Completed visits</small><strong>{Number(data.stats.completed ?? 0)}</strong></article><article className="statCard"><span>◷</span><small>Average wait</small><strong>{Number(data.stats.averageWaitMinutes ?? 0)}m</strong></article></div>
    <div className="portalToolbar healthcareAdminToolbar"><input type="search" placeholder="Search healthcare providers" value={query} onChange={(event) => setQuery(event.target.value)} /><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">All queue access</option><option value="pending">Pending requests</option><option value="approved">Approved</option><option value="suspended">Suspended</option><option value="rejected">Rejected</option><option value="active">Live now</option></select></div>
    <section className="portalCard"><div className="portalCardHeader"><h2>Provider controls</h2><small>{items.length} providers</small></div><div className="portalTableWrap"><table className="portalTable healthcareAdminTable"><thead><tr><th><SelectAllCheckbox checked={selection.allSelected} onChange={selection.toggleAll} label="healthcare providers" /></th><th>Provider</th><th>Type</th><th>Verification</th><th>Queue access</th><th>Today</th><th>Actions</th></tr></thead><tbody>{items.map((item) => {
      const activation = String(item.queueActivationStatus ?? "not_requested");
      const enabled = Boolean(item.adminQueueEnabled && item.ownerQueueEnabled);
      return <tr key={String(item.id)}><td><RowSelectCheckbox checked={selection.selected.has(String(item.id))} onChange={() => selection.toggle(String(item.id))} label={String(item.name)} /></td><td><b>{item.name}</b><small>{item.category} · {item.ownerName ?? "No owner assigned"}</small></td><td><select value={String(item.providerType ?? "clinic")} onChange={(event) => void configureProvider(item, { providerType: event.target.value })}>{data.types.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select></td><td><select value={String(item.verificationStatus ?? "pending")} onChange={(event) => void configureProvider(item, { verification: event.target.value })}><option value="pending">Pending</option><option value="verified">Verified</option><option value="rejected">Rejected</option></select></td><td><span className={`statusPill ${activation}`}>{activation.replaceAll("_", " ")}</span><small>{enabled ? `${item.queueStatus ?? "closed"} · owner enabled` : item.queueDecisionReason ?? "Opt-in only"}</small></td><td><b>{item.waitingCount ?? 0} waiting</b><small>{item.completedToday ?? 0} completed</small></td><td><div className="tableActions queueAccessActions">{activation === "pending" && <><button className="portalButton" onClick={() => void queueAccess(item, "approve")}>Approve</button><button onClick={() => void queueAccess(item, "reject")}>Reject</button></>}{activation !== "pending" && !enabled && <button className="portalButton" onClick={() => void queueAccess(item, "enable")}>Enable queue</button>}{activation === "approved" && enabled && <button onClick={() => void queueAccess(item, "disable")}>Disable</button>}{activation === "approved" && <button onClick={() => void queueAccess(item, "suspend")}>Suspend</button>}{activation === "suspended" && <button onClick={() => void queueAccess(item, "enable")}>Restore</button>}{activation === "approved" && enabled && <button onClick={() => void manageQueue(item)}>Manage</button>}<button className="dangerButton" onClick={() => void queueAccess(item, "delete")}>Delete queue</button></div></td></tr>;
    })}</tbody></table></div></section>
    <BulkDeleteBar count={selection.selectedIds.length} itemLabel="healthcare provider" onDelete={bulkDelete} onDeleted={selection.clear} />

    {selected && data.queue && <section className="portalCard adminQueueConsole"><div className="portalCardHeader"><div><h2>{selected.name} queue</h2><small>Global admin control · {queueStatus} · current token {String(data.queue.profile?.currentTokenNumber || "—")}</small></div><button type="button" onClick={() => { setSelectedId(""); void load(); }}>Close console</button></div><div className="queueAdminActions"><button className="portalButton" disabled={Boolean(busy) || queueStatus === "open"} onClick={() => void operate(queueStatus === "paused" ? "resume" : "open")}>{queueStatus === "paused" ? "Resume" : "Start queue"}</button><button disabled={Boolean(busy) || queueStatus !== "open"} onClick={() => void operate("pause")}>Pause</button><button disabled={Boolean(busy) || queueStatus !== "open"} onClick={() => void operate("call_next")}>Call next</button><button disabled={Boolean(busy)} onClick={() => void operate("add_walk_in")}>+ Walk-in</button><button disabled={Boolean(busy)} onClick={() => void operate("add_emergency")}>+ Emergency</button><button disabled={Boolean(busy) || queueStatus === "closed"} onClick={() => void operate("close")}>End queue</button><button className="dangerButton" disabled={Boolean(busy)} onClick={() => void operate("reset")}>Reset today</button></div>
      <div className="adminQueueLayout"><div className="workspaceList">{activeEntries.length ? activeEntries.map((entry) => <article key={String(entry.id)}><div><b>Token {entry.tokenNumber} · {entry.patientName}</b><p>{entry.status}{entry.isWalkIn ? " · walk-in" : ""}{entry.isEmergency ? " · emergency" : ""}{entry.patientPhone ? ` · ${entry.patientPhone}` : ""}</p></div><div className="tableActions">{entry.status === "waiting" && <button disabled={Boolean(busy)} onClick={() => void operate("skip", entry.id)}>Skip</button>}{entry.status === "called" && <><button className="portalButton" disabled={Boolean(busy)} onClick={() => void operate("recall", entry.id)}>Recall</button><button className="portalButton" disabled={Boolean(busy)} onClick={() => void operate("complete", entry.id)}>Complete</button><button disabled={Boolean(busy)} onClick={() => void operate("skip", entry.id)}>Skip</button></>}<button className="dangerButton" disabled={Boolean(busy)} onClick={() => void operate("remove", entry.id)}>Remove</button></div></article>) : <p className="profileEmpty">No patients are currently waiting.</p>}</div>
        <form key={`${selectedId}:${data.queue.profile?.consultationMinutes}:${data.queue.profile?.openingTime}:${data.queue.profile?.closingTime}:${data.queue.profile?.maximumDailyPatients}`} className="toggleList adminQueueSettings" onSubmit={configureQueue}><h3>Queue settings</h3><label><span><b>Accepting patients</b><small>Controls online joins</small></span><input name="acceptingPatients" type="checkbox" defaultChecked={Boolean(selected.acceptingPatients ?? true)} /></label><label><span><b>Consultation minutes</b><small>Average time used for wait estimates</small></span><input aria-label="Consultation minutes" name="consultationMinutes" type="number" min="5" max="180" defaultValue={Number(data.queue.profile?.consultationMinutes ?? 15)} /></label><label><span><b>Opening time</b><small>Published queue schedule · India time</small></span><input aria-label="Queue opening time" name="openingTime" type="time" defaultValue={String(data.queue.profile?.openingTime ?? "09:00")} /></label><label><span><b>Closing time</b><small>Published queue schedule · India time</small></span><input aria-label="Queue closing time" name="closingTime" type="time" defaultValue={String(data.queue.profile?.closingTime ?? "18:00")} /></label><label><span><b>Maximum daily tokens</b><small>Maximum online and walk-in tokens</small></span><input aria-label="Maximum daily tokens" name="maximumDailyPatients" type="number" min="1" max="1000" defaultValue={Number(data.queue.profile?.maximumDailyPatients ?? 100)} /></label><button className="portalButton" disabled={Boolean(busy)} type="submit">{busy.endsWith(":configure") ? "Saving…" : "Save settings"}</button></form></div>
      <details className="queueLog"><summary>Queue history and activity log</summary>{(data.queue.events ?? []).slice(0, 30).map((event, index) => <div key={`${event.createdAt}-${index}`}><b>{String(event.eventType).replaceAll("_", " ")}</b><span>{new Date(Number(event.createdAt) * 1000).toLocaleString()}</span></div>)}</details>
    </section>}

    <section className="portalCard queueReports"><div className="portalCardHeader"><h2>Reported queue issues</h2><small>{data.reports.filter((item) => item.status === "open").length} open</small></div>{data.reports.length ? data.reports.map((item) => <article key={String(item.id)}><div><b>{item.storeName} · {item.reason}</b><p>{item.details || "No additional details"}</p><small>{item.reporterName ?? "User"} · {new Date(Number(item.createdAt) * 1000).toLocaleString()}</small></div><select value={String(item.status)} onChange={(event) => void updateReport(item.id, event.target.value)}><option value="open">Open</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select></article>) : <p className="profileEmpty">No queue issues have been reported.</p>}</section>
    {toast && <div className="portalToast" role="status">✓ {toast}</div>}
  </>;
}
