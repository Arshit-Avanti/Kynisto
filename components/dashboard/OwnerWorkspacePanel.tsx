"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/client-api";

export type OwnerWorkspaceView =
  | "inventory"
  | "orders"
  | "customers"
  | "sales"
  | "coupons"
  | "notifications"
  | "settings"
  | "support";

const workspaceViews: readonly OwnerWorkspaceView[] = [
  "inventory",
  "orders",
  "customers",
  "sales",
  "coupons",
  "notifications",
  "settings",
  "support",
];

type Row = Record<string, unknown>;
type Payload = Record<string, unknown>;
type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "rejected";

const orderTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["confirmed", "rejected"],
  confirmed: ["preparing", "rejected"],
  preparing: ["ready", "rejected"],
  ready: ["out_for_delivery", "delivered", "rejected"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
  rejected: [],
};

export function isOwnerWorkspaceView(value: string): value is OwnerWorkspaceView {
  return workspaceViews.includes(value as OwnerWorkspaceView);
}

function asRow(value: unknown): Row {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Row)
    : {};
}

function asRows(value: unknown): Row[] {
  return Array.isArray(value)
    ? value.filter((item): item is Row => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    : [];
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}

function number(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function truthy(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

function money(value: unknown, currency: unknown = "INR"): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: text(currency, "INR"),
      maximumFractionDigits: 2,
    }).format(number(value));
  } catch {
    return "₹" + number(value).toLocaleString("en-IN");
  }
}

function dateTime(value: unknown): string {
  const timestamp = number(value);
  if (!timestamp) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp * 1000));
}

function label(value: unknown): string {
  return text(value).replaceAll("_", " ");
}

