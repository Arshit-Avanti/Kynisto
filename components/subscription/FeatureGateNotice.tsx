"use client";

import Link from "next/link";
import { MagneticButton } from "@/components/ui/MagneticButton";

export interface FeatureGateNoticeProps {
  featureName?: string;
  requiredPlan?: string;
  includedPlans?: string[];
  priceTag?: string;
  description?: string;
  benefits?: string[];
  onUpgradeClick?: () => void;
}

export function FeatureGateNotice({
  featureName,
  requiredPlan,
  includedPlans = ["STARTER", "PRO", "ENTERPRISE"],
  priceTag,
  description,
  benefits = [],
  onUpgradeClick,
}: FeatureGateNoticeProps) {
  const displayPlans =
    includedPlans && includedPlans.length > 0
      ? includedPlans
      : requiredPlan
        ? requiredPlan.split(/\s+or\s+|\s*,\s*/i).map((s) => s.trim().toUpperCase())
        : ["STARTER", "PRO", "ENTERPRISE"];

  const defaultDescription =
    "This feature isn't included in your current subscription. Upgrade your plan to unlock.";
  const displayDescription = description || defaultDescription;

  return (
    <div
      className="featureGateContainer"
      style={{
        maxWidth: "720px",
        margin: "40px auto",
        padding: "44px 36px",
        borderRadius: "24px",
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.96) 0%, rgba(30,41,59,0.98) 100%)",
        border: "2px solid rgba(245,158,11,0.45)",
        boxShadow:
          "0 25px 50px -12px rgba(0,0,0,0.6), 0 0 35px rgba(245,158,11,0.18)",
        textAlign: "center",
        color: "#FFFFFF",
        position: "relative",
        overflow: "hidden",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Top subtle glow overlay */}
      <div
        style={{
          position: "absolute",
          top: "-60px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "240px",
          height: "120px",
          background:
            "radial-gradient(ellipse, rgba(245,158,11,0.3) 0%, rgba(0,0,0,0) 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Lock Icon Badge */}
      <div
        style={{
          width: "76px",
          height: "76px",
          borderRadius: "50%",
          background:
            "linear-gradient(135deg, rgba(245,158,11,0.25) 0%, rgba(217,119,6,0.35) 100%)",
          border: "2px solid #F59E0B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "34px",
          margin: "0 auto 20px",
          boxShadow: "0 0 25px rgba(245,158,11,0.4)",
        }}
      >
        🔒
      </div>

      {/* Eyebrow Pill */}
      <div style={{ marginBottom: "12px" }}>
        <span
          style={{
            background: "rgba(245,158,11,0.15)",
            color: "#F59E0B",
            fontSize: "12px",
            fontWeight: 900,
            padding: "6px 16px",
            borderRadius: "20px",
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            border: "1px solid rgba(245,158,11,0.35)",
            display: "inline-block",
          }}
        >
          🔒 PREMIUM FEATURE
        </span>
      </div>

      <h2
        style={{
          fontSize: "28px",
          fontWeight: 850,
          margin: "12px 0 10px",
          color: "#FFFFFF",
          letterSpacing: "-0.5px",
        }}
      >
        {featureName ? `Unlock ${featureName}` : "Premium Feature Locked"}
      </h2>

      <p
        style={{
          color: "#CBD5E1",
          fontSize: "16px",
          lineHeight: "1.6",
          maxWidth: "560px",
          margin: "0 auto 24px",
        }}
      >
        {displayDescription}
      </p>

      {/* Included in: [Plans] */}
      <div
        style={{
          margin: "0 auto 28px",
          padding: "14px 22px",
          background: "rgba(0, 0, 0, 0.4)",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          display: "inline-flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <span style={{ color: "#94A3B8", fontSize: "14px", fontWeight: 700 }}>
          Included in:
        </span>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {displayPlans.map((planName) => (
            <span
              key={planName}
              style={{
                background:
                  "linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(217,119,6,0.25) 100%)",
                color: "#FBBF24",
                border: "1px solid rgba(245,158,11,0.5)",
                fontSize: "12px",
                fontWeight: 800,
                padding: "5px 14px",
                borderRadius: "12px",
                letterSpacing: "0.5px",
              }}
            >
              {planName}
            </span>
          ))}
        </div>
      </div>

      {benefits.length > 0 && (
        <div
          style={{
            background: "rgba(0,0,0,0.3)",
            borderRadius: "16px",
            padding: "20px 24px",
            marginBottom: "28px",
            textAlign: "left",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <strong
            style={{
              color: "#F59E0B",
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Included with Upgrade:
          </strong>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "12px 0 0",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {benefits.map((benefit, idx) => (
              <li
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "14px",
                  color: "#F8FAFC",
                }}
              >
                <span style={{ color: "#22C55E", fontWeight: 900 }}>✓</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upgrade Subscription Button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        {onUpgradeClick ? (
          <MagneticButton
            onClick={onUpgradeClick}
            style={{
              padding: "16px 36px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
              color: "#000000",
              fontWeight: 900,
              fontSize: "16px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 10px 25px rgba(245,158,11,0.4)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            👑 Upgrade Subscription {priceTag ? `(${priceTag})` : ""}
          </MagneticButton>
        ) : (
          <Link
            href="/pricing"
            style={{
              padding: "16px 36px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
              color: "#000000",
              fontWeight: 900,
              fontSize: "16px",
              border: "none",
              cursor: "pointer",
              textDecoration: "none",
              boxShadow: "0 10px 25px rgba(245,158,11,0.4)",
              display: "inline-block",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            👑 Upgrade Subscription {priceTag ? `(${priceTag})` : ""}
          </Link>
        )}
      </div>
    </div>
  );
}
