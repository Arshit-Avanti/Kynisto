"use client";

import Link from "next/link";
import { MagneticButton } from "@/components/ui/MagneticButton";

interface FeatureGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  requiredPlanName: string;
  requiredRole: "customer" | "store_owner";
}

export function FeatureGateModal({
  isOpen,
  onClose,
  featureName,
  requiredPlanName,
  requiredRole,
}: FeatureGateModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="modalLayer"
      role="presentation"
      onMouseDown={(e) => e.currentTarget === e.target && onClose()}
    >
      <div
        className="gateModalCard argusGlass argusHoverGlow"
        style={{
          maxWidth: "460px",
          width: "90%",
          padding: "32px 24px",
          borderRadius: "24px",
          textAlign: "center",
          background: "var(--argus-card, rgba(10, 10, 10, 0.95))",
          border: "1px solid var(--argus-border, rgba(34, 197, 94, 0.3))",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6)",
          position: "relative",
          margin: "auto",
        }}
      >
        <button
          type="button"
          className="closeButton"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "transparent",
            border: "none",
            fontSize: "24px",
            color: "var(--muted, #94A3B8)",
            cursor: "pointer",
          }}
          onClick={onClose}
        >
          ×
        </button>

        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(34,197,94,0.2) 100%)",
            border: "1px solid rgba(245,158,11,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            margin: "0 auto 16px",
          }}
        >
          🔒
        </div>

        <span
          style={{
            fontSize: "12px",
            fontWeight: 800,
            color: "#F59E0B",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
          }}
        >
          FEATURE LOCKED
        </span>

        <h3
          style={{
            margin: "8px 0 12px",
            fontSize: "22px",
            fontWeight: 800,
            color: "var(--primary-text, #FFFFFF)",
          }}
        >
          {featureName}
        </h3>

        <p
          style={{
            fontSize: "14px",
            color: "var(--muted, #94A3B8)",
            lineHeight: 1.6,
            margin: "0 0 24px",
          }}
        >
          This feature requires the <b>Kynisto {requiredPlanName}</b> plan. Upgrade your subscription to unlock {featureName.toLowerCase()} and exclusive benefits!
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Link href={`/pricing?role=${requiredRole}`} onClick={onClose}>
            <MagneticButton
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: "15px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Upgrade to {requiredPlanName} →
            </MagneticButton>
          </Link>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "var(--muted, #94A3B8)",
              padding: "12px",
              borderRadius: "14px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
