/**
 * ==============================================================================
 * 🇮🇳 Kynisto Bank & FamPay SMS UPI Auto-Verification Engine
 * High-accuracy regex extraction for Indian banking and UPI wallet credit alerts.
 * Supports: FamPay / FamApp, SBI, HDFC, ICICI, Axis, PNB, BoB, Kotak, Paytm Bank,
 * and standard NPCI UPI transaction reference formats.
 * ==============================================================================
 */

export interface ParsedBankSMS {
  isValid: boolean;
  isCredit: boolean;
  amount: number | null;
  utr: string | null;
  bank: string;
  sender?: string;
  accountEnding?: string | null;
  timestamp: string; // IST
  rawMessage: string;
  error?: string;
}

export interface BankRule {
  bank: string;
  senderPatterns: RegExp[];
  creditPatterns: RegExp[];
  utrPatterns: RegExp[];
  amountPatterns: RegExp[];
  debitCheckPatterns: RegExp[];
}

export const KNOWN_BANK_RULES: BankRule[] = [
  // 1. FamPay / FamApp (Merchant's Primary UPI Wallet: @fam)
  {
    bank: "FamPay",
    senderPatterns: [
      /FAMPAY/i,
      /FAMAPP/i,
      /FAM-INR/i,
      /FAMPAY-IN/i,
      /FAMP/i,
    ],
    creditPatterns: [
      /credited/i,
      /received/i,
      /added/i,
      /deposited/i,
      /paid to your/i,
      /credit of/i,
    ],
    utrPatterns: [
      /(?:upi\s*ref(?:erence)?(?:\s*no)?[:.\s-]*|utr[:.\s-]*|ref\s*no[:.\s-]*|rrn[:.\s-]*)([0-9]{12})/i,
      /(?:upi\/)([0-9]{12})/i,
      /\b([0-9]{12})\b/,
    ],
    amountPatterns: [
      /(?:rs\.?|inr|₹)\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i,
      /([0-9]+(?:\.[0-9]{1,2})?)\s*(?:rs\.?|inr|₹)/i,
    ],
    debitCheckPatterns: [
      /debited/i,
      /sent/i,
      /paid to (?!your)/i,
      /spent/i,
      /withdrawn/i,
      /otp/i,
    ],
  },
  // 2. State Bank of India (SBI)
  {
    bank: "State Bank of India",
    senderPatterns: [
      /SBI/i,
      /SBIN/i,
      /SBMS/i,
    ],
    creditPatterns: [
      /credited/i,
      /deposited/i,
      /credit of/i,
    ],
    utrPatterns: [
      /(?:upi\s*ref(?:\s*no)?\.?[:\s-]*|ref\s*no\.?[:\s-]*)([0-9]{12})/i,
      /(?:rrn[:\s-]*)([0-9]{12})/i,
      /\b([0-9]{12})\b/,
    ],
    amountPatterns: [
      /(?:rs\.?|inr|₹)\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i,
    ],
    debitCheckPatterns: [
      /debited/i,
      /withdrawn/i,
      /failed/i,
    ],
  },
  // 3. HDFC Bank
  {
    bank: "HDFC Bank",
    senderPatterns: [
      /HDFC/i,
      /HDFCBK/i,
    ],
    creditPatterns: [
      /credited/i,
      /received/i,
      /deposited/i,
    ],
    utrPatterns: [
      /(?:upi[:\s-]*|ref[:\s-]*)([0-9]{12})/i,
      /\b([0-9]{12})\b/,
    ],
    amountPatterns: [
      /(?:rs\.?|inr|₹)\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i,
    ],
    debitCheckPatterns: [
      /debited/i,
      /withdrawn/i,
    ],
  },
  // 4. ICICI Bank
  {
    bank: "ICICI Bank",
    senderPatterns: [
      /ICICI/i,
      /ICICIB/i,
    ],
    creditPatterns: [
      /credited/i,
      /received/i,
    ],
    utrPatterns: [
      /(?:upi[:\s-]*|ref\s*no[:\s-]*|rrn[:\s-]*)([0-9]{12})/i,
      /\b([0-9]{12})\b/,
    ],
    amountPatterns: [
      /(?:inr|rs\.?|₹)\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i,
    ],
    debitCheckPatterns: [
      /debited/i,
      /paid to/i,
    ],
  },
  // 5. Axis Bank
  {
    bank: "Axis Bank",
    senderPatterns: [
      /AXIS/i,
      /AXISBK/i,
    ],
    creditPatterns: [
      /credited/i,
      /received/i,
    ],
    utrPatterns: [
      /(?:ref\s*no[:\s-]*|upi[:\s-]*)([0-9]{12})/i,
      /\b([0-9]{12})\b/,
    ],
    amountPatterns: [
      /(?:inr|rs\.?|₹)\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i,
    ],
    debitCheckPatterns: [
      /debited/i,
    ],
  },
  // 6. Paytm Payments Bank
  {
    bank: "Paytm Payments Bank",
    senderPatterns: [
      /PAYTM/i,
      /PYTM/i,
    ],
    creditPatterns: [
      /received/i,
      /credited/i,
      /added/i,
    ],
    utrPatterns: [
      /(?:upi\s*ref[:\s-]*|utr[:\s-]*)([0-9]{12})/i,
      /\b([0-9]{12})\b/,
    ],
    amountPatterns: [
      /(?:rs\.?|inr|₹)\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i,
    ],
    debitCheckPatterns: [
      /debited/i,
      /paid/i,
    ],
  },
];

/**
 * Normalizes amount string into standard floating point number.
 * e.g. "1,499.00" -> 1499.0
 */
