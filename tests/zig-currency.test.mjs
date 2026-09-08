import test from "node:test";
import assert from "node:assert/strict";
import {
  kynistoToPaise,
  kynistoToRupees,
  kynistoSaturatingAdd,
  kynistoSaturatingSub,
  kynistoCalculateGstSplit,
  kynistoFormatInr,
  getKynistoZigStatus,
} from "../lib/kynisto-zig.ts";

test("Zig Engine Status & Telemetry", () => {
  const status = getKynistoZigStatus();
  assert.equal(status.version, "2.1.0-zig-currency");
  assert.equal(status.precisionDriftPercent, "0.000%");
  assert.ok(status.capabilities.length >= 4);
});

test("Zig Fixed-Point Currency Conversion", () => {
  assert.equal(kynistoToPaise(500), 50000n);
  assert.equal(kynistoToPaise(499.99), 49999n);
  assert.equal(kynistoToPaise("1250.50"), 125050n);

  assert.equal(kynistoToRupees(50000n), 500);
  assert.equal(kynistoToRupees(49999n), 499.99);
});

test("Zig Saturating Integer Arithmetic (Wallet Underflow Protection)", () => {
  // Normal addition & subtraction
  assert.equal(kynistoSaturatingAdd(5000n, 2500n), 7500n);
  assert.equal(kynistoSaturatingSub(5000n, 2000n), 3000n);

  // Saturating subtraction prevents negative wallet balance underflow
  assert.equal(kynistoSaturatingSub(1000n, 5000n), 0n);
  assert.equal(kynistoSaturatingSub(0n, 500n), 0n);
});

test("Zig Lossless Indian GST Tax Breakdown (Intrastate & Interstate)", () => {
  // ₹500 Consultation fee at 18% GST (Intrastate)
  const gst18 = kynistoCalculateGstSplit(500, 18, false);

  assert.equal(gst18.isBalanced, true);
  assert.equal(gst18.totalPaise, 50000n);
  // Base + CGST + SGST must exactly equal totalPaise with zero remainder
  assert.equal(gst18.baseAmountPaise + gst18.cgstPaise + gst18.sgstPaise, 50000n);
  assert.ok(Math.abs(Number(gst18.cgstPaise - gst18.sgstPaise)) <= 1); // Conserves odd paise

  // ₹1,000 Order at 18% GST (Interstate - IGST)
  const igst18 = kynistoCalculateGstSplit(1000, 18, true);
  assert.equal(igst18.isBalanced, true);
  assert.equal(igst18.baseAmountPaise + igst18.igstPaise, 100000n);
  assert.equal(igst18.cgstPaise, 0n);
  assert.equal(igst18.sgstPaise, 0n);
  assert.ok(igst18.igstPaise > 0n);

  // ₹0 Edge case
  const zeroGst = kynistoCalculateGstSplit(0, 18);
  assert.equal(zeroGst.totalPaise, 0n);
  assert.equal(zeroGst.totalTaxPaise, 0n);
});

test("Zig Indian Rupee (INR) En-IN Formatting", () => {
  const formatted = kynistoFormatInr(125000.50);
  assert.ok(formatted.includes("1,25,000.50") || formatted.includes("125,000.50"));
});
