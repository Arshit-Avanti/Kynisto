"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/client-api";
import { CatalogMediaControl } from "@/components/dashboard/CatalogMediaControl";
import { BulkDeleteBar, RowSelectCheckbox, SelectAllCheckbox, useAdminBulkSelection } from "@/components/dashboard/AdminBulkSelection";

type Item = Record<string, unknown>;
type Payload = Record<string, unknown>;
type WorkspaceMutation = (m: "POST" | "PATCH" | "DELETE", b: Payload, s: string) => Promise<boolean>;

function Status({ value }: { value: unknown }) { const text = String(value ?? "unknown"); return <span className={`statusPill ${text}`}>{text.replaceAll("_", " ")}</span>; }
function Empty({ text }: { text: string }) { return <div className="emptyPortal"><div><b>No records</b><p>{text}</p></div></div>; }

export const ADMIN_WORKSPACE_TABS = new Set(["products", "orders", "notifications", "banners", "coupons", "support", "settings", "audit", "security"]);

export function AdminWorkspacePanel({ tab }: { tab: string }) {
  const [data, setData] = useState<Payload>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await apiFetch<Payload>(`/api/admin/workspace?view=${tab}&limit=50`)); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Could not load admin workspace."); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 2300); return () => clearTimeout(timer); }, [toast]);

  async function mutate(method: "POST" | "PATCH" | "DELETE", json: Payload, message: string) {
    setError("");
    try { await apiFetch("/api/admin/workspace", { method, json }); setToast(message); await load(); return true; }
    catch (mutationError) { setError(mutationError instanceof Error ? mutationError.message : "Action failed."); return false; }
  }

  async function exportResource(resource: string, format: "json" | "csv") {
    setError("");
    try {
      const response = await fetch(`/api/admin/workspace?view=export&resource=${resource}&format=${format}`, { credentials: "same-origin" });
      if (!response.ok) throw new Error("Export failed.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `kynisto-${resource}.${format}`; anchor.click(); URL.revokeObjectURL(url);
      setToast(`${resource} export ready`);
    } catch (exportError) { setError(exportError instanceof Error ? exportError.message : "Export failed."); }
  }

  if (loading) return <div className="portalSkeleton"><span /><span /><span /></div>;
  const items = (data.items as Item[] | undefined) ?? [];
  return <>{error && <p className="authError" role="alert">{error}</p>}{tab === "products" && <Products items={items} stores={(data.stores as Item[] | undefined) ?? []} mutate={mutate} exportResource={exportResource} reload={load} onToast={setToast} onError={setError} />}{tab === "orders" && <Orders items={items} mutate={mutate} exportResource={exportResource} />}{tab === "notifications" && <Notifications items={items} mutate={mutate} />}{tab === "banners" && <Banners items={items} mutate={mutate} />}{tab === "coupons" && <Coupons items={items} mutate={mutate} />}{tab === "support" && <Support items={items} mutate={mutate} exportResource={exportResource} />}{tab === "settings" && <Settings items={items} mutate={mutate} exportResource={exportResource} />}{tab === "audit" && <Audit items={items} />}{tab === "security" && <Security data={data} />}{toast && <div className="portalToast">✓ {toast}</div>}</>;
}