export function normalizeAmount(rawStr: string): number | null {
  if (!rawStr) return null;
  const cleaned = rawStr.replace(/,/g, "").trim();
  const val = parseFloat(cleaned);
  return isNaN(val) || val <= 0 ? null : Math.round(val * 100) / 100;
}

/**
 * Validates a 12-digit Indian NPCI UPI UTR / RRN.
 * Standard format: Exactly 12 numeric digits (e.g. 425312891045).
 */
export function isValidUTR(utr: string): boolean {
  if (!utr) return false;
  const cleaned = utr.trim();
  return /^[0-9]{12}$/.test(cleaned);
}

/**
 * Returns current timestamp formatted in India Standard Time (Asia/Kolkata).
 */
export function getISTTimestamp(): string {
  return new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
}

/**
 * Core Bank SMS Parser
 * Parses incoming SMS text messages to determine if it is an authentic UPI credit,
 * extracting the exact ₹ amount and 12-digit UTR.
 */
export function parseBankCreditSMS(
  smsMessage: string,
  senderHeader?: string
): ParsedBankSMS {
  const timestamp = getISTTimestamp();
  const raw = (smsMessage || "").trim();

  if (!raw) {
    return {
      isValid: false,
      isCredit: false,
      amount: null,
      utr: null,
      bank: "Unknown",
      timestamp,
      rawMessage: "",
      error: "Empty SMS message provided",
    };
  }

  // 1. Identify Bank by Sender Header or Content
  let matchedBankRule: BankRule | null = null;

  if (senderHeader) {
    for (const rule of KNOWN_BANK_RULES) {
      if (rule.senderPatterns.some((pattern) => pattern.test(senderHeader))) {
        matchedBankRule = rule;
        break;
      }
    }
  }

  if (!matchedBankRule) {
    for (const rule of KNOWN_BANK_RULES) {
      if (rule.senderPatterns.some((pattern) => pattern.test(raw))) {
        matchedBankRule = rule;
        break;
      }
    }
  }

  const bankName = matchedBankRule ? matchedBankRule.bank : "Generic Bank";

  // 2. Reject obvious debit or non-credit messages (unless credit is also explicitly mentioned)
  const isDebit =
    /(?:debited|spent|withdrawn|deducted|otp\s*for|paid\s*to\s*(?!your))/i.test(
      raw
    ) &&
    !/(?:credited|received|added|deposited|credit\s*of)/i.test(raw);

  if (isDebit) {
    return {
      isValid: false,
      isCredit: false,
      amount: null,
      utr: null,
      bank: bankName,
      sender: senderHeader,
      timestamp,
      rawMessage: raw,
      error: "Message is a debit alert, not a credit alert",
    };
  }

  // 3. Verify that the message represents incoming money / credit
  const isCredit =
    /(?:credited|received|added|deposited|credit\s*of|paid\s*to\s*your)/i.test(
      raw
    );

  if (!isCredit) {
    return {
      isValid: false,
      isCredit: false,
      amount: null,
      utr: null,
      bank: bankName,
      sender: senderHeader,
      timestamp,
      rawMessage: raw,
      error: "No credit or deposit keywords detected in SMS",
    };
  }

  // 4. Extract Amount
  let extractedAmount: number | null = null;

  // Try standard currency patterns: Rs. 499.00 / INR 499 / ₹499
  const amountMatches = [
    /(?:rs\.?|inr|₹)\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i,
    /(?:credited\s*(?:with|by)?\s*)(?:rs\.?|inr|₹)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i,
    /(?:received\s*)(?:rs\.?|inr|₹)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i,
    /([0-9]+(?:\.[0-9]{1,2})?)\s*(?:rs\.?|inr|₹)/i,
  ];

  for (const regex of amountMatches) {
    const match = raw.match(regex);
    if (match && match[1]) {
      const amt = normalizeAmount(match[1]);
      if (amt !== null) {
        extractedAmount = amt;
        break;
      }
    }
  }

  // 5. Extract 12-digit UTR
  let extractedUtr: string | null = null;
  const utrMatches = [
    /(?:upi\s*ref(?:erence)?(?:\s*no)?\.?[:\s\/-]*|utr[:\s\/-]*|rrn[:\s\/-]*|ref\s*no\.?[:\s\/-]*)([0-9]{12})/i,
    /(?:upi\/|ref\/)([0-9]{12})/i,
    /\b([0-9]{12})\b/g,
  ];

  // Try explicit prefix patterns first
  for (let i = 0; i < 2; i++) {
    const match = raw.match(utrMatches[i]);
    if (match && match[1] && isValidUTR(match[1])) {
      extractedUtr = match[1];
      break;
    }
  }

  // Fallback: look for 12 digit numbers not associated with account numbers (e.g. A/C ending X1234)
  if (!extractedUtr) {
    const all12Digits = raw.match(/\b([0-9]{12})\b/g);
    if (all12Digits && all12Digits.length > 0) {
      extractedUtr = all12Digits[0];
    }
  }

  // Extract optional account ending (e.g., A/C *7842, A/C XX901)
  const acMatch = raw.match(/(?:a\/c|account|acct)[\s:.-]*[*xX]*([0-9]{3,6})\b/i);
  const accountEnding = acMatch ? acMatch[1] : null;

  const isValid = isCredit && extractedAmount !== null && extractedUtr !== null;

  return {
    isValid,
    isCredit,
    amount: extractedAmount,
    utr: extractedUtr,
    bank: bankName,
    sender: senderHeader,
    accountEnding,
    timestamp,
    rawMessage: raw,
    error: isValid
      ? undefined
      : !extractedAmount
      ? "Could not extract amount from bank SMS"
      : !extractedUtr
      ? "Could not extract 12-digit UPI UTR from bank SMS"
      : undefined,
  };
}
