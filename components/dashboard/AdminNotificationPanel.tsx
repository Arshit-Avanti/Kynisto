"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-api";
import { requestNotificationPermission, sendDeviceNotification } from "@/lib/notification-manager";
import type { SystemNotification } from "@/lib/notifications";

export function AdminNotificationPanel() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetRole, setTargetRole] = useState<"all" | "customer" | "store_owner" | "user">("all");
  const [targetUserId, setTargetUserId] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<"info" | "promo" | "alert" | "update">("promo");

  const loadNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ items: SystemNotification[] }>("/api/admin/notifications");
      setNotifications(data.items || []);
    } catch (err: any) {
      setError(err.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const handleTestNotification = async () => {
    if (!title.trim()) {
      setError("Please enter a Notification Title first.");
      return;
    }
    setError("");
    const granted = await requestNotificationPermission();
    if (!granted) {
      setError("Notification permission was not granted on this browser/device.");
      return;
    }
    const success = sendDeviceNotification(title.trim(), {
      body: message.trim() || "This is a live test device notification from Kynisto Admin Panel.",
      icon: "/kynisto-mark.svg",
    });

    if (success) {
      setToast("🔔 Live test notification sent to your device!");
      setTimeout(() => setToast(""), 3000);
    } else {
      setError("Failed to trigger local device notification.");
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError("Notification Title and Message Body are required.");
      return;
    }

    setIsSending(true);
    setError("");
    try {
      await apiFetch("/api/admin/notifications", {
        method: "POST",
        json: {
          title: title.trim(),
          message: message.trim(),
          targetRole,
          targetUserId: targetUserId.trim(),
          url: url.trim(),
          type,
        },
      });

      // Send local test on sender device as well
      sendDeviceNotification(title.trim(), {
        body: message.trim(),
        icon: "/kynisto-mark.svg",
      });

      setToast("🚀 Notification broadcasted successfully to all target devices!");
      setTitle("");
      setMessage("");
      setUrl("");
      setTimeout(() => setToast(""), 3000);
      await loadNotifications();
    } catch (err: any) {
      setError(err.message || "Broadcast failed.");
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification record?")) return;
    try {
      await apiFetch(`/api/admin/notifications?id=${id}`, { method: "DELETE" });
      setToast("Notification record deleted.");
      setTimeout(() => setToast(""), 2000);
      await loadNotifications();
    } catch (err: any) {
      setError(err.message || "Delete failed.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Toast Alert */}
      {toast && (
        <div style={{ padding: "14px 18px", borderRadius: "12px", background: "rgba(34, 197, 94, 0.15)", border: "1px solid #22C55E", color: "#22C55E", fontWeight: 700, fontSize: "14px" }}>
          ✓ {toast}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div style={{ padding: "14px 18px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid #EF4444", color: "#EF4444", fontWeight: 700, fontSize: "14px" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Broadcast Form Section */}
      <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "20px", padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#FFFFFF" }}>
              📢 Broadcast Device & System Notifications
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#94A3B8" }}>
              Send real-time push & in-app device notifications to customers, shop owners, or specific users across Android APKs and browsers.
            </p>
          </div>
          <button
            type="button"
            onClick={handleTestNotification}
            style={{
              background: "rgba(59, 130, 246, 0.2)",
              border: "1px solid #3B82F6",
              color: "#60A5FA",
              padding: "8px 16px",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            🔔 Test Send to My Device
          </button>
        </div>

        <form onSubmit={handleBroadcast}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "14px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#CBD5E1", marginBottom: "6px" }}>
                Notification Title *
              </label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. ⚡ Special Offer: 20% Off Local Stores!"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.2)", background: "rgba(0,0,0,0.4)", color: "#FFF", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#CBD5E1", marginBottom: "6px" }}>
                Target Audience
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as any)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.2)", background: "#1E293B", color: "#FFF", fontSize: "14px" }}
              >
                <option value="all">🌐 All Users (Customers & Owners)</option>
                <option value="customer">◉ Customers Only</option>
                <option value="store_owner">♙ Shop Owners Only</option>
                <option value="user">👤 Specific User ID</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#CBD5E1", marginBottom: "6px" }}>
                Type / Category
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.2)", background: "#1E293B", color: "#FFF", fontSize: "14px" }}
              >
                <option value="promo">🎁 Promotion / Deal</option>
                <option value="info">ℹ️ Announcement</option>
                <option value="alert">⚠️ Urgent Alert</option>
                <option value="update">✨ System Update</option>
              </select>
            </div>
          </div>

          {targetRole === "user" && (
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#CBD5E1", marginBottom: "6px" }}>
                Target User ID *
              </label>
              <input
                required
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Enter User ID or User Email"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.2)", background: "rgba(0,0,0,0.4)", color: "#FFF", fontSize: "14px" }}
              />
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#CBD5E1", marginBottom: "6px" }}>
              Notification Message Body *
            </label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter message details that will appear on user device screen..."
              style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.2)", background: "rgba(0,0,0,0.4)", color: "#FFF", fontSize: "14px", resize: "vertical" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "14px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#CBD5E1", marginBottom: "6px" }}>
                Action URL / Destination Link (Optional)
              </label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g. /pricing or /healthcare"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.2)", background: "rgba(0,0,0,0.4)", color: "#FFF", fontSize: "14px" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                type="submit"
                disabled={isSending}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
                  color: "#FFF",
                  fontWeight: 800,
                  fontSize: "14px",
                  border: "none",
                  cursor: "pointer",
                  opacity: isSending ? 0.7 : 1,
                  boxShadow: "0 4px 14px rgba(34, 197, 94, 0.4)",
                }}
              >
                {isSending ? "Broadcasting..." : "🚀 Broadcast to Devices →"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Notifications History Log Table */}
      <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "20px", padding: "24px" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: 800, color: "#FFFFFF" }}>
          📜 Broadcast Notification History
        </h3>

        {loading ? (
          <div style={{ textAlign: "center", padding: "30px", color: "#94A3B8" }}>Loading notifications log...</div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px", color: "#94A3B8" }}>No notifications broadcasted yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px", color: "#FFF" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8" }}>
                  <th style={{ padding: "10px 12px" }}>Title & Message</th>
                  <th style={{ padding: "10px 12px" }}>Audience</th>
                  <th style={{ padding: "10px 12px" }}>Type</th>
                  <th style={{ padding: "10px 12px" }}>Sender</th>
                  <th style={{ padding: "10px 12px" }}>Sent Date & Time</th>
                  <th style={{ padding: "10px 12px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notif) => (
                  <tr key={notif.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "12px" }}>
                      <strong style={{ display: "block", color: "#FFF", fontSize: "14px" }}>{notif.title}</strong>
                      <span style={{ color: "#CBD5E1", fontSize: "12px" }}>{notif.message}</span>
                      {notif.url && <div style={{ color: "#38BDF8", fontSize: "11px", marginTop: "2px" }}>Link: {notif.url}</div>}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ padding: "3px 8px", borderRadius: "6px", background: "rgba(59, 130, 246, 0.2)", color: "#60A5FA", fontWeight: 700, textTransform: "capitalize" }}>
                        {notif.target_role === "all" ? "🌐 All Users" : notif.target_role?.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ padding: "3px 8px", borderRadius: "6px", background: "rgba(245, 158, 11, 0.2)", color: "#F59E0B", fontWeight: 700, textTransform: "uppercase", fontSize: "11px" }}>
                        {notif.type}
                      </span>
                    </td>
                    <td style={{ padding: "12px", color: "#94A3B8" }}>{notif.sender_name}</td>
                    <td style={{ padding: "12px", color: "#94A3B8" }}>
                      {new Date(notif.created_at * 1000).toLocaleString()}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <button
                        type="button"
                        onClick={() => handleDelete(notif.id)}
                        style={{ background: "rgba(239, 68, 68, 0.2)", border: "none", color: "#EF4444", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
