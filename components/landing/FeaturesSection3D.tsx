"use client";

import { Activity, ShoppingBag, Calendar, MessageSquare, Wallet, BarChart3 } from "lucide-react";

export function FeaturesSection3D() {
  const features = [
    {
      icon: Activity,
      title: "Real-Time Virtual Queues",
      description: "Zero physical waiting rooms. Receive live token updates, ETA predictions, and doctor consultation alerts on your device.",
    },
    {
      icon: ShoppingBag,
      title: "Hyperlocal Storefronts",
      description: "Search live inventory, verified prices, and operating hours across neighborhood grocery, salon, and retail hubs.",
    },
    {
      icon: Calendar,
      title: "Smart Clinic Scheduling",
      description: "Direct doctor appointment bookings with instant time-slot reservation and automated arrival confirmations.",
    },
    {
      icon: MessageSquare,
      title: "Direct Merchant Messaging",
      description: "Encrypted, real-time messaging between customers and shop owners for inquiries, estimates, and order updates.",
    },
    {
      icon: Wallet,
      title: "Digital Wallet & Loyalty Points",
      description: "Earn and redeem loyalty coins automatically with contactless QR code redemption at participating stores.",
    },
    {
      icon: BarChart3,
      title: "Enterprise Owner Telemetry",
      description: "Comprehensive analytics on patient flow, customer repeat rates, revenue growth, and staff performance.",
    },
  ];

  return (
    <section className="py-24" id="features">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <span className="text-[#0284c7] font-bold text-xs uppercase tracking-widest block mb-2">
          Engineered Capabilities
        </span>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mb-4">
          Everything You Need in One Unified Grid
        </h2>
        <p className="text-slate-600 text-base">
          Six foundational pillars powering modern urban commerce and digital healthcare infrastructure.
        </p>
      </div>

      <div className="bentoGrid">
        {features.map((item) => {
          const IconComponent = item.icon;
          return (
            <div key={item.title} className="bentoCard">
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
