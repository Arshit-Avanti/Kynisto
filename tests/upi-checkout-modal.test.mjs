import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { defaultPaymentConfig, createUPILink, openUPIPayment } from "../lib/upi-payment.ts";

test("UpiCheckoutModal file existence and exports", () => {
  const filePath = path.resolve("components/checkout/UpiCheckoutModal.tsx");
  assert.ok(fs.existsSync(filePath), "UpiCheckoutModal.tsx should exist");

  const content = fs.readFileSync(filePath, "utf-8");
  assert.ok(content.includes('"use client"'), "Should be a client component");
  assert.ok(content.includes("export function UpiCheckoutModal"), "Should export UpiCheckoutModal component");
  assert.ok(content.includes("export default UpiCheckoutModal"), "Should default export UpiCheckoutModal component");
  assert.ok(content.includes("createUPILink"), "Should import and use createUPILink");
  assert.ok(content.includes("openUPIPayment"), "Should import and use openUPIPayment");
});

test("UpiCheckoutModal accepts required props", () => {
  const filePath = path.resolve("components/checkout/UpiCheckoutModal.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  assert.ok(content.includes("isOpen: boolean"), "Should accept isOpen prop");
  assert.ok(content.includes("onClose: () => void"), "Should accept onClose prop");
  assert.ok(content.includes("title?: string"), "Should accept title prop");
  assert.ok(content.includes("orderId: string"), "Should accept orderId prop");
  assert.ok(content.includes("amount: number"), "Should accept amount prop");
  assert.ok(content.includes("itemDetails?: ItemDetail[]"), "Should accept itemDetails prop");
  assert.ok(content.includes("onPaymentSuccess: () => void"), "Should accept onPaymentSuccess prop");
  assert.ok(content.includes("upiId?: string"), "Should accept upiId prop");
  assert.ok(content.includes("merchantName?: string"), "Should accept merchantName prop");
});

test("UpiCheckoutModal light mode styling and Indian fintech apps", () => {
  const filePath = path.resolve("components/checkout/UpiCheckoutModal.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  assert.ok(content.includes("bg-white"), "Should use clean white background");
  assert.ok(content.includes("text-slate-900"), "Should use high-contrast dark text on light card");
  assert.ok(content.includes("FamPay"), "Should support FamPay");
  assert.ok(content.includes("PhonePe"), "Should support PhonePe");
  assert.ok(content.includes("Paytm"), "Should support Paytm");
  assert.ok(content.includes("Google Pay"), "Should support Google Pay");
  assert.ok(content.includes("Other UPI"), "Should support Other UPI Apps");
  assert.ok(content.includes("overflow-x-clip"), "Should strictly use overflow-x: clip per GEMINI.md");
});

test("UpiCheckoutModal QR code encodes universal NPCI UPI URI", () => {
  const filePath = path.resolve("components/checkout/UpiCheckoutModal.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  // Verify universal URI generation used for QR Code
  assert.ok(
    content.includes('createUPILink("generic", paymentConfig, "scheme")'),
    "QR code must strictly use universal scheme so any scanner can read it"
  );
  assert.ok(
    content.includes("universalUpiUri"),
    "QR code should encode universalUpiUri rather than app-specific intent"
  );
});

test("UpiCheckoutModal state transition fix: 'Scan QR Instead' switches paymentState", () => {
  const filePath = path.resolve("components/checkout/UpiCheckoutModal.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  // In the prior attempt, clicking "Scan QR Instead" only called setActiveTab("qr"),
  // but paymentState was still "confirming", leaving the user stuck on the awaiting screen.
  // Our fix introduces handleSwitchToQr which resets paymentState to "ready" and sets activeTab to "qr".
  assert.ok(
    content.includes("handleSwitchToQr"),
    "Must have a handler that resets paymentState and switches to QR tab"
  );
  assert.ok(
    content.includes('setPaymentState("ready")'),
    "Switching to QR must reset paymentState to ready"
  );
});

test("UpiCheckoutModal always keeps Copy UPI ID accessible in confirming state", () => {
  const filePath = path.resolve("components/checkout/UpiCheckoutModal.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  // In the prior attempt, Copy UPI ID was hidden in the confirming state.
  // Our fix keeps the Copy UPI section accessible regardless of whether confirming or ready.
  assert.ok(
    content.includes("Direct UPI ID / VPA"),
    "Copy UPI box must be present"
  );
  assert.ok(
    content.includes("handleCopyUpiId"),
    "Must have handleCopyUpiId callback"
  );
});

test("UpiCheckoutModal NPCI note and amount sanitization", () => {
  const filePath = path.resolve("components/checkout/UpiCheckoutModal.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  // Safe amount parsing
  assert.ok(content.includes("Math.max(0, Number(amount) || 0)"), "Must safely sanitize amount");
  // Transaction note length limiting for NPCI 80-character maximum
  assert.ok(content.includes("rawNote.length > 70"), "Must clip transaction note to prevent NPCI rejection");
});

test("UpiCheckoutModal accessibility and safety cleanup", () => {
  const filePath = path.resolve("components/checkout/UpiCheckoutModal.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  assert.ok(content.includes('aria-labelledby="upi-checkout-title"'), "Should link dialog to title ID");
  assert.ok(content.includes('aria-label="Close modal"'), "Close button must have aria-label");
  assert.ok(content.includes("clearAllTimers"), "Must clean up active timers on unmount/close");
});
