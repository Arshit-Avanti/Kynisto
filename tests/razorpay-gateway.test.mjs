import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  createRazorpayOrder,
  generateRazorpaySignature,
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
  verifyAndProcessRazorpayPayment,
  getRazorpayKeyId,
  getRazorpayKeySecret,
  DEFAULT_SANDBOX_KEY_SECRET,
} from "../lib/razorpay-gateway.ts";

test("1. Razorpay Gateway Sandbox Configuration", () => {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();

  assert.ok(keyId, "Razorpay Key ID should be defined");
  assert.ok(keySecret, "Razorpay Key Secret should be defined");
});

test("2. Razorpay Order Creation & Currency Conversion", async () => {
  const order = await createRazorpayOrder({
    amount: 499,
    receipt: "KYN-TEST-RZP-101",
    currency: "INR",
  });

  assert.ok(order.id.startsWith("order_"), `Order ID should start with order_, got: ${order.id}`);
  assert.equal(order.amount, 49900, "₹499 should be converted to 49900 paise");
  assert.equal(order.currency, "INR");
  assert.equal(order.receipt, "KYN-TEST-RZP-101");
});

test("3. Cryptographic HMAC-SHA256 Signature Verification", () => {
  const orderId = "order_NxtArshit2026";
  const paymentId = "pay_NxtArshitPayment99";

  // Generate authentic signature
  const validSignature = generateRazorpaySignature(orderId, paymentId);
  assert.equal(typeof validSignature, "string");
  assert.equal(validSignature.length, 64, "SHA-256 hex digest should be 64 characters");

  // Verify valid signature
  const isValid = verifyRazorpaySignature(orderId, paymentId, validSignature);
  assert.equal(isValid, true, "Signature verification must succeed for valid pair");

  // Reject tampered payment ID
  const tamperedPayment = verifyRazorpaySignature(orderId, "pay_TAMPERED", validSignature);
  assert.equal(tamperedPayment, false, "Must reject tampered payment ID");

  // Reject tampered order ID
  const tamperedOrder = verifyRazorpaySignature("order_TAMPERED", paymentId, validSignature);
  assert.equal(tamperedOrder, false, "Must reject tampered order ID");

  // Reject forged signature
  const forgedSig = verifyRazorpaySignature(orderId, paymentId, "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
  assert.equal(forgedSig, false, "Must reject forged signature");
});

test("4. Server-to-Server Webhook Signature Verification", () => {
  const webhookSecret = "test_webhook_secret_kynisto";
  const rawBody = JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: "pay_1020304050",
          amount: 49900,
          status: "captured",
        },
      },
    },
  });

  // Calculate signature using crypto
  const expectedSig = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const isWebhookValid = verifyRazorpayWebhookSignature(rawBody, expectedSig, webhookSecret);
  assert.equal(isWebhookValid, true, "Webhook signature verification must succeed");

  // Rejection of modified payload
  const tamperedPayload = rawBody.replace("49900", "99900");
  const isTamperedValid = verifyRazorpayWebhookSignature(tamperedPayload, expectedSig, webhookSecret);
  assert.equal(isTamperedValid, false, "Must reject modified webhook payload");
});

test("5. End-to-End Payment Verification & SMS Receipt Dispatch", async () => {
  const orderId = "order_EndToEnd001";
  const paymentId = "pay_EndToEndSuccess";
  const signature = generateRazorpaySignature(orderId, paymentId);

  const result = await verifyAndProcessRazorpayPayment({
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    razorpaySignature: signature,
    customerPhone: "9315678560",
    customerEmail: "nxt.arshit@gmail.com",
    amount: 499,
    title: "VIP 1-Year Membership",
  });

  assert.equal(result.isValid, true);
  assert.equal(result.orderId, orderId);
  assert.equal(result.paymentId, paymentId);
  assert.equal(result.smsDispatched, true);
  assert.ok(result.timestamp, "Must record IST timestamp");
});
