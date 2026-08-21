"use client";

import { Activity, ShoppingBag, Calendar, MessageSquare, Wallet, BarChart3 } from "lucide-react";

export function FeaturesSection3D() {
  const features = [
    {
      icon: Activity,
      title: "Real-Time Virtual Queues",
      description: "Zero physical waiting rooms. Receive live token updates, ETA predictions, and doctor consultation alerts on your device.",
      glow: "#00f0ff",
    },
    {
      icon: ShoppingBag,
      title: "Hyperlocal Storefronts",
      description: "Search live inventory, verified prices, and operating hours across neighborhood grocery, salon, and retail hubs.",
      glow: "#2457ff",
    },
    {
      icon: Calendar,
      title: "Smart Clinic Scheduling",
      description: "Direct doctor appointment bookings with instant time-slot reservation and automated arrival confirmations.",
      glow: "#7928ca",
    },
    {
      icon: MessageSquare,
      title: "Direct Merchant Messaging",
      description: "Encrypted, real-time messaging between customers and shop owners for inquiries, estimates, and order updates.",
      glow: "#ff8a00",
    },
    {
      icon: Wallet,
      title: "Digital Wallet & Loyalty Points",
      description: "Earn and redeem loyalty coins automatically with contactless QR code redemption at participating stores.",
      glow: "#10b981",
    },
    {
      icon: BarChart3,
      title: "Enterprise Owner Telemetry",
      description: "Comprehensive analytics on patient flow, customer repeat rates, revenue growth, and staff performance.",
      glow: "#38bdf8",
    },
  ];

  return (
    <section className="py-24" id="features">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <span className="text-[#38bdf8] font-bold text-xs uppercase tracking-widest block mb-2">
          Engineered Capabilities
        </span>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
          Everything You Need in One Unified Grid
        </h2>
        <p className="text-slate-400 text-base">
          Six foundational pillars powering modern urban commerce and digital healthcare infrastructure.
        </p>
      </div>

      <div className="bentoGrid">
        {features.map((item) => {
          const IconComponent = item.icon;
          return (
            <div key={item.title} className="bentoCard">
              <div className="bentoCardGlow" />
              <div className="bentoIconWrapper">
                <IconComponent className="w-6 h-6" />
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