function Products({ items, stores, mutate, exportResource, reload, onToast, onError }: { items: Item[]; stores: Item[]; mutate: WorkspaceMutation; exportResource: (r: string, f: "csv") => Promise<void>; reload: () => Promise<void>; onToast: (message: string) => void; onError: (message: string) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const media = formData.getAll("media").filter((value): value is File => value instanceof File && value.size > 0);
    formData.delete("media");
    const values = Object.fromEntries(formData);
    let productId = "";
    onError("");
    try {
      const created = await apiFetch<{ id: string }>("/api/admin/workspace", { method: "POST", json: { action: "create_product", ...values } });
      productId = created.id;
      for (const [index, file] of media.entries()) {
        const upload = new FormData();
        upload.set("ownerType", "product"); upload.set("storeId", String(values.storeId)); upload.set("itemId", productId); upload.set("altText", String(values.name)); upload.set("featured", index === 0 && file.type.startsWith("image/") ? "true" : "false"); upload.set("file", file);
        await apiFetch("/api/catalog-media", { method: "POST", body: upload });
      }
      form.reset();
      onToast(media.length ? `Product and ${media.length} media item${media.length === 1 ? "" : "s"} created` : "Product created");
      await reload();
    } catch (createError) {
      if (productId) { onToast("Product created; image needs attention"); await reload(); }
      onError(productId ? `Product was created, but its image could not be uploaded: ${createError instanceof Error ? createError.message : "Upload failed."}` : createError instanceof Error ? createError.message : "Product could not be created.");
    }
  }
  const imageChanged = async (message: string) => { onToast(message); await reload(); };
  const ids = [...selected];
  const allSelected = items.length > 0 && items.every((item) => selected.has(String(item.id)));
  function toggle(id: string) { setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }
  async function bulkUpdate(changes: Payload, message: string) {
    if (!ids.length) return;
    await mutate("PATCH", { action: "bulk_update_products", productIds: ids, ...changes }, message);
    setSelected(new Set());
  }
  async function bulkDelete() {
    if (!ids.length || deleting || !window.confirm(`${ids.length} products selected.\n\nDeletion is permanent and cannot be undone. Products with order history must be archived. Delete selected records?`)) return;
    setDeleting(true);
    try { if (await mutate("DELETE", { action: "bulk_delete_products", productIds: ids }, "Selected products deleted")) setSelected(new Set()); }
    finally { setDeleting(false); }
  }
  return <div className="portalGrid"><section className="portalCard"><div className="portalCardHeader"><h2>Add product as admin</h2><small>Assign it to any active shop</small></div><form className="portalForm" onSubmit={submit}><label className="full">Shop<select name="storeId" required><option value="">Choose shop</option>{stores.map((store) => <option key={String(store.id)} value={String(store.id)}>{String(store.name)} · {String(store.category)}</option>)}</select></label><label>Name<input name="name" required minLength={2} /></label><label>Price<input name="price" type="number" min="0" step=".01" /></label><label>Stock<input name="quantity" type="number" min="0" step="1" defaultValue="0" /></label><label>SKU<input name="sku" placeholder="Generated automatically" /></label><label>Status<select name="status" defaultValue="active"><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select></label><label className="full">Description<textarea name="description" /></label><label className="full">Product images and videos <small>Optional · choose multiple · images 8 MB, videos 40 MB each</small><input name="media" type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime" /></label><div className="formActions"><button className="portalButton" type="submit">Create product</button></div></form></section><section className="portalCard"><div className="portalCardHeader"><div><h2>Platform products</h2><small>Select multiple products to edit, approve, archive, or delete.</small></div><button className="portalButton secondary" onClick={() => void exportResource("products", "csv")}>Export CSV</button></div>{ids.length > 0 && <div className="bulkActionBar" role="region" aria-label="Bulk product actions"><b>{ids.length} selected</b><button className="portalButton" type="button" onClick={() => void bulkUpdate({ status: "active" }, "Selected products approved")}>Approve / activate</button><button type="button" onClick={() => { const price = window.prompt("Set one price for all selected products"); if (price !== null && price !== "") void bulkUpdate({ price }, "Selected product prices updated"); }}>Edit price</button><button type="button" onClick={() => void bulkUpdate({ status: "draft" }, "Selected products moved to draft")}>Draft</button><button type="button" onClick={() => void bulkUpdate({ status: "archived" }, "Selected products archived")}>Archive</button><button type="button" className="dangerButton" onClick={() => void bulkDelete()}>Delete</button><button type="button" onClick={() => setSelected(new Set())}>Clear</button></div>}{items.length ? <><label className="bulkSelectAll"><input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((item) => String(item.id))))} /> Select all products on this page</label><div className="workspaceList productWorkspaceList">{items.map((item) => { const id = String(item.id); return <article key={id} className={selected.has(id) ? "selectedRow" : ""}><input className="rowCheckbox" type="checkbox" aria-label={`Select ${String(item.name)}`} checked={selected.has(id)} onChange={() => toggle(id)} /><div><b>{String(item.name)}</b><p>{String(item.storeName)} · {String(item.ownerEmail ?? "Unassigned")}</p><small>₹{Number(item.price ?? 0).toLocaleString("en-IN")} · stock {Number(item.quantity ?? item.available ?? 0)}</small></div><CatalogMediaControl ownerType="product" itemId={id} storeId={String(item.storeId)} itemName={String(item.name)} onChanged={imageChanged} /><div className="tableActions"><select defaultValue={String(item.status)} onChange={(event) => void mutate("PATCH", { action: "update_product", productId: item.id, status: event.target.value }, "Product updated")}><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select><button onClick={() => { if (window.confirm("Delete this product? Products with order history can only be archived.")) void mutate("DELETE", { action: "delete_product", productId: item.id }, "Product deleted"); }}>Delete</button></div></article>; })}</div></> : <Empty text="Products created by administrators and shop owners appear here." />}</section></div>;
}

