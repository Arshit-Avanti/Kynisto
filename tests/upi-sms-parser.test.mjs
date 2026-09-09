import test from "node:test";
import assert from "node:assert/strict";
import {
  parseBankCreditSMS,
  normalizeAmount,
  isValidUTR,
  KNOWN_BANK_RULES,
} from "../lib/upi-sms-parser.ts";

test("1. FamPay / FamApp Credit SMS Parsing", () => {
  const sms = "Your FamPay account has been credited with Rs. 499.00 from rahul@okhdfcbank. UPI Ref: 425312891045. Available balance: Rs 1,250.00";
  const result = parseBankCreditSMS(sms, "FAMPAY");

  assert.equal(result.isValid, true);
  assert.equal(result.isCredit, true);
  assert.equal(result.bank, "FamPay");
  assert.equal(result.amount, 499.00);
  assert.equal(result.utr, "425312891045");
  assert.equal(result.error, undefined);
});

test("2. FamApp Received Cash SMS Parsing", () => {
  const sms = "Received Rs 1499.00 in your account via UPI Ref 987654321098. Check your FamApp wallet.";
  const result = parseBankCreditSMS(sms, "FAMAPP");

  assert.equal(result.isValid, true);
  assert.equal(result.isCredit, true);
  assert.equal(result.bank, "FamPay");
  assert.equal(result.amount, 1499.00);
  assert.equal(result.utr, "987654321098");
});

test("3. State Bank of India (SBI) UPI Credit SMS Parsing", () => {
  const sms = "Dear SBI UPI User, A/C *7842 credited by Rs 299.00 on 09Sep26 by UPI Ref no 425312891045 - SBI";
  const result = parseBankCreditSMS(sms, "VK-SBIINB");

  assert.equal(result.isValid, true);
  assert.equal(result.isCredit, true);
  assert.equal(result.bank, "State Bank of India");
  assert.equal(result.amount, 299.00);
  assert.equal(result.utr, "425312891045");
  assert.equal(result.accountEnding, "7842");
});

test("4. HDFC Bank UPI Credit SMS Parsing", () => {
  const sms = "HDFC Bank: Rs 999.00 credited to a/c **4120 on 09-SEP-26. Info: UPI:324567890123-Payment. Bal: INR 15,400.00";
  const result = parseBankCreditSMS(sms, "AD-HDFCBK");

  assert.equal(result.isValid, true);
  assert.equal(result.isCredit, true);
  assert.equal(result.bank, "HDFC Bank");
  assert.equal(result.amount, 999.00);
  assert.equal(result.utr, "324567890123");
});

test("5. ICICI Bank UPI Credit SMS Parsing", () => {
  const sms = "Dear Customer, your ICICI Bank A/C XX901 has been credited with INR 499.00 on 09-Sep-26. UPI:512345678901. Call 1800 for dispute.";
  const result = parseBankCreditSMS(sms, "VM-ICICIB");

  assert.equal(result.isValid, true);
  assert.equal(result.isCredit, true);
  assert.equal(result.bank, "ICICI Bank");
  assert.equal(result.amount, 499.00);
  assert.equal(result.utr, "512345678901");
});

test("6. Axis Bank UPI Credit SMS Parsing", () => {
  const sms = "A/c *4455 credited for INR 499.00 on 09-09-26 by UPI:499;Ref No:612345678901. Axis Bank.";
  const result = parseBankCreditSMS(sms, "AX-AXISBK");

  assert.equal(result.isValid, true);
  assert.equal(result.isCredit, true);
  assert.equal(result.bank, "Axis Bank");
  assert.equal(result.amount, 499.00);
  assert.equal(result.utr, "612345678901");
});

test("7. Paytm Payments Bank Credit SMS Parsing", () => {
  const sms = "Received Rs.499.00 in your Paytm Payments Bank A/c 9315678560. UPI Ref: 712345678901.";
  const result = parseBankCreditSMS(sms, "PAYTM");

  assert.equal(result.isValid, true);
  assert.equal(result.isCredit, true);
  assert.equal(result.bank, "Paytm Payments Bank");
  assert.equal(result.amount, 499.00);
  assert.equal(result.utr, "712345678901");
});

test("8. Rejection of Debit Alerts & OTP SMS", () => {
  const debitSms = "A/c *1234 debited for Rs 499.00 on 09-09-26. Info: UPI/425312891045. If not you, block card.";
  const debitResult = parseBankCreditSMS(debitSms);
  assert.equal(debitResult.isValid, false);
  assert.equal(debitResult.isCredit, false);
  assert.ok(debitResult.error?.includes("debit alert"));

  const otpSms = "123456 is the OTP for your online payment of Rs 499.00. Do not share.";
  const otpResult = parseBankCreditSMS(otpSms);
  assert.equal(otpResult.isValid, false);
});

test("9. UTR and Amount Helper Normalization", () => {
  assert.equal(isValidUTR("425312891045"), true);
  assert.equal(isValidUTR("42531289104"), false); // 11 digits
  assert.equal(isValidUTR("4253128910459"), false); // 13 digits
  assert.equal(isValidUTR("42531289104A"), false); // non-numeric

  assert.equal(normalizeAmount("499"), 499);
  assert.equal(normalizeAmount("1,499.50"), 1499.5);
  assert.equal(normalizeAmount("0"), null);
  assert.equal(normalizeAmount("-50"), null);
});
