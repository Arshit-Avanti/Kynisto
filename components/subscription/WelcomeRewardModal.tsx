"use client";

import { useEffect, useState } from "react";

interface WelcomeRewardModalProps {
  userRole: "admin" | "store_owner" | "customer" | null;
  userId?: string | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export function WelcomeRewardModal({
  userRole,
  userId,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
}: WelcomeRewardModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [rewardData, setRewardData] = useState<{
    planName: string;
    worth: number;
    expiresInDays: number;
  } | null>(null);

  useEffect(() => {
    if (!userRole || userRole === "admin") return;

    const storageKey = `kynisto_welcome_reward_dismissed_${userId || userRole}`;
    const isDismissed = localStorage.getItem(storageKey);

    if (!isDismissed) {
      const isOwner = userRole === "store_owner";
      setRewardData({
        planName: isOwner ? "Pro" : "Premium",
        worth: isOwner ? 499 : 49,
        expiresInDays: 30,
      });
      setInternalOpen(true);
    }
  }, [userRole, userId]);

  const isOpen = externalIsOpen ?? internalOpen;

  const handleClose = () => {
    if (userId || userRole) {
      const storageKey = `kynisto_welcome_reward_dismissed_${userId || userRole}`;
      localStorage.setItem(storageKey, "true");
    }
    setInternalOpen(false);
    if (externalOnClose) externalOnClose();
  };

  if (!isOpen || !rewardData) return null;

  return (
    <div
      className="welcome-reward-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background: "rgba(5, 10, 20, 0.82)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes floatCrown {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(4deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 25px rgba(255, 87, 34, 0.4); }
          50% { box-shadow: 0 0 45px rgba(255, 138, 0, 0.7); }
        }
      `,
        }}
      />

      <div
        className="welcome-reward-card"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "680px",
          background: "linear-gradient(145deg, rgba(22, 30, 48, 0.94) 0%, rgba(12, 18, 32, 0.98) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.16)",
          borderRadius: "32px",
          padding: "40px 36px 32px 36px",
          boxShadow: "0 30px 90px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
          color: "#FFFFFF",
          fontFamily: "system-ui, -apple-system, sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Glowing Ambient Orbs */}
        <div
          style={{
            position: "absolute",
            top: "-60px",
            left: "40px",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255, 138, 0, 0.35) 0%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />

        {/* Top Header Badge */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255, 138, 0, 0.14)",
              border: "1px solid rgba(255, 138, 0, 0.4)",
              color: "#FF8A00",
              fontSize: "12px",
              fontWeight: 800,
              padding: "6px 16px",
              borderRadius: "9999px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            ✨ New Member Reward
          </span>
        </div>

        {/* Main Title */}
        <h2
          style={{
            fontSize: "clamp(2rem, 4vw, 2.8rem)",
            fontWeight: 900,
            textAlign: "center",
            margin: "0 0 10px 0",
            color: "#FFFFFF",
            letterSpacing: "-0.03em",
          }}
        >
          🎉 Welcome to Kynisto!
        </h2>

        {/* Subheading */}
        <p
          style={{
            fontSize: "1.15rem",
            color: "#CBD5E1",
            textAlign: "center",
            margin: "0 auto 32px auto",
            maxWidth: "540px",
            lineHeight: 1.5,
          }}
        >
          Your <strong style={{ color: "#FF7A00", fontWeight: 800 }}>{rewardData.planName}</strong> membership (worth ₹{rewardData.worth}) has been unlocked <span style={{ color: "#10B981", fontWeight: 800 }}>FREE</span> for 1 month.
        </p>

        {/* Content Layout: Features List & Card Graphic */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 220px",
            gap: "24px",
            alignItems: "center",
            marginBottom: "32px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "24px",
            padding: "24px",
          }}
        >
          {/* Features Bullets */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ fontSize: "18px", color: "#FF7A00" }}>⚡</span>
              <span style={{ fontSize: "14px", color: "#E2E8F0", lineHeight: 1.4 }}>
                Discover businesses faster, enjoy premium features, save your favorite places, access loyalty rewards, receive priority updates, and experience Kynisto without limits.
              </span>
            </div>
          </div>

          {/* Card Art Graphic (Inspired 1-to-1 by Screenshot) */}
          <div
            style={{
              position: "relative",
              height: "150px",
              background: "linear-gradient(135deg, rgba(255, 87, 34, 0.25) 0%, rgba(245, 158, 11, 0.2) 100%)",
              border: "1px solid rgba(255, 138, 0, 0.4)",
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0 10px 30px rgba(255, 87, 34, 0.3)",
              animation: "pulseGlow 4s infinite ease-in-out",
            }}
          >
            <div
              style={{
                fontSize: "44px",
                animation: "floatCrown 3s infinite ease-in-out",
                marginBottom: "6px",
              }}
            >
              👑
            </div>
            <div
              style={{
                background: "linear-gradient(135deg, #FF5722 0%, #E53935 100%)",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 900,
                padding: "4px 14px",
                borderRadius: "12px",
                letterSpacing: "0.06em",
                boxShadow: "0 4px 12px rgba(255, 87, 34, 0.5)",
              }}
            >
              {rewardData.planName}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "14px", marginBottom: "20px" }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              flex: 1,
              padding: "16px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #FF5722 0%, #E53935 100%)",
              color: "#FFFFFF",
              fontSize: "16px",
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(255, 87, 34, 0.45)",
              transition: "transform 0.15s ease",
            }}
          >
            Start Exploring
          </button>
          <button
            type="button"
            onClick={handleClose}
            style={{
              flex: 1,
              padding: "16px",
              borderRadius: "16px",
              background: "rgba(255, 255, 255, 0.08)",
              color: "#94A3B8",
              fontSize: "16px",
              fontWeight: 700,
              border: "1px solid rgba(255, 255, 255, 0.12)",
              cursor: "pointer",
            }}
          >
            Maybe Later
          </button>
        </div>

        {/* Footer Note */}
        <p
          style={{
            fontSize: "12px",
            color: "#64748B",
            textAlign: "center",
            margin: 0,
          }}
        >
          No payment required. No credit card needed. {rewardData.planName} expires automatically after 30 days.
        </p>
      </div>
    </div>
  );
}
