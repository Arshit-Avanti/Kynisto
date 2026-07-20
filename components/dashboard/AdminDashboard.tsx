"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/client-api";
import type { SessionUser } from "@/lib/auth";
import { ChatCenter } from "@/components/dashboard/ChatCenter";
import { AdminHealthcarePanel } from "@/components/dashboard/AdminHealthcarePanel";
import { BulkDeleteBar, RowSelectCheckbox, SelectAllCheckbox, useAdminBulkSelection } from "@/components/dashboard/AdminBulkSelection";
import { AdminStoreEditor as StoreEditor } from "@/components/dashboard/AdminStoreEditor";
import { AdminWorkspacePanel, ADMIN_WORKSPACE_TABS } from "@/components/dashboard/AdminWorkspacePanel";
import {
  CategoryManagementTable as CategoriesTableV2,
  StoreManagementTable as StoresTableV2,
  UserManagementTable as UsersTableV2,
} from "@/components/dashboard/AdminTables";

type Item = Record<string, string | number | null | undefined>;
type Data = Record<string, unknown>;

function Status({ value }: { value: unknown }) {
  const text = String(value ?? "unknown");
  return <span className={`statusPill ${text}`}>{text}</span>;
}

export function AdminDashboard({ user }: { user: SessionUser }) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "overview";
  const [data, setData] = useState<Data>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [toast, setToast] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingStore, setEditingStore] = useState<Record<string, unknown> | null>(null);
  const [categories, setCategories] = useState<Item[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "overview" || tab === "analytics") {
        setData(await apiFetch<Data>("/api/admin/overview"));
      } else if (["users", "owners", "customers"].includes(tab)) {
        const role = tab === "owners" ? "store_owner" : tab === "customers" ? "customer" : "";
        setData(await apiFetch<Data>(`/api/admin/users?q=${encodeURIComponent(query)}&status=${status}&role=${role}`));
      } else if (tab === "stores") {
        const [stores, categoryData] = await Promise.all([
          apiFetch<Data>(`/api/admin/stores?q=${encodeURIComponent(query)}&status=${status}`),
          apiFetch<{ items: Item[] }>("/api/categories?module=all"),
        ]);
        setData(stores);
        setCategories(categoryData.items);
      } else if (tab === "categories") {
        setData(await apiFetch<Data>("/api/admin/categories"));
      } else if (tab === "reviews") {
        setData(await apiFetch<Data>(`/api/admin/reviews?q=${encodeURIComponent(query)}&status=${status}`));
      } else if (tab === "reports") {
        setData(await apiFetch<Data>(`/api/admin/reports?status=${status}`));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [query, status, tab]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setQuery(""); setStatus(""); setShowCreate(false); setEditingStore(null); }, [tab]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 2200); return () => clearTimeout(timer); }, [toast]);

  async function mutate(path: string, method: string, json: unknown, message: string) {
    try {
      await apiFetch(path, { method, json });
      setToast(message);
      await load();
      return true;
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Action failed.");
      return false;
    }
  }

  if (loading) return <div className="portalSkeleton"><span /><span /><span /><span /></div>;

  const items = (data.items as Item[] | undefined) ?? [];
  const title = tab === "overview" ? "Platform overview" : tab.charAt(0).toUpperCase() + tab.slice(1);

  return (
    <>
      <div className="portalTitleRow"><div><span className="portalEyebrow">Admin control centre</span><h1>{title}</h1><p>Manage the Kynisto marketplace with server-enforced administrator access.</p></div>{["stores", "categories"].includes(tab) && <button className="portalButton" type="button" onClick={() => { setEditingStore(null); setShowCreate((current) => !current); }}>{showCreate ? "Close form" : `+ Create ${tab === "stores" ? "store" : "category"}`}</button>}</div>
      {error && <div className="authError" role="alert">{error}</div>}

      {tab === "overview" && <Overview data={data} />}
      {tab === "analytics" && <Analytics data={data} />}
      {tab === "chat" && <ChatCenter user={user} />}
      {tab === "healthcare" && <AdminHealthcarePanel />}
      {tab !== "overview" && tab !== "analytics" && tab !== "chat" && tab !== "healthcare" && !ADMIN_WORKSPACE_TABS.has(tab) && (
        <>
          <form className="portalToolbar" onSubmit={(event) => { event.preventDefault(); void load(); }}>
            {tab !== "categories" && <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${tab}…`} />}
            {["users", "owners", "customers"].includes(tab) && <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="disabled">Disabled</option><option value="banned">Banned</option></select>}
            {tab === "stores" && <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="suspended">Suspended</option></select>}
            {tab === "reviews" && <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="published">Published</option><option value="hidden">Hidden</option><option value="pending">Pending</option></select>}
            {tab === "reports" && <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="open">Open</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select>}
            {tab !== "categories" && <button className="portalButton secondary" type="submit">Apply filters</button>}
          </form>
          {showCreate && tab === "categories" && <CreateCategory onSubmit={async (body) => { await mutate("/api/admin/categories", "POST", body, "Category created"); setShowCreate(false); }} />}
          {showCreate && tab === "stores" && <StoreEditor store={editingStore ?? undefined} categories={categories} owners={(data.owners as Item[] | undefined) ?? []} onSubmit={async (body) => { await mutate("/api/admin/stores", editingStore ? "PATCH" : "POST", editingStore ? { ...(body as object), action: "update", storeId: editingStore.id } : body, editingStore ? "Store updated" : "Store created"); setShowCreate(false); setEditingStore(null); }} />}
          {["users", "owners", "customers"].includes(tab) && <UsersTableV2 items={items} mutate={mutate} />}
          {tab === "stores" && <StoresTableV2 items={items} owners={(data.owners as Item[] | undefined) ?? []} mutate={mutate} onEdit={(store) => { setEditingStore(store); setShowCreate(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} />}
          {tab === "categories" && <CategoriesTableV2 items={items} mutate={mutate} />}
          {tab === "reviews" && <ReviewsTable items={items} mutate={mutate} />}
          {tab === "reports" && <ReportsTable items={items} mutate={mutate} />}
        </>
      )}
      {ADMIN_WORKSPACE_TABS.has(tab) && <AdminWorkspacePanel tab={tab} />}
      {toast && <div className="portalToast" role="status">✓ {toast}</div>}
    </>
  );
}

function Overview({ data }: { data: Data }) {
  const stats = (data.stats as Item | undefined) ?? {};
  const cards = [["◎", "Total users", stats.users], ["⌂", "All stores", stats.stores], ["◷", "Pending approval", stats.pendingStores], ["★", "Reviews", stats.reviews], ["!", "Open reports", stats.openReports], ["▦", "Categories", stats.categories], ["✓", "Approved stores", stats.approvedStores], ["♙", "Store owners", stats.owners]];
  return <><div className="statsGrid">{cards.map(([icon,label,value]) => <article className="statCard" key={String(label)}><span>{icon}</span><small>{label}</small><strong>{Number(value ?? 0).toLocaleString()}</strong></article>)}</div><div className="portalGrid"><section className="portalCard"><div className="portalCardHeader"><h2>Stores waiting for approval</h2><small>Oldest first</small></div><SimpleTable items={(data.pendingStores as Item[] | undefined) ?? []} columns={["name","category","ownerName","createdAt"]} /></section><section className="portalCard"><div className="portalCardHeader"><h2>Recent users</h2><small>Newest accounts</small></div><SimpleTable items={(data.recentUsers as Item[] | undefined) ?? []} columns={["name","role","status"]} /></section></div></>;
}

function Analytics({ data }: { data: Data }) {
  const events = (data.eventTotals as Item[] | undefined) ?? [];
  const growth = (data.growth as Item[] | undefined) ?? [];
  return <div className="portalGrid"><section className="portalCard"><div className="portalCardHeader"><h2>30-day engagement</h2><small>Customer actions</small></div><div className="statsGrid">{events.map((item) => <article className="statCard" key={String(item.eventType)}><span>↗</span><small>{item.eventType}</small><strong>{Number(item.total).toLocaleString()}</strong></article>)}</div></section><section className="portalCard"><div className="portalCardHeader"><h2>New account trend</h2><small>Last 30 days</small></div><div className="miniBars">{growth.map((item) => <div key={String(item.day)} title={`${item.day}: ${item.total}`} style={{height:`${Math.max(8,Number(item.total)*10)}px`}} />)}</div></section></div>;
}

function SimpleTable({ items, columns }: { items: Item[]; columns: string[] }) { return items.length ? <div className="portalTableWrap"><table className="portalTable"><thead><tr>{columns.map((column)=><th key={column}>{column.replace(/([A-Z])/g," $1")}</th>)}</tr></thead><tbody>{items.map((item,index)=><tr key={String(item.id ?? index)}>{columns.map((column)=><td key={column}>{column.toLowerCase().includes("status")?<Status value={item[column]} />:column.toLowerCase().includes("at")?new Date(Number(item[column])*1000).toLocaleDateString():String(item[column] ?? "—")}</td>)}</tr>)}</tbody></table></div>:<div className="emptyPortal"><div><b>Nothing to show</b><p>This section will populate as Kynisto activity grows.</p></div></div>; }

function ReviewsTable({ items, mutate }: { items: Item[]; mutate:(p:string,m:string,j:unknown,s:string)=>Promise<boolean> }) {
  const selection = useAdminBulkSelection(items.map((item) => `${item.reviewType}:${item.id}`));
  if (!items.length) return <section className="portalCard"><div className="emptyPortal"><div><b>No results</b><p>Try changing the current search or status filter.</p></div></div></section>;
  const selectedReviews = selection.selectedIds.map((key) => { const [reviewType, id] = key.split(":", 2); return { reviewType, id }; });
  return <section className="portalCard"><div className="portalTableWrap"><table className="portalTable"><thead><tr><th><SelectAllCheckbox checked={selection.allSelected} onChange={selection.toggleAll} label="reviews" /></th>{["Review","Store / product","Rating","Status","Actions"].map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{items.map((item) => { const key = `${item.reviewType}:${item.id}`; return <tr key={key} className={selection.selected.has(key) ? "selectedRow" : ""}><td><RowSelectCheckbox checked={selection.selected.has(key)} onChange={() => selection.toggle(key)} label={`review by ${String(item.reviewerName)}`} /></td><td><b>{item.reviewerName}</b><small>{item.reviewType === "product" ? "Verified product rating" : "Store review"} · {item.comment}</small></td><td><b>{item.storeName}</b><small>{item.productName ?? "Store profile"}</small></td><td>★ {item.rating}</td><td><Status value={item.status}/></td><td><div className="tableActions"><button onClick={()=>void mutate("/api/admin/reviews","PATCH",{id:item.id,reviewType:item.reviewType,status:item.status==="published"?"hidden":"published"},"Review moderated")}>{item.status==="published"?"Hide":"Publish"}</button><button onClick={()=>{if(window.confirm("Delete this review?"))void mutate("/api/admin/reviews","DELETE",{id:item.id,reviewType:item.reviewType},"Review deleted")}}>Delete</button></div></td></tr>; })}</tbody></table></div><BulkDeleteBar count={selectedReviews.length} itemLabel="review" onDelete={() => mutate("/api/admin/reviews", "DELETE", { action: "bulk_delete", reviews: selectedReviews }, `${selectedReviews.length} reviews deleted`)} onDeleted={selection.clear} /></section>;
}

function ReportsTable({ items, mutate }: { items: Item[]; mutate:(p:string,m:string,j:unknown,s:string)=>Promise<boolean> }) {
  const selection = useAdminBulkSelection(items.map((item) => String(item.id)));
  if (!items.length) return <section className="portalCard"><div className="emptyPortal"><div><b>No results</b><p>Try changing the current status filter.</p></div></div></section>;
  return <section className="portalCard"><div className="portalTableWrap"><table className="portalTable"><thead><tr><th><SelectAllCheckbox checked={selection.allSelected} onChange={selection.toggleAll} label="reports" /></th>{["Report","Target","Reporter","Status","Actions"].map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{items.map((item) => { const id = String(item.id); return <tr key={id} className={selection.selected.has(id) ? "selectedRow" : ""}><td><RowSelectCheckbox checked={selection.selected.has(id)} onChange={() => selection.toggle(id)} label={String(item.reason)} /></td><td><b>{item.reason}</b><small>{item.details}</small></td><td>{item.storeName ?? item.reviewId}</td><td><b>{item.reporterName}</b><small>{item.reporterEmail}</small></td><td><Status value={item.status}/></td><td><div className="tableActions"><select defaultValue={String(item.status)} onChange={(event)=>void mutate("/api/admin/reports","PATCH",{id:item.id,status:event.target.value},"Report updated")}><option value="open">Open</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select><button onClick={() => { if (window.confirm("Delete this report permanently?")) void mutate("/api/admin/reports", "DELETE", { id: item.id }, "Report deleted"); }}>Delete</button></div></td></tr>; })}</tbody></table></div><BulkDeleteBar count={selection.selectedIds.length} itemLabel="report" onDelete={() => mutate("/api/admin/reports", "DELETE", { action: "bulk_delete", reportIds: selection.selectedIds }, `${selection.selectedIds.length} reports deleted`)} onDeleted={selection.clear} /></section>;
}

function CreateCategory({onSubmit}:{onSubmit:(body:unknown)=>Promise<void>}){async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=new FormData(event.currentTarget);await onSubmit(Object.fromEntries(form));}return <section className="portalCard" style={{marginBottom:14}}><div className="portalCardHeader"><h2>Create category</h2></div><form className="portalForm" onSubmit={submit}><label>Name<input name="name" required /></label><label>Icon<input name="icon" defaultValue="⌖" maxLength={8}/></label><label>Colour<input name="color" type="color" defaultValue="#f15f3a"/></label><label>Sort order<input name="sortOrder" type="number" defaultValue="0"/></label><label className="full">Description<textarea name="description" /></label><div className="formActions"><button className="portalButton" type="submit">Create category</button></div></form></section>}
