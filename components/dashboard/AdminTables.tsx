"use client";

import { apiFetch } from "@/lib/client-api";
import { BulkDeleteBar, RowSelectCheckbox, SelectAllCheckbox, useAdminBulkSelection } from "@/components/dashboard/AdminBulkSelection";

type AdminItem = Record<string, unknown>;
type Mutate = (path: string, method: string, json: unknown, message: string) => Promise<boolean>;

function Status({ value }: { value: unknown }) {
  const text = String(value ?? "unknown");
  return <span className={`statusPill ${text}`}>{text}</span>;
}

function SelectableTable({ items, headers, render, itemLabel, onDelete }: { items: AdminItem[]; headers: string[]; render: (item: AdminItem) => React.ReactNode; itemLabel: string; onDelete: (ids: string[]) => Promise<boolean> }) {
  const selection = useAdminBulkSelection(items.map((item) => String(item.id)));
  if (!items.length) return <section className="portalCard"><div className="emptyPortal"><div><b>No results</b><p>Try changing the search or status filter.</p></div></div></section>;
  return <section className="portalCard"><div className="portalTableWrap"><table className="portalTable"><thead><tr><th><SelectAllCheckbox checked={selection.allSelected} onChange={selection.toggleAll} label={itemLabel} /></th>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{items.map((item) => { const id = String(item.id); return <tr key={id} className={selection.selected.has(id) ? "selectedRow" : ""}><td><RowSelectCheckbox checked={selection.selected.has(id)} onChange={() => selection.toggle(id)} label={String(item.name ?? item.email ?? item.id)} /></td>{render(item)}</tr>; })}</tbody></table></div><BulkDeleteBar count={selection.selectedIds.length} itemLabel={itemLabel} onDelete={() => onDelete(selection.selectedIds)} onDeleted={selection.clear} /></section>;
}

export function UserManagementTable({ items, mutate }: { items: AdminItem[]; mutate: Mutate }) {
  async function startChat(item: AdminItem) {
    const subject = window.prompt(`Conversation subject for ${String(item.name)}`, "Kynisto support");
    if (!subject) return;
    try {
      const result = await apiFetch<{ id: string }>("/api/chat", { method: "POST", json: { action: "start_admin", userId: item.id, subject } });
      window.location.assign(`/admin?tab=chat&conversation=${encodeURIComponent(result.id)}`);
    } catch (error) { window.alert(error instanceof Error ? error.message : "Conversation could not be started."); }
  }
  return <SelectableTable items={items} itemLabel="user" onDelete={(ids) => mutate("/api/admin/users", "DELETE", { action: "bulk_delete", userIds: ids }, `${ids.length} users deleted`)} headers={["User", "Role", "Status", "Joined", "Actions"]} render={(item) => <>
    <td><b>{String(item.name)}{Boolean(item.isSuperAdmin) && " · Super Admin"}</b><small>{String(item.email)}</small></td>
    <td><select disabled={Boolean(item.isSuperAdmin)} defaultValue={String(item.role)} id={`role-${item.id}`}><option value="admin">Admin</option><option value="store_owner">Shop owner</option><option value="customer">Customer</option></select></td>
    <td><select disabled={Boolean(item.isSuperAdmin)} defaultValue={String(item.status)} id={`status-${item.id}`}><option value="active">Active</option><option value="suspended">Suspended</option><option value="disabled">Disabled</option><option value="banned">Banned</option></select></td>
    <td>{new Date(Number(item.createdAt) * 1000).toLocaleDateString()}</td>
    <td><div className="tableActions">{item.role !== "admin" && <button className="portalButton" type="button" onClick={() => void startChat(item)}>Chat</button>}<button disabled={Boolean(item.isSuperAdmin)} onClick={() => void mutate("/api/admin/users", "PATCH", { userId: item.id, role: (document.getElementById(`role-${item.id}`) as HTMLSelectElement).value, status: (document.getElementById(`status-${item.id}`) as HTMLSelectElement).value }, "User updated")}>Save</button><button disabled={Boolean(item.isSuperAdmin)} onClick={() => { if (window.confirm(`Delete ${String(item.email)}?`)) void mutate("/api/admin/users", "DELETE", { userId: item.id }, "User deleted"); }}>Delete</button></div></td>
  </>} />;
}

