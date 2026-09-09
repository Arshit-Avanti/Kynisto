import test from "node:test";
import assert from "node:assert/strict";
import {
  registerPaymentOrder,
  getPaymentOrder,
  verifyOrderWithUtr,
  isUtrAlreadyClaimed,
  matchAndVerifySms,
  DEFAULT_MERCHANT_UPI,
} from "../lib/payment-order-store.ts";
import { parseBankCreditSMS } from "../lib/upi-sms-parser.ts";
import {
  normalizeIndianPhoneNumber,
  isValidIndianMobile,
  sendPaymentReceiptSMS,
} from "../lib/sms-dispatcher.ts";

test("1. Merchant Configuration & Default UPI Target", () => {
  assert.equal(DEFAULT_MERCHANT_UPI, "9315678560@fam");
});

test("2. Order Lifecycle & UTR Auto-Verification", async () => {
  const order = registerPaymentOrder({
    orderId: "KYN-TEST-001",
    amount: 499,
    customerPhone: "9876543210",
    title: "VIP 1-Year Pass",
  });

  assert.equal(order.orderId, "KYN-TEST-001");
  assert.equal(order.amount, 499);
  assert.equal(order.status, "pending");
  assert.equal(order.upiId, "9315678560@fam");

  // Verify with valid 12-digit UTR
  const verifyRes = await verifyOrderWithUtr("KYN-TEST-001", "123456789012", "FamPay");
  assert.equal(verifyRes.success, true);
  assert.equal(verifyRes.order?.status, "verified");
  assert.equal(verifyRes.order?.utr, "123456789012");
  assert.equal(verifyRes.order?.bankName, "FamPay");

  // Anti-Replay / Double Spending Protection
  assert.equal(isUtrAlreadyClaimed("123456789012"), true);
  const secondAttempt = await verifyOrderWithUtr("KYN-TEST-002", "123456789012");
  assert.equal(secondAttempt.success, false);
  assert.ok(secondAttempt.error?.includes("already been redeemed"));
});

test("3. Bank SMS Auto-Reconciliation Matcher", async () => {
  // Create pending order for ₹299
  const order = registerPaymentOrder({
    orderId: "KYN-AUTO-299",
    amount: 299,
    title: "Monthly Store Pass",
  });

  // Simulated FamPay bank incoming credit SMS
  const smsText = "Your FamPay account has been credited with Rs. 299.00 from customer@upi. UPI Ref: 887766554433.";
  const parsed = parseBankCreditSMS(smsText, "FAMPAY");

  const matchRes = await matchAndVerifySms(parsed);
  assert.equal(matchRes.success, true);
  assert.equal(matchRes.verifiedOrder?.orderId, "KYN-AUTO-299");
  assert.equal(matchRes.verifiedOrder?.status, "verified");
  assert.equal(matchRes.verifiedOrder?.utr, "887766554433");
});

test("4. Phone Number Normalization & Mobile Validation", () => {
  assert.equal(normalizeIndianPhoneNumber("9876543210"), "9876543210");
  assert.equal(normalizeIndianPhoneNumber("+919876543210"), "9876543210");
  assert.equal(normalizeIndianPhoneNumber("09876543210"), "9876543210");
  assert.equal(normalizeIndianPhoneNumber("91 98765-43210"), "9876543210");

  assert.equal(isValidIndianMobile("9876543210"), true);
  assert.equal(isValidIndianMobile("7876543210"), true);
  assert.equal(isValidIndianMobile("6876543210"), true);
  assert.equal(isValidIndianMobile("5876543210"), false); // Invalid Indian prefix
  assert.equal(isValidIndianMobile("12345"), false);
});

test("5. SMS Receipt Text Message Construction & Delivery", async () => {
  const result = await sendPaymentReceiptSMS({
    customerPhone: "9876543210",
    orderId: "KYN-SMS-99",
    amount: 499,
    utr: "998877665544",
    planName: "VIP Membership",
  });

  assert.equal(result.success, true);
  assert.ok(result.recipient.includes("9876543210"));
  assert.ok(result.messageId);
});
