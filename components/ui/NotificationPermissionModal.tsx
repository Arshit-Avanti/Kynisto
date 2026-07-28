"use client";

import { useEffect, useState } from "react";
import { isNotificationSupported, requestNotificationPermission } from "@/lib/notification-manager";

export function NotificationPermissionModal() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if notification permission is already handled
    const notifPermission = localStorage.getItem("kynisto_notif_permission_v1");
    
    // Check native browser permission status if supported
    const isGranted = typeof Notification !== "undefined" && Notification.permission === "granted";

    if (isGranted) {
      localStorage.setItem("kynisto_notif_permission_v1", "granted");
      return;
    }

    if (!notifPermission && isNotificationSupported()) {
      // First time user opens the app/website -> Show permission modal after 1.2s
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAllowNotifications = async () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kynisto_notif_permission_v1", "granted");

      // Trigger Android native permission request if on Android APK
      if ((window as any).AndroidNotification?.requestPermission) {
        (window as any).AndroidNotification.requestPermission();
      }
    }

    const granted = await requestNotificationPermission();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kynisto_notif_permission_v1", "dismissed");
    }
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "90px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 99998,
        width: "min(460px, 92vw)",
        background: "rgba(15, 23, 42, 0.96)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(34, 197, 94, 0.4)",
        borderRadius: "20px",
        padding: "20px 24px",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(34, 197, 94, 0.25)",
        color: "#FFFFFF",
        fontFamily: "system-ui, -apple-system, sans-serif",
        animation: "slideUpNotifPrompt 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <style jsx>{`
        @keyframes slideUpNotifPrompt {
          from {
            opacity: 0;
            transform: translate(-50%, 30px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
            display: "grid",
            placeItems: "center",
            fontSize: "20px",
            flexShrink: 0,
            boxShadow: "0 6px 16px rgba(34, 197, 94, 0.4)",
          }}
        >
          🔔
        </div>

        <div style={{ flex: 1 }}>
          <h4 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 850, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
            Enable Push Notifications?
          </h4>
          <p style={{ margin: 0, fontSize: "12px", color: "#94A3B8", lineHeight: 1.45 }}>
            Get real-time order status updates, live healthcare queue alerts, & admin announcements on your device.
          </p>

          <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
            <button
              type="button"
              onClick={handleAllowNotifications}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #22C55E 0%, #15803D 100%)",
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: "12px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(34, 197, 94, 0.4)",
                transition: "all 0.2s ease",
              }}
            >
              🔔 Allow Notifications
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              style={{
                padding: "10px 14px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#CBD5E1",
                fontWeight: 700,
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              ✕ Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
