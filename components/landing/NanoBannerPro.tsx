"use client";

import { useEffect, useState } from "react";
import { Sparkles, ArrowRight, X, Zap, ShieldCheck, Gift } from "lucide-react";

const ANNOUNCEMENTS = [
  {
    icon: Zap,
    text: "Kynisto 2.1 Pro Max: 15,240+ Active Locality Nodes • Sub-Second Queue Dispatch",
    badge: "LIVE GRID",
    badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
    actionText: "Explore Grid",
    actionHref: "#places",
  },
  {
    icon: ShieldCheck,
    text: "Zero Clinic Waiting Rooms: Live Doctor Queue Tracking & Instant Token Alerts",
    badge: "HEALTHCARE",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    actionText: "View Clinics",
    actionHref: "/healthcare",
  },
  {
    icon: Gift,
    text: "Claim Welcome Rewards: 500 Loyalty Coins on your first neighborhood visit",
    badge: "REWARDS",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    actionText: "Claim Coins",
    actionHref: "/wallet",
  },
];

export function NanoBannerPro() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
        setAnimating(false);
      }, 300);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  if (!visible) return null;

  const current = ANNOUNCEMENTS[index];
  const IconComponent = current.icon;

  return (
    <aside
      className="nanoBannerPro"
      aria-label="System Announcement"
    >
      <div className="nanoBannerInner">
        <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-center">
          <span className={`nanoBadge ${current.badgeColor}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping mr-1" />
            {current.badge}
          </span>

          <div
            className={`nanoTextWrapper ${
              animating ? "opacity-0 -translate-y-1" : "opacity-100 translate-y-0"
            } transition-all duration-300 flex items-center gap-2 min-w-0`}
          >
            <IconComponent className="w-3.5 h-3.5 text-cyan-400 shrink-0 hidden sm:inline-block" />
            <span className="truncate text-xs sm:text-[13px] font-medium text-slate-200">
              {current.text}
            </span>
          </div>

          <a
            href={current.actionHref}
            className="nanoActionChip hidden md:inline-flex items-center gap-1 text-xs font-bold text-cyan-300 hover:text-cyan-200 transition-colors"
          >
            <span>{current.actionText}</span>
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>

        <button
          type="button"
          onClick={() => setVisible(false)}
          className="nanoCloseBtn"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