function Orders({ items, mutate, exportResource }: { items: Item[]; mutate: WorkspaceMutation; exportResource: (r: string, f: "csv") => Promise<void> }) {
  return <section className="portalCard"><div className="portalCardHeader"><h2>All orders</h2><button className="portalButton secondary" onClick={() => void exportResource("orders", "csv")}>Export CSV</button></div>{items.length ? <div className="workspaceList">{items.map((item) => <article key={String(item.id)}><div><b>{String(item.orderNumber ?? item.id)} · {String(item.storeName)}</b><p>{String(item.customerName)} · {String(item.customerEmail)}</p><small>₹{Number(item.total ?? 0).toLocaleString("en-IN")} · {new Date(Number(item.createdAt ?? 0) * 1000).toLocaleString()}</small></div><div className="tableActions"><Status value={item.status} /><select defaultValue={String(item.status)} onChange={(event) => void mutate("PATCH", { action: "update_order", orderId: item.id, status: event.target.value, note: "Administrator update" }, "Order updated")}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="preparing">Preparing</option><option value="ready">Ready</option><option value="out_for_delivery">Out for delivery</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option><option value="rejected">Rejected</option></select></div></article>)}</div> : <Empty text="Customer orders will appear here." />}</section>;
}

function Notifications({ items, mutate }: { items: Item[]; mutate: WorkspaceMutation }) {
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void mutate("POST", { action: "broadcast_notification", ...Object.fromEntries(new FormData(event.currentTarget)) }, "Notification broadcast"); }
  return <div className="portalGrid"><section className="portalCard"><div className="portalCardHeader"><h2>Broadcast notification</h2></div><form className="portalForm" onSubmit={submit}><label>Audience<select name="audience"><option value="all">Everyone</option><option value="customer">Customers</option><option value="store_owner">Shop owners</option><option value="admin">Admins</option></select></label><label>Type<select name="type"><option value="info">Info</option><option value="success">Success</option><option value="warning">Warning</option><option value="security">Security</option></select></label><label className="full">Title<input name="title" required minLength={3} /></label><label className="full">Message<textarea name="message" required minLength={3} /></label><label className="full">Internal link<input name="link" placeholder="/products" /></label><div className="formActions"><button className="portalButton" type="submit">Broadcast</button></div></form></section><section className="portalCard"><div className="portalCardHeader"><h2>Recent notifications</h2></div>{items.length ? <div className="workspaceList">{items.map((item) => <article key={String(item.id)}><div><b>{String(item.title)}</b><p>{String(item.message)}</p><small>{String(item.audience)} · {String(item.type)}</small></div></article>)}</div> : <Empty text="No platform notifications yet." />}</section></div>;
}

