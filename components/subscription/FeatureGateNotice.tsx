"use client";

import Link from "next/link";
import { MagneticButton } from "@/components/ui/MagneticButton";

interface FeatureGateNoticeProps {
  featureName: string;
  requiredPlan: string;
  priceTag: string;
  description: string;
  benefits?: string[];
  onUpgradeClick?: () => void;
}

export function FeatureGateNotice({
  featureName,
  requiredPlan,
  priceTag,
  description,
  benefits = [],
  onUpgradeClick,
}: FeatureGateNoticeProps) {
  return (
    <div
      className="featureGateContainer"
      style={{
        maxWidth: "720px",
        margin: "40px auto",
        padding: "40px 32px",
        borderRadius: "24px",
        background: "linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.98) 100%)",
        border: "2px solid rgba(245,158,11,0.4)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.5), 0 0 30px rgba(245,158,11,0.15)",
        textAlign: "center",
        color: "#FFFFFF",
      }}
    >
      {/* Icon Badge */}
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(217,119,6,0.3) 100%)",
          border: "2px solid #F59E0B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "32px",
          margin: "0 auto 20px",
          boxShadow: "0 0 20px rgba(245,158,11,0.3)",
        }}
      >
        🔒
      </div>

      <span
        style={{
          background: "rgba(245,158,11,0.15)",
          color: "#F59E0B",
          fontSize: "12px",
          fontWeight: 900,
          padding: "6px 16px",
          borderRadius: "20px",
          letterSpacing: "1px",
          textTransform: "uppercase",
          border: "1px solid rgba(245,158,11,0.3)",
        }}
      >
        {requiredPlan} EXCLUSIVE
      </span>

      <h2 style={{ fontSize: "28px", fontWeight: 850, margin: "16px 0 8px", color: "#FFFFFF" }}>
        Unlock {featureName}
      </h2>

      <p style={{ color: "#94A3B8", fontSize: "15px", lineHeight: "1.6", maxWidth: "540px", margin: "0 auto 24px" }}>
        {description}
      </p>

      {benefits.length > 0 && (
        <div
          style={{
            background: "rgba(0,0,0,0.3)",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "28px",
            textAlign: "left",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <strong style={{ color: "#F59E0B", fontSize: "13px", textTransform: "uppercase", letterSpacing: "1px" }}>
            Included with Upgrade:
          </strong>
          <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "flex", flexDirection: "column", gap: "10px" }}>
            {benefits.map((benefit, idx) => (
              <li key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#F8FAFC" }}>
                <span style={{ color: "#22C55E", fontWeight: 900 }}>✓</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
        {onUpgradeClick ? (
          <MagneticButton
            onClick={onUpgradeClick}
            style={{
              padding: "14px 32px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
              color: "#000000",
              fontWeight: 900,
              fontSize: "15px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 10px 25px rgba(245,158,11,0.4)",
            }}
          >
            👑 Upgrade to {requiredPlan} ({priceTag})
          </MagneticButton>
        ) : (
          <Link
            href="/pricing"
            style={{
              padding: "14px 32px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
              color: "#000000",
              fontWeight: 900,
              fontSize: "15px",
              border: "none",
              cursor: "pointer",
              textDecoration: "none",
              boxShadow: "0 10px 25px rgba(245,158,11,0.4)",
              display: "inline-block",
            }}
          >
            👑 Upgrade to {requiredPlan} ({priceTag})
          </Link>
        )}
      </div>
    </div>
  );
}
