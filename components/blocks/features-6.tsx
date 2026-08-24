"use client";

import React from "react";
import { CobeGlobe } from "@/components/blocks/cobe-globe";

export function EfferdFeatures6() {
  return (
    <section className="efferdFeatures6Container" aria-label="Core Platform Capabilities">
      {/* Top 3 Column Cards */}
      <div className="efferdFeatures6TopGrid">
        {/* Card 1: Universal Discovery */}
        <div className="efferdBentoCard topCard searchCard">
          <div className="efferdIconGlowWrapper searchGlow">
            <svg
              className="efferdFeatureIcon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FF7A00"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <div className="efferdCardBody">
            <h3 className="efferdCardTitle">Universal Discovery</h3>
            <p className="efferdCardDesc">
              Find what you need, exactly when you need it. Intelligent search that understands intent and proximity.
            </p>
          </div>
        </div>

        {/* Card 2: Real-time Queues */}
        <div className="efferdBentoCard topCard queueCard">
          <div className="efferdIconGlowWrapper clockGlow">
            <svg
              className="efferdFeatureIcon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00D4FF"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="efferdCardBody">
            <h3 className="efferdCardTitle">Real-time Queues</h3>
            <p className="efferdCardDesc">
              Skip the waiting room. Monitor your position in line from anywhere and arrive exactly when it&apos;s your turn.
            </p>
          </div>
        </div>

        {/* Card 3: Unified Loyalty */}
        <div className="efferdBentoCard topCard loyaltyCard">
          <div className="efferdIconGlowWrapper starGlow">
            <svg
              className="efferdFeatureIcon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="#00E676"
              stroke="#00E676"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className="efferdCardBody">
            <h3 className="efferdCardTitle">Unified Loyalty</h3>
            <p className="efferdCardDesc">
              One wallet for every store. Earn, track, and redeem rewards seamlessly without juggling multiple apps.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom 2 Bento Cards */}
      <div className="efferdFeatures6BottomGrid">
        {/* Card 4: Sleek & Intuitive Design */}
        <div className="efferdBentoCard bottomCard designCard">
          <div className="designCardContent">
            <div className="efferdIconGlowWrapper pointerGlow">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FF9100"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                <path d="M13 13l6 6" />
              </svg>
            </div>
            <div className="efferdCardBody">
              <h3 className="efferdCardTitle">Sleek &amp; Intuitive Design</h3>
              <p className="efferdCardDesc">
                Manage &amp; scale your business effortlessly using our user-friendly interface.
              </p>
            </div>
          </div>

          <div className="dashboardPreviewContainer">
            <div className="dashboardWindowMockup">
              <div className="mockupHeader">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
                <span className="mockupTitle">Kynisto Studio</span>
              </div>
              <div className="mockupBody">
                <div className="mockupStatsRow">
                  <div className="statPill">
                    <span className="statVal">99.8%</span>
                    <span className="statLbl">Uptime</span>
                  </div>
                  <div className="statPill">
                    <span className="statVal">1.2s</span>
                    <span className="statLbl">Live Sync</span>
                  </div>
                  <div className="statPill highlight">
                    <span className="statVal">100+</span>
                    <span className="statLbl">Verified</span>
                  </div>
                </div>
                <div className="mockupGraphLines">
                  <div className="graphLine bar1" />
                  <div className="graphLine bar2" />
                  <div className="graphLine bar3" />
                  <div className="graphLine bar4" />
                  <div className="graphLine bar5" />
                  <div className="graphLine bar6" />
                  <div className="graphLine bar7" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 5: Access Anytime, Anywhere with Rotating Earth Globe */}
        <div className="efferdBentoCard bottomCard globeCard">
          <div className="globeCardContent">
            <div className="efferdIconGlowWrapper globeGlow">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#00E5FF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <div className="efferdCardBody">
              <h3 className="efferdCardTitle">Access Anytime, Anywhere</h3>
              <p className="efferdCardDesc">
                Stay connected to your business no matter where you are, with our cloud-based access.
              </p>
            </div>
          </div>

          <div className="globeVisualWrapper">
            <CobeGlobe className="globeCanvas" />
          </div>
        </div>
      </div>
    </section>
  );
}