function Banners({ items, mutate }: { items: Item[]; mutate: WorkspaceMutation }) {
  const selection = useAdminBulkSelection(items.map((item) => String(item.id)));
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void mutate("POST", { action: "create_banner", ...Object.fromEntries(new FormData(event.currentTarget)) }, "Banner created"); }
  return <div className="portalGrid"><section className="portalCard"><div className="portalCardHeader"><h2>Create advertisement</h2></div><form className="portalForm" onSubmit={submit}><label className="full">Title<input name="title" required /></label><label className="full">Subtitle<input name="subtitle" /></label><label>Placement<select name="placement"><option value="home">Home</option><option value="search">Search</option><option value="dashboard">Dashboard</option></select></label><label>Status<select name="status"><option value="draft">Draft</option><option value="active">Active</option></select></label><label className="full">Image URL<input name="imageUrl" type="url" /></label><label className="full">Target URL<input name="linkUrl" /></label><div className="formActions"><button className="portalButton" type="submit">Create advertisement</button></div></form></section><section className="portalCard"><div className="portalCardHeader"><h2>Advertisements</h2><label className="bulkSelectAll"><SelectAllCheckbox checked={selection.allSelected} onChange={selection.toggleAll} label="advertisements" /> Select all</label></div>{items.length ? <div className="workspaceList">{items.map((item) => { const id = String(item.id); return <article key={id} className={selection.selected.has(id) ? "selectedRow" : ""}><RowSelectCheckbox checked={selection.selected.has(id)} onChange={() => selection.toggle(id)} label={String(item.title)} /><div><b>{String(item.title)}</b><p>{String(item.subtitle ?? "")}</p><small>{String(item.placement)}</small></div><div className="tableActions"><Status value={item.status} /><button onClick={() => void mutate("PATCH", { action: "update_banner", bannerId: item.id, status: item.status === "active" ? "draft" : "active" }, "Advertisement updated")}>{item.status === "active" ? "Draft" : "Activate"}</button><button onClick={() => void mutate("DELETE", { action: "delete_banner", bannerId: item.id }, "Advertisement deleted")}>Delete</button></div></article>; })}</div> : <Empty text="Create a campaign advertisement for Kynisto surfaces." />}<BulkDeleteBar count={selection.selectedIds.length} itemLabel="advertisement" onDelete={() => mutate("DELETE", { action: "bulk_delete_banners", bannerIds: selection.selectedIds }, `${selection.selectedIds.length} advertisements deleted`)} onDeleted={selection.clear} /></section></div>;
}

function Coupons({ items, mutate }: { items: Item[]; mutate: WorkspaceMutation }) {
  const selection = useAdminBulkSelection(items.map((item) => String(item.id)));
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void mutate("POST", { action: "create_coupon", ...Object.fromEntries(new FormData(event.currentTarget)) }, "Platform coupon created"); }
  return <div className="portalGrid"><section className="portalCard"><div className="portalCardHeader"><h2>Create promotion</h2></div><form className="portalForm" onSubmit={submit}><label>Code<input name="code" required /></label><label>Title<input name="title" required /></label><label>Type<select name="discountType"><option value="percentage">Percentage</option><option value="fixed">Fixed</option></select></label><label>Value<input name="discountValue" type="number" min=".01" step=".01" required /></label><label>Minimum order<input name="minimumOrder" type="number" min="0" step=".01" defaultValue="0" /></label><label>Usage limit<input name="usageLimit" type="number" min="1" /></label><label className="full">Description<textarea name="description" /></label><div className="formActions"><button className="portalButton" type="submit">Create promotion</button></div></form></section><section className="portalCard"><div className="portalCardHeader"><h2>Promotions</h2><label className="bulkSelectAll"><SelectAllCheckbox checked={selection.allSelected} onChange={selection.toggleAll} label="promotions" /> Select all</label></div>{items.length ? <div className="workspaceList">{items.map((item) => { const id = String(item.id); return <article key={id} className={selection.selected.has(id) ? "selectedRow" : ""}><RowSelectCheckbox checked={selection.selected.has(id)} onChange={() => selection.toggle(id)} label={String(item.code)} /><div><b>{String(item.code)} · {String(item.title)}</b><p>{String(item.storeName ?? "Platform-wide")}</p><small>{String(item.discountType)} {String(item.discountValue)} · {Number(item.usedCount ?? 0)} used</small></div><div className="tableActions"><Status value={item.status} /><button onClick={() => void mutate("PATCH", { action: "update_coupon", couponId: item.id, status: item.status === "active" ? "disabled" : "active" }, "Promotion updated")}>{item.status === "active" ? "Disable" : "Activate"}</button><button onClick={() => void mutate("DELETE", { action: "delete_coupon", couponId: item.id }, "Promotion deleted")}>Delete</button></div></article>; })}</div> : <Empty text="No promotions configured." />}<BulkDeleteBar count={selection.selectedIds.length} itemLabel="promotion" onDelete={() => mutate("DELETE", { action: "bulk_delete_coupons", couponIds: selection.selectedIds }, `${selection.selectedIds.length} promotions deleted`)} onDeleted={selection.clear} /></section></div>;
}

