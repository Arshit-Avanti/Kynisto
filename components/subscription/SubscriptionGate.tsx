"use client";

import React from "react";
import { FeatureGateNotice } from "./FeatureGateNotice";

export interface SubscriptionGateProps {
  /** The current subscription plan object or plan ID */
  plan?: Record<string, any> | string;
  /** Feature flag key (e.g. 'allowQueueManagement', 'allowAnalytics', 'allowPromotions', 'allowCustomBranding') */
  feature?: string;
  /** List of plans that include this feature (e.g. ['STARTER', 'PRO', 'ENTERPRISE']) */
  includedPlans?: string[];
  /** Explicit override boolean. If true, unlocks feature; if false, locks it. */
  isUnlocked?: boolean;
  /** Human readable name of the locked feature */
  featureName?: string;
  /** Price description tag (e.g. 'From ₹299/month') */
  priceTag?: string;
  /** Custom description text */
  description?: string;
  /** Benefits bullet points */
  benefits?: string[];
  /** Required plan string for legacy fallback */
  requiredPlan?: string;
  /** Handler when upgrade button is clicked */
  onUpgradeClick?: () => void;
  /** Content to display when the feature is unlocked */
  children: React.ReactNode;
  /** Custom fallback element to render when locked instead of default FeatureGateNotice */
  fallback?: React.ReactNode;
}

export function SubscriptionGate({
  plan,
  feature,
  includedPlans,
  isUnlocked,
  featureName = "Premium Feature",
  priceTag,
  description,
  benefits,
  requiredPlan,
  onUpgradeClick,
  children,
  fallback,
}: SubscriptionGateProps) {
  let unlocked = false;

  if (typeof isUnlocked === "boolean") {
    unlocked = isUnlocked;
  } else {
    // Determine plan ID & plan object
    const planObj = typeof plan === "object" && plan !== null ? plan : {};
    const planId = (
      typeof plan === "string" ? plan : planObj.id ?? "free"
    ).toLowerCase();

    // Admin & Enterprise plans unlock everything
    if (
      planId === "enterprise" ||
      planId === "admin" ||
      planObj.role === "admin"
    ) {
      unlocked = true;
    } else if (feature && typeof planObj[feature] === "boolean") {
      // Check feature flag directly on plan object (e.g., planObj.allowQueueManagement)
      unlocked = planObj[feature];
    } else if (includedPlans && includedPlans.length > 0) {
      // Check if planId is in includedPlans array
      unlocked = includedPlans.some((p) => p.toLowerCase() === planId);
    } else if (feature) {
      // Default checks based on feature name if feature flag isn't directly on object
      switch (feature) {
        case "allowQueueManagement":
          unlocked = ["starter", "pro", "enterprise"].includes(planId);
          break;
        case "allowAnalytics":
          unlocked = ["starter", "pro", "enterprise"].includes(planId);
          break;
        case "allowPromotions":
          unlocked = ["pro", "enterprise"].includes(planId);
          break;
        case "allowCoupons":
          unlocked = ["pro", "enterprise"].includes(planId);
          break;
        case "allowCustomBranding":
          unlocked = ["pro", "enterprise"].includes(planId);
          break;
        case "allowStaffAccounts":
          unlocked = ["pro", "enterprise"].includes(planId);
          break;
        default:
          unlocked = false;
      }
    }
  }

  // Render children if feature is unlocked
  if (unlocked) {
    return <>{children}</>;
  }

  // Block data rendering & render fallback or FeatureGateNotice
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <FeatureGateNotice
      featureName={featureName}
      requiredPlan={requiredPlan}
      includedPlans={includedPlans}
      priceTag={priceTag}
      description={description}
      benefits={benefits}
      onUpgradeClick={onUpgradeClick}
    />
  );
}