export function StoreManagementTable({ items, owners, mutate, onEdit }: { items: AdminItem[]; owners: AdminItem[]; mutate: Mutate; onEdit: (store: AdminItem) => void }) {
  const selection = useAdminBulkSelection(items.map((item) => String(item.id)));
  const ids = selection.selectedIds;
  async function bulk(operation: string, extra: Record<string, unknown> = {}, message = "Stores updated") {
    if (!ids.length) return;
    await mutate("/api/admin/stores", "PATCH", { action: "bulk", operation, storeIds: ids, ...extra }, message);
    selection.clear();
  }
  if (!items.length) return <section className="portalCard"><div className="emptyPortal"><div><b>No results</b><p>Try changing the search or status filter.</p></div></div></section>;
  return <section className="portalCard"><div className="portalTableWrap"><table className="portalTable"><thead><tr><th><SelectAllCheckbox checked={selection.allSelected} onChange={selection.toggleAll} label="stores" /></th><th>Store</th><th>Category</th><th>Owner</th><th>Status</th><th>Actions</th></tr></thead><tbody>{items.map((item) => { const id = String(item.id); return <tr key={id} className={selection.selected.has(id) ? "selectedRow" : ""}><td><RowSelectCheckbox checked={selection.selected.has(id)} onChange={() => selection.toggle(id)} label={String(item.name)} /></td><td><b>{String(item.name)}</b><small>{String(item.address)}</small></td><td>{String(item.category)}</td><td><select defaultValue={String(item.ownerId ?? "")} id={`owner-${item.id}`}><option value="">Unassigned</option>{owners.map((owner) => <option key={String(owner.id)} value={String(owner.id)}>{String(owner.name)}</option>)}</select></td><td><Status value={item.status} /></td><td><div className="tableActions"><button onClick={() => onEdit(item)}>Edit</button><button onClick={() => void mutate("/api/admin/stores", "PATCH", { storeId: item.id, action: "assign", ownerId: (document.getElementById(`owner-${item.id}`) as HTMLSelectElement).value }, "Owner assignment updated")}>Assign</button>{item.status !== "approved" && <button onClick={() => void mutate("/api/admin/stores", "PATCH", { storeId: item.id, action: "approve" }, "Store approved")}>Approve</button>}<button onClick={() => { const reason = window.prompt("Reason for rejection or suspension"); if (reason) void mutate("/api/admin/stores", "PATCH", { storeId: item.id, action: item.status === "pending" ? "reject" : "suspend", reason }, "Store status updated"); }}>{item.status === "pending" ? "Reject" : "Suspend"}</button><button onClick={() => { if (window.confirm("Delete this store permanently?")) void mutate("/api/admin/stores", "DELETE", { storeId: item.id }, "Store deleted"); }}>Delete</button></div></td></tr>; })}</tbody></table></div><BulkDeleteBar count={ids.length} itemLabel="store" onDelete={() => mutate("/api/admin/stores", "DELETE", { action: "bulk_delete", storeIds: ids }, `${ids.length} stores deleted`)} onDeleted={selection.clear}><button type="button" onClick={() => ids.length === 1 && onEdit(items.find((item) => String(item.id) === ids[0])!)} disabled={ids.length !== 1}>Edit</button><button type="button" onClick={() => void bulk("approve", {}, "Selected stores approved")}>Approve</button><select id="bulk-store-owner" defaultValue=""><option value="">Unassigned owner</option>{owners.map((owner) => <option key={String(owner.id)} value={String(owner.id)}>{String(owner.name)}</option>)}</select><button type="button" onClick={() => void bulk("assign", { ownerId: (document.getElementById("bulk-store-owner") as HTMLSelectElement).value }, "Selected stores reassigned")}>Apply owner</button></BulkDeleteBar></section>;
}

export function CategoryManagementTable({ items, mutate }: { items: AdminItem[]; mutate: Mutate }) {
  return <SelectableTable items={items} itemLabel="category" onDelete={(ids) => mutate("/api/admin/categories", "DELETE", { action: "bulk_delete", categoryIds: ids }, `${ids.length} categories deleted`)} headers={["Category", "Parent", "Stores", "Status", "Actions"]} render={(item) => <>
    <td><b>{String(item.icon ?? "")} {String(item.name)}</b><small>{String(item.slug)}</small></td>
    <td>{String(item.parentName ?? "Top level")}</td><td>{String(item.storeCount ?? 0)}</td><td><Status value={item.status} /></td>
    <td><div className="tableActions">
      <button onClick={() => { const name = window.prompt("Category name", String(item.name)); if (name) void mutate("/api/admin/categories", "PATCH", { ...item, name }, "Category updated"); }}>Edit</button>
      <button onClick={() => void mutate("/api/admin/categories", "PATCH", { ...item, status: item.status === "active" ? "hidden" : "active" }, "Category updated")}>{item.status === "active" ? "Hide" : "Show"}</button>
      <button onClick={() => { if (window.confirm("Delete this unused category?")) void mutate("/api/admin/categories", "DELETE", { id: item.id }, "Category deleted"); }}>Delete</button>
    </div></td>
  </>} />;
}
