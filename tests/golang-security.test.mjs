import test from "node:test";
import assert from "node:assert/strict";
import {
  kynistoConstantTimeCompare,
  kynistoVerifyTokenConstantTime,
  kynistoSealPrescription,
  kynistoVerifyPrescriptionIntegrity,
  kynistoRateLimitGuard,
  kynistoTriggerGcSweep,
  getKynistoGoStatus,
} from "../lib/kynisto-go.ts";

test("Golang Engine Status & Telemetry", () => {
  const status = getKynistoGoStatus();
  assert.equal(status.version, "2.1.0-go-security");
  assert.ok(status.gcModel.includes("Mark-Sweep"));
  assert.ok(status.securityFeatures.length >= 4);
  console.log("Active Go Security Engine:", status.engine, "| GC Model:", status.gcModel);
});

test("ConstantTimeCompare - Timing-Attack Resistance", () => {
  // Matching strings
  assert.equal(kynistoConstantTimeCompare("secret-token-xyz-12345", "secret-token-xyz-12345"), true);
  assert.equal(kynistoConstantTimeCompare("", ""), true);

  // Differing by one character
  assert.equal(kynistoConstantTimeCompare("secret-token-xyz-12345", "secret-token-xyz-12346"), false);
  assert.equal(kynistoConstantTimeCompare("a", "b"), false);

  // Differing lengths
  assert.equal(kynistoConstantTimeCompare("secret", "secret-long"), false);
  assert.equal(kynistoConstantTimeCompare("secret-long", "secret"), false);

  // Token helper
  assert.equal(kynistoVerifyTokenConstantTime("  auth_token_999  ", "auth_token_999"), true);
  assert.equal(kynistoVerifyTokenConstantTime("auth_token_998", "auth_token_999"), false);
});

test("Tamper-Evident Healthcare Prescription Audit Ledger", async () => {
  const rx1 = {
    prescriptionNumber: "RX-202609-1001",
    doctorId: "doc_dr_sharma",
    patientName: "Rahul Verma",
    patientId: "pid_rahul_1",
    issuedAt: 1725800000,
    status: "issued",
    medicines: [
      { name: "Paracetamol", dosage: "500mg", frequency: "1-0-1", duration: "5 days" },
      { name: "Amoxicillin", dosage: "250mg", frequency: "1-1-1", duration: "7 days" },
    ],
  };

  const block = await kynistoSealPrescription(rx1);
  assert.ok(block.blockHash.length === 64, "Block hash should be 64-char SHA-256");
  assert.ok(block.signature.length === 64, "Signature should be 64-char SHA-256");

  // Valid prescription verification
  const isValid = await kynistoVerifyPrescriptionIntegrity(rx1, block.blockHash);
  assert.equal(isValid, true, "Prescription should verify cleanly against its block hash");

  // TAMPER ATTEMPT 1: Alter medicine dosage (e.g. 500mg -> 1000mg)
  const tamperedMeds = {
    ...rx1,
    medicines: [
      { name: "Paracetamol", dosage: "1000mg", frequency: "1-0-1", duration: "5 days" },
      { name: "Amoxicillin", dosage: "250mg", frequency: "1-1-1", duration: "7 days" },
    ],
  };
  const tampered1Valid = await kynistoVerifyPrescriptionIntegrity(tamperedMeds, block.blockHash);
  assert.equal(tampered1Valid, false, "Tampered dosage MUST fail cryptographic verification");

  // TAMPER ATTEMPT 2: Alter doctor ID
  const tamperedDoctor = { ...rx1, doctorId: "doc_malicious_attacker" };
  const tampered2Valid = await kynistoVerifyPrescriptionIntegrity(tamperedDoctor, block.blockHash);
  assert.equal(tampered2Valid, false, "Tampered doctor ID MUST fail verification");

  // TAMPER ATTEMPT 3: Alter prescription number
  const tamperedRxNum = { ...rx1, prescriptionNumber: "RX-202609-9999" };
  const tampered3Valid = await kynistoVerifyPrescriptionIntegrity(tamperedRxNum, block.blockHash);
  assert.equal(tampered3Valid, false, "Tampered prescription number MUST fail verification");
});

test("Token-Bucket Rate Limiter with Mark-Sweep GC", () => {
  const scope = "test-rate";
  const key = "192.168.1.100";

  // Capacity 5 tokens, 1 token/sec refill
  for (let i = 0; i < 5; i++) {
    const res = kynistoRateLimitGuard(scope, key, 5, 1.0);
    assert.equal(res.allowed, true, `Request #${i + 1} should be allowed`);
  }

  // 6th request should be blocked
  const blocked = kynistoRateLimitGuard(scope, key, 5, 1.0);
  assert.equal(blocked.allowed, false, "6th request should exceed token bucket capacity");
  assert.ok(blocked.retryAfterSec !== undefined && blocked.retryAfterSec > 0);

  // Different IP should still have its own fresh bucket
  const otherIp = kynistoRateLimitGuard(scope, "192.168.1.101", 5, 1.0);
  assert.equal(otherIp.allowed, true, "Different IP should have separate bucket");

  // Mark-Sweep GC sweep invocation
  const gc = kynistoTriggerGcSweep();
  assert.ok(typeof gc.heapLiveEntries === "number");
  assert.ok(typeof gc.sweptEntries === "number");
});

test("High-Throughput Security Benchmark", () => {
  const N = 20000;
  const t0 = Date.now();
  let matches = 0;
  for (let i = 0; i < N; i++) {
    if (kynistoConstantTimeCompare("secure_user_token_abc_123", "secure_user_token_abc_123")) {
      matches++;
    }
  }
  const elapsed = Date.now() - t0;
  assert.equal(matches, N);
  assert.ok(elapsed < 100, `20,000 constant-time comparisons should complete in <100ms, took ${elapsed}ms`);
});
