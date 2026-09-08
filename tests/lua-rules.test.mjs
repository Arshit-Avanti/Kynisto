import test from "node:test";
import assert from "node:assert/strict";
import {
  kynistoEvaluateDiscountRule,
  kynistoEvaluateQueuePriorityRule,
  kynistoEvaluateLoyaltyMultiplier,
  getKynistoLuaStatus,
} from "../lib/kynisto-lua.ts";

test("Lua Engine Status & Telemetry", () => {
  const status = getKynistoLuaStatus();
  assert.equal(status.version, "2.1.0-lua-rules");
  assert.equal(status.executionModel, "Zero-Eval Isolated Microsecond Sandbox");
  assert.ok(status.capabilities.length >= 4);
});

test("Lua Rule Evaluation - Merchant Promotional Discounts", () => {
  // 1. FIRST100: First-order welcome bonus
  const r1 = kynistoEvaluateDiscountRule({
    cartTotal: 600,
    userOrders: 0,
    promoCode: "FIRST100",
  });
  assert.equal(r1.isDiscounted, true);
  assert.equal(r1.discountAmount, 100);
  assert.equal(r1.finalTotal, 500);
  assert.equal(r1.appliedRule, "FIRST_ORDER_WELCOME");

  // 2. SUNDAY15: 15% discount capped at ₹150
  const r2 = kynistoEvaluateDiscountRule({
    cartTotal: 1200,
    dayOfWeek: "Sunday",
  });
  assert.equal(r2.isDiscounted, true);
  assert.equal(r2.discountAmount, 150); // 1200 * 0.15 = 180, capped at 150
  assert.equal(r2.finalTotal, 1050);

  // 3. SENIOR20: 20% discount for patients age >= 65
  const r3 = kynistoEvaluateDiscountRule({
    cartTotal: 500,
    patientAge: 72,
    promoCode: "SENIOR20",
  });
  assert.equal(r3.isDiscounted, true);
  assert.equal(r3.discountAmount, 100); // 500 * 0.20 = 100
  assert.equal(r3.finalTotal, 400);
  assert.equal(r3.appliedRule, "SENIOR_CITIZEN_CARE");

  // 4. Ineligible order
  const r4 = kynistoEvaluateDiscountRule({
    cartTotal: 250,
    promoCode: "FIRST100",
    userOrders: 5, // Not a new user
  });
  assert.equal(r4.isDiscounted, false);
  assert.equal(r4.discountAmount, 0);
  assert.equal(r4.finalTotal, 250);
});

test("Lua Rule Evaluation - Patient Queue Priority Tiers", () => {
  // Emergency Fast-Track: Priority 1
  const p1 = kynistoEvaluateQueuePriorityRule({
    isEmergency: true,
    patientAge: 45,
  });
  assert.equal(p1.priorityTier, 1);
  assert.equal(p1.label, "EMERGENCY_FAST_TRACK");

  // Super-Senior (Age >= 75): Priority 1
  const p2 = kynistoEvaluateQueuePriorityRule({
    patientAge: 82,
  });
  assert.equal(p2.priorityTier, 1);
  assert.equal(p2.label, "SUPER_SENIOR_PRIORITY");

  // Senior Citizen (Age >= 60): Priority 2
  const p3 = kynistoEvaluateQueuePriorityRule({
    patientAge: 64,
  });
  assert.equal(p3.priorityTier, 2);
  assert.equal(p3.label, "SENIOR_CITIZEN_PRIORITY");

  // Pediatric Infant (Age <= 2): Priority 2
  const p4 = kynistoEvaluateQueuePriorityRule({
    patientAge: 1,
  });
  assert.equal(p4.priorityTier, 2);
  assert.equal(p4.label, "PEDIATRIC_INFANT_PRIORITY");

  // Standard OPD: Priority 3
  const p5 = kynistoEvaluateQueuePriorityRule({
    patientAge: 32,
    isEmergency: false,
  });
  assert.equal(p5.priorityTier, 3);
  assert.equal(p5.label, "STANDARD_OPD");
});

test("Lua Rule Evaluation - Dynamic Loyalty Point Multipliers", () => {
  assert.equal(kynistoEvaluateLoyaltyMultiplier("platinum", 100), 300);
  assert.equal(kynistoEvaluateLoyaltyMultiplier("gold", 100), 200);
  assert.equal(kynistoEvaluateLoyaltyMultiplier("silver", 100), 150);
  assert.equal(kynistoEvaluateLoyaltyMultiplier("bronze", 100), 100);
});