function optionalNumber(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function EmptyWorkspace({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="emptyPortal">
      <div>
        <b>{title}</b>
        <p>{copy}</p>
      </div>
    </div>
  );
}

function StatusPill({ value }: { value: unknown }) {
  const status = text(value, "pending");
  return <span className={"statusPill " + status}>{label(status)}</span>;
}

export function OwnerWorkspacePanel({
  view,
  storeId,
  onToast,
  onError,
}: {
  view: OwnerWorkspaceView;
  storeId: string;
  onToast: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [days, setDays] = useState("30");

  const load = useCallback(async () => {
    setLoading(true);
    onError("");
    try {
      const params = new URLSearchParams({ view, storeId });
      if ((view === "inventory" || view === "customers") && search) params.set("q", search);
      if ((view === "orders" || view === "coupons" || view === "support") && status) {
        params.set("status", status);
      }
      if (view === "sales") params.set("days", days);
      const result = await apiFetch<Payload>("/api/owner/workspace?" + params.toString());
      setPayload(result);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Unable to load this workspace.");
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [days, onError, search, status, storeId, view]);

  useEffect(() => {
    setPayload(null);
    setSearch("");
    setSearchDraft("");
    setStatus("");
  }, [storeId, view]);

  useEffect(() => {
    void load();
  }, [load]);

  const mutate = useCallback(
    async (method: "POST" | "PATCH" | "DELETE", body: Row, message: string, key: string) => {
      setBusy(key);
      onError("");
      try {
        await apiFetch("/api/owner/workspace", {
          method,
          json: { ...body, storeId },
        });
        await load();
        onToast(message);
        return true;
      } catch (error) {
        onError(error instanceof Error ? error.message : "Action failed.");
        return false;
      } finally {
        setBusy("");
      }
    },
    [load, onError, onToast, storeId],
  );

  if (loading && !payload) {
    return <div className="portalSkeleton"><span /><span /><span /></div>;
  }
  if (!payload) return null;

  if (view === "inventory") {
    return (
      <InventoryView
        payload={payload}
        busy={busy}
        searchDraft={searchDraft}
        setSearchDraft={setSearchDraft}
        applySearch={() => setSearch(searchDraft.trim())}
        mutate={mutate}
      />
    );
  }
  if (view === "orders") {
    return <OrdersView payload={payload} busy={busy} status={status} setStatus={setStatus} mutate={mutate} />;
  }
  if (view === "customers") {
    return (
      <CustomersView
        payload={payload}
        searchDraft={searchDraft}
        setSearchDraft={setSearchDraft}
        applySearch={() => setSearch(searchDraft.trim())}
      />
    );
  }
  if (view === "sales") {
    return <SalesView payload={payload} days={days} setDays={setDays} />;
  }
  if (view === "coupons") {
    return <CouponsView payload={payload} busy={busy} status={status} setStatus={setStatus} mutate={mutate} />;
  }
  if (view === "notifications") {
    return <NotificationsView payload={payload} busy={busy} mutate={mutate} />;
  }
  if (view === "settings") {
    return <SettingsView payload={payload} busy={busy} mutate={mutate} />;
  }
  return <SupportView payload={payload} busy={busy} status={status} setStatus={setStatus} mutate={mutate} />;
}

type Mutate = (
  method: "POST" | "PATCH" | "DELETE",
  body: Row,
  message: string,
  key: string,
) => Promise<boolean>;

function SearchToolbar({
  value,
  setValue,
  submit,
  placeholder,
}: {
  value: string;
  setValue: (value: string) => void;
  submit: () => void;
  placeholder: string;
}) {
  return (
    <form
      className="portalToolbar"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <input value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} />
      <button className="portalButton secondary" type="submit">Search</button>
    </form>
  );
}

function InventoryView({
  payload,
  busy,
  searchDraft,
  setSearchDraft,
  applySearch,
  mutate,
}: {
  payload: Payload;
  busy: string;
  searchDraft: string;
  setSearchDraft: (value: string) => void;
  applySearch: () => void;
  mutate: Mutate;
}) {
  const items = asRows(payload.items);
  const summary = asRow(payload.summary);
  return (
    <>
      <div className="statsGrid">
        <article className="statCard"><span>◇</span><small>Products</small><strong>{number(summary.productCount)}</strong></article>
        <article className="statCard"><span>▦</span><small>Units in stock</small><strong>{number(summary.unitsInStock)}</strong></article>
        <article className="statCard"><span>!</span><small>Low stock</small><strong>{number(summary.lowStockCount)}</strong></article>
        <article className="statCard"><span>×</span><small>Out of stock</small><strong>{number(summary.outOfStockCount)}</strong></article>
      </div>
      <section className="portalCard">
        <div className="portalCardHeader"><h2>Inventory control</h2><small>Adjustments are recorded in the activity log</small></div>
        <SearchToolbar value={searchDraft} setValue={setSearchDraft} submit={applySearch} placeholder="Search product or SKU" />
        {items.length === 0 ? (
          <EmptyWorkspace title="No products found" copy="Add products first, then manage their stock here." />
        ) : (
          <div className="workspaceList">
            {items.map((item) => {
              const low = number(item.availableQuantity) <= number(item.lowStockThreshold);
              const key = "inventory-" + text(item.productId);
              return (
                <article key={text(item.productId)} className={low ? "workspaceWarning" : ""}>
                  <div>
                    <b>{text(item.name)}</b>
                    <small>{text(item.sku, "SKU not assigned")} · {money(item.price, item.currency)}</small>
                    <p>
                      {number(item.availableQuantity)} available · {number(item.reservedQuantity)} reserved · threshold {number(item.lowStockThreshold)}
                    </p>
                  </div>
                  <form
                    className="workspaceInlineForm"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      const form = event.currentTarget;
                      const values = new FormData(form);
                      const ok = await mutate(
                        "PATCH",
                        {
                          action: "adjust_inventory",
                          productId: item.productId,
                          quantityChange: Number(values.get("quantityChange")),
                          reason: values.get("reason"),
                          sku: item.sku,
                          lowStockThreshold: item.lowStockThreshold,
                        },
                        "Inventory adjusted",
                        key,
                      );
                      if (ok) form.reset();
                    }}
                  >
                    <input name="quantityChange" type="number" step="1" placeholder="+ / − units" aria-label={"Stock change for " + text(item.name)} required />
                    <input name="reason" defaultValue="Manual stock adjustment" aria-label="Adjustment reason" required />
                    <button type="submit" disabled={busy === key}>{busy === key ? "Saving…" : "Adjust"}</button>
                  </form>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

function OrdersView({
  payload,
  busy,
  status,
  setStatus,
  mutate,
}: {
  payload: Payload;
  busy: string;
  status: string;
  setStatus: (value: string) => void;
  mutate: Mutate;
}) {
  const items = asRows(payload.items);
  const counts = asRows(payload.statusCounts);
  return (
    <>
      <div className="metricStrip workspaceMetrics">
        {counts.length ? counts.map((item) => (
          <div key={text(item.status)}><small>{label(item.status)}</small><b>{number(item.total)}</b></div>
        )) : <div><small>Orders</small><b>0</b></div>}
      </div>
      <section className="portalCard">
        <div className="portalCardHeader"><h2>Store orders</h2><small>Only orders placed with this business</small></div>
        <div className="portalToolbar">
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter orders by status">
            <option value="">All order statuses</option>
            {Object.keys(orderTransitions).map((value) => <option key={value} value={value}>{label(value)}</option>)}
          </select>
        </div>
        {items.length === 0 ? (
          <EmptyWorkspace title="No orders yet" copy="New customer orders will appear here with their fulfillment status." />
        ) : (
          <div className="workspaceList">
            {items.map((item) => {
              const current = text(item.status) as OrderStatus;
              const allowed = orderTransitions[current] ?? [];
              const orderItems = asRows(item.items);
              const key = "order-" + text(item.id);
              return (
                <article key={text(item.id)}>
                  <div>
                    <b>{text(item.orderNumber)} · {text(item.customerName)}</b>
                    <small>{text(item.customerEmail)} · {dateTime(item.placedAt)}</small>
                    <p>
                      {orderItems.map((orderItem) => text(orderItem.name) + " × " + number(orderItem.quantity)).join(", ") || "Order items"}
                      {" · "}{money(item.total, item.currency)} · {label(item.fulfillmentType)}
                    </p>
                  </div>
                  <div className="workspaceOrderAction">
                    <StatusPill value={item.status} />
                    {allowed.length > 0 && (
                      <form
                        className="tableActions"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const values = new FormData(event.currentTarget);
                          void mutate(
                            "PATCH",
                            {
                              action: "update_order_status",
                              orderId: item.id,
                              status: values.get("status"),
                              note: values.get("note"),
                            },
                            "Order status updated",
                            key,
                          );
                        }}
                      >
                        <select name="status" aria-label={"New status for " + text(item.orderNumber)}>
                          {allowed.map((value) => <option key={value} value={value}>{label(value)}</option>)}
                        </select>
                        <input name="note" placeholder="Optional note" aria-label="Status note" />
                        <button type="submit" disabled={busy === key}>{busy === key ? "Saving…" : "Update"}</button>
                      </form>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

function CustomersView({
  payload,
  searchDraft,
  setSearchDraft,
  applySearch,
}: {
  payload: Payload;
  searchDraft: string;
  setSearchDraft: (value: string) => void;
  applySearch: () => void;
}) {
  const items = asRows(payload.items);
  return (
    <section className="portalCard">
      <div className="portalCardHeader"><h2>Store customers</h2><small>Customers who ordered from this business</small></div>
      <SearchToolbar value={searchDraft} setValue={setSearchDraft} submit={applySearch} placeholder="Search customer name or email" />
      {items.length === 0 ? (
        <EmptyWorkspace title="No customers found" copy="Customer insights appear after orders are placed." />
      ) : (
        <div className="portalTableWrap">
          <table className="portalTable">
            <thead><tr><th>Customer</th><th>Orders</th><th>Active</th><th>Lifetime value</th><th>Last order</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={text(item.customerId)}>
                  <td><b>{text(item.name)}</b><small>{text(item.email)}{item.phone ? " · " + text(item.phone) : ""}</small></td>
                  <td>{number(item.orderCount)}</td>
                  <td>{number(item.activeOrderCount)}</td>
                  <td>{money(item.lifetimeValue)}</td>
                  <td>{dateTime(item.lastOrderAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SalesView({
  payload,
  days,
  setDays,
}: {
  payload: Payload;
  days: string;
  setDays: (value: string) => void;
}) {
  const summary = asRow(payload.summary);
  const daily = asRows(payload.daily);
  const statuses = asRows(payload.statuses);
  const topProducts = asRows(payload.topProducts);
  const maxRevenue = Math.max(1, ...daily.map((item) => number(item.revenue)));
  return (
    <>
      <div className="portalToolbar workspaceRange">
        <span>Performance range</span>
        <select value={days} onChange={(event) => setDays(event.target.value)}>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>
      <div className="statsGrid">
        <article className="statCard"><span>₹</span><small>Delivered revenue</small><strong>{money(summary.revenue)}</strong></article>
        <article className="statCard"><span>▤</span><small>Orders</small><strong>{number(summary.orderCount)}</strong></article>
        <article className="statCard"><span>◎</span><small>Customers</small><strong>{number(summary.customerCount)}</strong></article>
        <article className="statCard"><span>↗</span><small>Average order</small><strong>{money(summary.averageOrderValue)}</strong></article>
      </div>
      <div className="portalGrid">
        <section className="portalCard">
          <div className="portalCardHeader"><h2>Daily delivered revenue</h2><small>{days}-day view</small></div>
          {daily.length === 0 ? (
            <EmptyWorkspace title="No sales in this period" copy="Delivered orders will build your revenue chart." />
          ) : (
            <div className="workspaceChart" aria-label="Daily sales chart">
              {daily.map((item) => (
                <span
                  key={text(item.date)}
                  style={{ height: Math.max(5, (number(item.revenue) / maxRevenue) * 100) + "%" }}
                  title={text(item.date) + ": " + money(item.revenue)}
                />
              ))}
            </div>
          )}
        </section>
        <section className="portalCard">
          <div className="portalCardHeader"><h2>Order status</h2><small>{number(summary.activeOrderCount)} active</small></div>
          <div className="workspaceList compactWorkspaceList">
            {statuses.map((item) => (
              <article key={text(item.status)}><div><b>{label(item.status)}</b><small>{money(item.value)}</small></div><strong>{number(item.total)}</strong></article>
            ))}
          </div>
        </section>
      </div>
      <section className="portalCard workspaceSection">
        <div className="portalCardHeader"><h2>Top products</h2><small>Delivered order performance</small></div>
        {topProducts.length === 0 ? (
          <EmptyWorkspace title="No product sales yet" copy="Top-selling products will be ranked here." />
        ) : (
          <div className="portalTableWrap"><table className="portalTable"><thead><tr><th>Product</th><th>Units sold</th><th>Revenue</th></tr></thead><tbody>
            {topProducts.map((item) => <tr key={text(item.productId, text(item.productName))}><td><b>{text(item.productName)}</b></td><td>{number(item.unitsSold)}</td><td>{money(item.revenue)}</td></tr>)}
          </tbody></table></div>
        )}
      </section>
    </>
  );
}

function couponBody(item: Row, overrides: Row = {}): Row {
  return {
    code: item.code,
    title: item.title,
    description: item.description ?? "",
    discountType: item.discountType,
    discountValue: number(item.discountValue),
    minimumOrder: number(item.minimumOrder),
    maximumDiscount: item.maximumDiscount ?? null,
    usageLimit: item.usageLimit ?? null,
    startsAt: item.startsAt ?? null,
    endsAt: item.endsAt ?? null,
    status: item.status,
    ...overrides,
  };
}

function CouponsView({
  payload,
  busy,
  status,
  setStatus,
  mutate,
}: {
  payload: Payload;
  busy: string;
  status: string;
  setStatus: (value: string) => void;
  mutate: Mutate;
}) {
  const items = asRows(payload.items);
  async function createCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const ok = await mutate(
      "POST",
      {
        action: "create_coupon",
        code: values.get("code"),
        title: values.get("title"),
        description: values.get("description"),
        discountType: values.get("discountType"),
        discountValue: Number(values.get("discountValue")),
        minimumOrder: optionalNumber(values.get("minimumOrder")) ?? 0,
        maximumDiscount: optionalNumber(values.get("maximumDiscount")),
        usageLimit: optionalNumber(values.get("usageLimit")),
        status: values.get("status"),
      },
      "Coupon created",
      "coupon-create",
    );
    if (ok) form.reset();
  }
  return (
    <div className="portalGrid">
      <section className="portalCard">
        <div className="portalCardHeader"><h2>Create coupon</h2><small>Codes are unique across Kynisto</small></div>
        <form className="portalForm" onSubmit={createCoupon}>
          <label>Coupon code<input name="code" minLength={3} maxLength={32} placeholder="WELCOME10" required /></label>
          <label>Title<input name="title" placeholder="Welcome discount" required /></label>
          <label>Discount type<select name="discountType" defaultValue="percentage"><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></label>
          <label>Discount value<input name="discountValue" type="number" min=".01" step=".01" required /></label>
          <label>Minimum order<input name="minimumOrder" type="number" min="0" step=".01" /></label>
          <label>Maximum discount<input name="maximumDiscount" type="number" min=".01" step=".01" /></label>
          <label>Usage limit<input name="usageLimit" type="number" min="1" step="1" /></label>
          <label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="active">Active</option></select></label>
          <label className="full">Description<textarea name="description" maxLength={1200} /></label>
          <div className="formActions"><button className="portalButton" type="submit" disabled={busy === "coupon-create"}>{busy === "coupon-create" ? "Creating…" : "Create coupon"}</button></div>
        </form>
      </section>
      <section className="portalCard">
        <div className="portalCardHeader"><h2>Store coupons</h2><small>{items.length} shown</small></div>
        <div className="portalToolbar">
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter coupons by status">
            <option value="">All statuses</option><option value="active">Active</option><option value="draft">Draft</option><option value="expired">Expired</option><option value="disabled">Disabled</option>
          </select>
        </div>
        {items.length === 0 ? (
          <EmptyWorkspace title="No coupons found" copy="Create a code to reward customers and promote your shop." />
        ) : (
          <div className="workspaceList">
            {items.map((item) => {
              const key = "coupon-" + text(item.id);
              return (
                <article key={text(item.id)}>
                  <div><b>{text(item.code)} · {text(item.title)}</b><small>{text(item.discountType) === "percentage" ? number(item.discountValue) + "%" : money(item.discountValue)} off · used {number(item.usedCount)} times</small><p>{text(item.description, "No description")}</p></div>
                  <div className="workspaceOrderAction">
                    <StatusPill value={item.status} />
                    <form className="tableActions" onSubmit={(event) => {
                      event.preventDefault();
                      const nextStatus = new FormData(event.currentTarget).get("status");
                      void mutate("PATCH", { action: "update_coupon", couponId: item.id, ...couponBody(item, { status: nextStatus }) }, "Coupon updated", key);
                    }}>
                      <select name="status" defaultValue={text(item.status)}><option value="active">Active</option><option value="draft">Draft</option><option value="expired">Expired</option><option value="disabled">Disabled</option></select>
                      <button type="submit" disabled={busy === key}>Save</button>
                      <button className="dangerText" type="button" disabled={busy === key} onClick={() => {
                        if (window.confirm("Delete this coupon? Used coupons will be disabled instead.")) {
                          void mutate("DELETE", { action: "delete_coupon", couponId: item.id }, "Coupon removed", key);
                        }
                      }}>Delete</button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function NotificationsView({ payload, busy, mutate }: { payload: Payload; busy: string; mutate: Mutate }) {
  const items = asRows(payload.items);
  return (
    <>
      <div className="statsGrid notificationStats">
        <article className="statCard"><span>○</span><small>Unread personal alerts</small><strong>{number(payload.unread)}</strong></article>
      </div>
      <section className="portalCard narrowCard">
        <div className="portalCardHeader"><h2>Notifications</h2><small>Store owner and personal alerts</small></div>
        {items.length === 0 ? (
          <EmptyWorkspace title="You are all caught up" copy="Order, platform and business alerts will appear here." />
        ) : (
          <div className="workspaceList">
            {items.map((item) => {
              const unread = truthy(item.isPersonal) && !item.readAt;
              const key = "notification-" + text(item.id);
              return (
                <article className={unread ? "unread" : ""} key={text(item.id)}>
                  <div><b>{text(item.title)}</b><small>{label(item.type)} · {dateTime(item.createdAt)}</small><p>{text(item.message)}</p></div>
                  {unread && <div className="tableActions"><button type="button" disabled={busy === key} onClick={() => void mutate("PATCH", { action: "mark_notification_read", notificationId: item.id }, "Notification marked read", key)}>Mark read</button></div>}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

function SettingsView({ payload, busy, mutate }: { payload: Payload; busy: string; mutate: Mutate }) {
  const settings = asRow(payload.settings);
  return (
    <section className="portalCard narrowCard">
      <div className="portalCardHeader"><h2>Order and fulfillment settings</h2><small>Last updated {dateTime(settings.updatedAt)}</small></div>
      <form
        className="portalForm"
        key={text(settings.updatedAt, "initial")}
        onSubmit={(event) => {
          event.preventDefault();
          const values = new FormData(event.currentTarget);
          void mutate(
            "PATCH",
            {
              action: "update_settings",
              acceptingOrders: values.has("acceptingOrders"),
              pickupEnabled: values.has("pickupEnabled"),
              deliveryEnabled: values.has("deliveryEnabled"),
              autoAcceptOrders: values.has("autoAcceptOrders"),
              minimumOrder: Number(values.get("minimumOrder")),
              deliveryFee: Number(values.get("deliveryFee")),
              deliveryRadiusKm: Number(values.get("deliveryRadiusKm")),
            },
            "Business settings updated",
            "settings",
          );
        }}
      >
        <div className="toggleList full">
          <label><span><b>Accept new orders</b><small>Customers can check out from this store</small></span><input name="acceptingOrders" type="checkbox" defaultChecked={truthy(settings.acceptingOrders)} /></label>
          <label><span><b>Pickup</b><small>Allow customers to collect from the shop</small></span><input name="pickupEnabled" type="checkbox" defaultChecked={truthy(settings.pickupEnabled)} /></label>
          <label><span><b>Delivery</b><small>Offer local delivery around the store</small></span><input name="deliveryEnabled" type="checkbox" defaultChecked={truthy(settings.deliveryEnabled)} /></label>
          <label><span><b>Auto-accept orders</b><small>Confirm incoming orders automatically</small></span><input name="autoAcceptOrders" type="checkbox" defaultChecked={truthy(settings.autoAcceptOrders)} /></label>
        </div>
        <label>Minimum order<input name="minimumOrder" type="number" min="0" step=".01" defaultValue={number(settings.minimumOrder)} required /></label>
        <label>Delivery fee<input name="deliveryFee" type="number" min="0" step=".01" defaultValue={number(settings.deliveryFee)} required /></label>
        <label>Delivery radius (km)<input name="deliveryRadiusKm" type="number" min=".1" max="100" step=".1" defaultValue={number(settings.deliveryRadiusKm) || 5} required /></label>
        <div className="formActions"><button className="portalButton" type="submit" disabled={busy === "settings"}>{busy === "settings" ? "Saving…" : "Save settings"}</button></div>
      </form>
    </section>
  );
}

function SupportView({
  payload,
  busy,
  status,
  setStatus,
  mutate,
}: {
  payload: Payload;
  busy: string;
  status: string;
  setStatus: (value: string) => void;
  mutate: Mutate;
}) {
  const items = asRows(payload.items);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const ok = await mutate(
      "POST",
      {
        action: "create_support_ticket",
        type: values.get("type"),
        priority: values.get("priority"),
        subject: values.get("subject"),
        message: values.get("message"),
        orderId: values.get("orderId"),
      },
      "Support ticket created",
      "support-create",
    );
    if (ok) form.reset();
  }
  return (
    <div className="portalGrid">
      <section className="portalCard">
        <div className="portalCardHeader"><h2>Contact platform support</h2><small>Raise a support request or complaint</small></div>
        <form className="portalForm" onSubmit={submit}>
          <label>Request type<select name="type" defaultValue="support"><option value="support">Support</option><option value="complaint">Complaint</option></select></label>
          <label>Priority<select name="priority" defaultValue="normal"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
          <label className="full">Subject<input name="subject" minLength={4} maxLength={160} required /></label>
          <label className="full">Related order ID (optional)<input name="orderId" maxLength={80} /></label>
          <label className="full">Message<textarea name="message" minLength={10} maxLength={4000} required /></label>
          <div className="formActions"><button className="portalButton" type="submit" disabled={busy === "support-create"}>{busy === "support-create" ? "Sending…" : "Create ticket"}</button></div>
        </form>
      </section>
      <section className="portalCard">
        <div className="portalCardHeader"><h2>My tickets</h2><small>{items.length} shown</small></div>
        <div className="portalToolbar"><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter support tickets"><option value="">All statuses</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></div>
        {items.length === 0 ? (
          <EmptyWorkspace title="No support tickets" copy="Your shop-specific support history will appear here." />
        ) : (
          <div className="workspaceList">
            {items.map((item) => (
              <article key={text(item.id)}>
                <div><b>{text(item.subject)}</b><small>{label(item.type)} · {label(item.priority)} priority · {dateTime(item.createdAt)}</small><p>{text(item.message)}</p>{item.resolution ? <p><b>Resolution:</b> {text(item.resolution)}</p> : null}</div>
                <StatusPill value={item.status} />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
