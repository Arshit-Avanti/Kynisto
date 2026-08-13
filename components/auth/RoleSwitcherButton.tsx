"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/client-api";

interface RoleSwitcherButtonProps {
  currentRole?: string | null;
  className?: string;
  style?: React.CSSProperties;
  onSuccess?: () => void;
}

export function RoleSwitcherButton({
  currentRole = "customer",
  className = "",
  style = {},
  onSuccess,
}: RoleSwitcherButtonProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const isOwner = currentRole === "store_owner" || currentRole === "shop_owner" || currentRole === "owner";
  const targetRole = isOwner ? "customer" : "store_owner";

  async function handleSwitchRole() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await apiFetch<{
        success: boolean;
        role: string;
        grantedMaxTierTrial?: boolean;
        trialDays?: number;
        redirectTo?: string;
      }>("/api/auth/switch-role", {
        method: "POST",
        json: { targetRole },
      });

      if (res?.grantedMaxTierTrial) {
        setMessage("🎉 Congratulations! You received 1 Month of Free Enterprise Max-Tier Access!");
      } else {
        setMessage(`Switched to ${targetRole === "store_owner" ? "Shop Owner" : "Customer"} mode!`);
      }

      if (onSuccess) onSuccess();

      setTimeout(() => {
        const dest = res?.redirectTo || (targetRole === "store_owner" ? "/owner" : "/");
        window.location.replace(dest);
      }, 1000);
    } catch (err) {
      console.error("Role switch failed:", err);
      setMessage("Failed to switch role. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: "0.25rem", alignItems: "flex-start" }}>
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleSwitchRole()}
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 1rem",
          borderRadius: "0.75rem",
          border: isOwner ? "1px solid #cbd5e1" : "1px solid rgba(255, 87, 34, 0.4)",
          background: isOwner
            ? "white"
            : "linear-gradient(135deg, rgba(255, 87, 34, 0.15) 0%, rgba(255, 122, 0, 0.12) 100%)",
          color: isOwner ? "#0f172a" : "#ea580c",
          fontWeight: 700,
          fontSize: "0.875rem",
          cursor: busy ? "wait" : "pointer",
          transition: "all 0.2s",
          boxShadow: isOwner ? "none" : "0 2px 8px rgba(255, 87, 34, 0.15)",
          ...style,
        }}
      >
        <span>{isOwner ? "👤 Switch to Customer Mode" : "💼 Switch to Shop Owner (1 Mo Free Enterprise)"}</span>
        {busy && <span aria-hidden="true">⏳</span>}
      </button>
      {message && (
        <span style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: 600 }}>
          {message}
        </span>
      )}
    </div>
  );
}
