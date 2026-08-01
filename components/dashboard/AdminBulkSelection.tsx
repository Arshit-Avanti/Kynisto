"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

export function useAdminBulkSelection(ids: string[]) {
  const signature = ids.join("|");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  useEffect(() => { setSelected(new Set()); }, [signature]);
  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
  return useMemo(() => ({
    selected,
    selectedIds: [...selected],
    allSelected,
    toggle(id: string) { setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; }); },
    toggleAll() { setSelected(allSelected ? new Set() : new Set(ids)); },
    clear() { setSelected(new Set()); },
  }), [allSelected, ids, selected]);
}

export function BulkDeleteBar({ count, itemLabel, onDelete, onDeleted, children }: {
  count: number;
  itemLabel: string;
  onDelete: () => Promise<boolean>;
  onDeleted?: () => void;
  children?: ReactNode;
}) {
  const [deleting, setDeleting] = useState(false);
  if (!count) return null;
  async function deleteSelected() {
    if (deleting || count === 0) return;
    const confirmed = window.confirm(`${count} ${itemLabel}${count === 1 ? "" : "s"} selected.\n\nDeletion is permanent and cannot be undone. Delete selected records?`);
    if (!confirmed) return;
    setDeleting(true);
    try {
      const succeeded = await onDelete();
      if (succeeded) onDeleted?.();
    } finally { setDeleting(false); }
  }
  return <div className="floatingBulkBar" role="region" aria-label={`Bulk ${itemLabel} actions`}><div><b>{count} selected</b><small>Bulk actions apply to this selection</small></div>{children}<button className="bulkDeleteButton" type="button" disabled={deleting || count === 0} onClick={() => void deleteSelected()}>{deleting && <i aria-hidden="true" />} {deleting ? "Deleting…" : "Delete Selected"}</button></div>;
}

export function SelectAllCheckbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return <input className="adminSelectCheckbox" type="checkbox" checked={checked} onChange={onChange} aria-label={`Select all ${label}`} />;
}

export function RowSelectCheckbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return <input className="adminSelectCheckbox" type="checkbox" checked={checked} onChange={onChange} aria-label={`Select ${label}`} />;
}
