"use client";

import { useEffect, useState } from "react";
import { isPushNotificationSupported, subscribeUserToPush, unsubscribeUserFromPush } from "@/lib/push-notifications";

export function PushNotificationManager() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const isSupp = await isPushNotificationSupported();
      setSupported(isSupp);
      if (isSupp && "serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        setSubscribed(Boolean(subscription));
      }
    })();
  }, []);

  async function handleToggle() {
    setLoading(true);
    setMessage(null);
    if (subscribed) {
      const success = await unsubscribeUserFromPush();
      if (success) {
        setSubscribed(false);
        setMessage("Notifications disabled.");
      }
    } else {
      const res = await subscribeUserToPush();
      if (res.ok) {
        setSubscribed(true);
        setMessage("⚡ Push & App alerts enabled successfully!");
      } else {
        setMessage(res.message || "Could not enable notifications.");
      }
    }
    setLoading(false);
  }

  if (!supported) return null;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleToggle()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 14px",
          borderRadius: "10px",
          border: subscribed ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(255, 255, 255, 0.2)",
          background: subscribed ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.08)",
          color: subscribed ? "#34D399" : "#FFFFFF",
          fontSize: "12px",
          fontWeight: 700,
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        <span aria-hidden="true" style={{ fontSize: "14px" }}>{subscribed ? "🔔" : "🔕"}</span>
        <span>{loading ? "Updating..." : subscribed ? "Push Alerts Active" : "Enable Push Alerts"}</span>
      </button>
      {message && <small style={{ color: "#FF8A00", fontSize: "11px", fontWeight: 600 }}>{message}</small>}
    </div>
  );
}