function Support({ items, mutate, exportResource }: { items: Item[]; mutate: WorkspaceMutation; exportResource: (r: string, f: "csv") => Promise<void> }) {
  return <section className="portalCard"><div className="portalCardHeader"><h2>Support & complaints</h2><button className="portalButton secondary" onClick={() => void exportResource("support", "csv")}>Export CSV</button></div>{items.length ? <div className="workspaceList">{items.map((item) => <article key={String(item.id)}><div><b>{String(item.subject)}</b><p>{String(item.message)}</p><small>{String(item.userName ?? item.userEmail)} · {String(item.type)} · {String(item.priority)}</small></div><div className="tableActions"><Status value={item.status} /><select defaultValue={String(item.status)} onChange={(event) => { const status = event.target.value; const resolution = status === "resolved" || status === "closed" ? window.prompt("Resolution note") ?? "Resolved by administrator" : undefined; void mutate("PATCH", { action: "update_support", ticketId: item.id, status, resolution }, "Ticket updated"); }}><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></div></article>)}</div> : <Empty text="No customer or shop-owner tickets." />}</section>;
}

function Settings({ items, mutate, exportResource }: { items: Item[]; mutate: WorkspaceMutation; exportResource: (r: string, f: "json" | "csv") => Promise<void> }) {
  return <><section className="portalCard"><div className="portalCardHeader"><h2>Platform settings</h2><small>Allowlisted and audited</small></div><div className="workspaceList">{items.map((item) => <form key={String(item.key)} onSubmit={(event) => { event.preventDefault(); const value = new FormData(event.currentTarget).get("value"); void mutate("PATCH", { action: "update_setting", key: item.key, value }, "Setting saved"); }}><article><div><b>{String(item.label)}</b><small>{String(item.key)}</small></div><div className="tableActions">{item.type === "boolean" ? <select name="value" defaultValue={String(item.value)}><option value="true">Enabled</option><option value="false">Disabled</option></select> : <input name="value" defaultValue={String(item.value ?? "")} />}<button type="submit">Save</button></div></article></form>)}</div></section><section className="portalCard" style={{ marginTop: 14 }}><div className="portalCardHeader"><h2>Backup & export</h2><small>Read-only portable snapshots</small></div><div className="tableActions">{["users", "stores", "products", "orders", "reviews", "support"].map((resource) => <button key={resource} onClick={() => void exportResource(resource, "json")}>Export {resource} JSON</button>)}</div></section></>;
}

function Audit({ items }: { items: Item[] }) {
  return <section className="portalCard"><div className="portalCardHeader"><h2>Administrative activity</h2><small>Immutable operational trail</small></div>{items.length ? <div className="workspaceList">{items.map((item) => <article key={String(item.id)}><div><b>{String(item.action)}</b><p>{String(item.actorName ?? "System")} · {String(item.entityType)} {String(item.entityId ?? "")}</p><small>{new Date(Number(item.createdAt ?? 0) * 1000).toLocaleString()}</small></div></article>)}</div> : <Empty text="No matching audit events." />}</section>;
}

function Security({ data }: { data: Payload }) {
  const summary = (data.summary as Item | undefined) ?? {};
  const events = (data.recentEvents as Item[] | undefined) ?? (data.items as Item[] | undefined) ?? [];
  return <><div className="securityGrid"><article><small>Total accounts</small><strong>{Number(summary.totalUsers ?? 0)}</strong></article><article><small>Locked accounts</small><strong>{Number(summary.lockedUsers ?? 0)}</strong></article><article><small>Accounts with failed logins</small><strong>{Number(summary.usersWithFailures ?? 0)}</strong></article></div><section className="portalCard" style={{ marginTop: 14 }}><div className="portalCardHeader"><h2>Recent security events</h2><small>Authentication and privilege changes</small></div>{events.length ? <div className="workspaceList">{events.map((item) => <article key={String(item.id)}><div><b>{String(item.action)}</b><p>{String(item.entityId ?? "Authentication event")}</p><small>{new Date(Number(item.createdAt ?? 0) * 1000).toLocaleString()}</small></div><Status value="logged" /></article>)}</div> : <Empty text="No security events match this view." />}</section></>;
}
