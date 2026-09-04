export interface PrescriptionMedicine {
  name: string;
  dosage?: string;
  frequency?: string; // e.g. "1-0-1", "Once daily", "SOS"
  duration?: string;  // e.g. "5 days", "1 month"
  timing?: string;    // e.g. "After food", "Before food", "With meals"
  instructions?: string;
}

export interface PrescriptionVitals {
  bp?: string;
  pulse?: string;
  temperature?: string;
  weight?: string;
  spo2?: string;
  height?: string;
}

export interface CanvasElement {
  id: string;
  type: "text" | "box" | "divider" | "badge" | "image" | "stamp";
  label?: string;
  content?: string;
  color?: string;
  fontSize?: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  visible?: boolean;
}

export interface PrescriptionTemplateLayout {
  // Clinic & Doctor Branding
  clinicName: string;
  tagline?: string;
  logoUrl?: string | null;
  showLogo: boolean;
  doctorHeader?: string;
  doctorRegistration?: string;
  address: string;
  phone: string;
  email?: string;
  website?: string;

  // Typography & Styling
  fontFamily: string;
  titleFontSize: number;
  headerFontSize: number;
  bodyFontSize: number;
  footerFontSize: number;
  lineHeight: number;

  // Spacing & Margins
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  spacing: {
    sectionGap: number;
    itemGap: number;
  };

  // Aesthetics & Colors
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  borderStyle: "none" | "subtle" | "solid" | "double" | "rounded";
  headerLayout: "center" | "left" | "two_column" | "minimal" | "banner";

  // Section Visibility & Ordering
  sections: {
    vitals: boolean;
    symptoms: boolean;
    diagnosis: boolean;
    medicines: boolean;
    tests: boolean;
    advice: boolean;
    followup: boolean;
    signature: boolean;
    disclaimer: boolean;
  };

  // Custom text & Disclaimers
  customText?: string;
  disclaimer: string;
  elements?: CanvasElement[];
}

export interface PrescriptionRecord {
  id: string;
  prescriptionNumber: string;
  storeId: string;
  doctorId?: string | null;
  doctorName: string;
  doctorSpecialization?: string | null;
  storeName: string;
  userId?: string | null;
  patientName: string;
  patientPhone?: string | null;
  patientAge?: number | null;
  patientGender?: string | null;
  patientAddress?: string | null;
  queueEntryId?: string | null;
  appointmentId?: string | null;
  vitals?: PrescriptionVitals | null;
  symptoms?: string | null;
  diagnosis?: string | null;
  medicines: PrescriptionMedicine[];
  tests?: string[];
  advice?: string | null;
  templateSnapshot: PrescriptionTemplateLayout;
  status: "issued" | "reissued" | "cancelled";
  supersededById?: string | null;
  originalPrescriptionId?: string | null;
  correctionReason?: string | null;
  doctorRegistration?: string | null;
  issuedAt: number;
  createdAt: number;
  updatedAt: number;

  // Attached follow-up info
  followUp?: FollowUpRecord | null;
}

export interface FollowUpRecord {
  id: string;
  storeId: string;
  prescriptionId: string;
  userId?: string | null;
  patientName: string;
  patientPhone?: string | null;
  doctorId?: string | null;
  doctorName: string;
  originalConsultationDate: string;
  followUpDate: string;
  validUntilDate: string;
  validityDays: number;
  followUpType: "free" | "paid" | "discounted";
  followUpFee: number;
  paymentStatus: "free" | "unpaid" | "paid";
  bookingStatus: "not_booked" | "booked" | "completed" | "expired";
  appointmentId?: string | null;
  notes?: string | null;
  createdAt: number;
  updatedAt: number;
  isExpired?: boolean;
}

export type PrescriptionFilter = "all" | "30d" | "3m" | "6m" | "1y";

export function getDefaultTemplateLayout(store?: {
  name?: string;
  address?: string;
  phone?: string;
  logoUrl?: string | null;
  email?: string;
  website?: string;
}): PrescriptionTemplateLayout {
  return {
    clinicName: store?.name || "Kynisto Medical Care Centre",
    tagline: "Department of Family Medicine & General Healthcare",
    logoUrl: store?.logoUrl || null,
    showLogo: true,
    doctorHeader: "Consultant Physician & Surgeon",
    doctorRegistration: "REG-MED-IN-49201",
    address: store?.address || "Health Avenue, Care District",
    phone: store?.phone || "+91 98765 43210",
    email: store?.email || "care@kynisto.in",
    website: store?.website || "https://kynisto.in",

    fontFamily: "Inter, sans-serif",
    titleFontSize: 24,
    headerFontSize: 15,
    bodyFontSize: 13,
    footerFontSize: 11,
    lineHeight: 1.5,

    margins: {
      top: 24,
      bottom: 24,
      left: 28,
      right: 28,
    },
    spacing: {
      sectionGap: 18,
      itemGap: 10,
    },

    primaryColor: "#0f766e",   // Medical Teal-700
    secondaryColor: "#0284c7", // Sky-600
    backgroundColor: "#ffffff",
    textColor: "#0f172a",      // Slate-900
    borderColor: "#e2e8f0",    // Slate-200
    borderStyle: "subtle",
    headerLayout: "two_column",

    sections: {
      vitals: true,
      symptoms: true,
      diagnosis: true,
      medicines: true,
      tests: true,
      advice: true,
      followup: true,
      signature: true,
      disclaimer: true,
    },

    customText: "Emergency OPD available 24x7. For immediate attention, visit the triage counter.",
    disclaimer: "This prescription is a valid digital medical document issued under Kynisto Healthcare protocols. Not valid for medico-legal purposes. Substitute with generic equivalents if prescribed brand is unavailable.",
    elements: [
      { id: "el-rx", type: "badge", content: "℞", color: "#0f766e", fontSize: 24, visible: true, x: 24, y: 140, width: 36, height: 36 },
      { id: "el-verified", type: "stamp", label: "VERIFIED RX", content: "VERIFIED", color: "#059669", fontSize: 11, visible: true, x: 620, y: 140, width: 120, height: 36 },
    ],
  };
}

export function mergeTemplateLayout(
  partial?: Partial<PrescriptionTemplateLayout> | null,
  store?: {
    name?: string;
    address?: string;
    phone?: string;
    logoUrl?: string | null;
    email?: string;
    website?: string;
  },
): PrescriptionTemplateLayout {
  const defaults = getDefaultTemplateLayout(store);
  if (!partial || typeof partial !== "object") return defaults;

  return {
    ...defaults,
    ...partial,
    clinicName: partial.clinicName || defaults.clinicName,
    tagline: partial.tagline !== undefined ? partial.tagline : defaults.tagline,
    logoUrl: partial.logoUrl !== undefined ? partial.logoUrl : defaults.logoUrl,
    showLogo: partial.showLogo !== undefined ? Boolean(partial.showLogo) : defaults.showLogo,
    doctorHeader: partial.doctorHeader !== undefined ? partial.doctorHeader : defaults.doctorHeader,
    doctorRegistration: partial.doctorRegistration !== undefined ? partial.doctorRegistration : defaults.doctorRegistration,
    address: partial.address || defaults.address,
    phone: partial.phone || defaults.phone,
    email: partial.email !== undefined ? partial.email : defaults.email,
    website: partial.website !== undefined ? partial.website : defaults.website,
    fontFamily: partial.fontFamily || defaults.fontFamily,
    titleFontSize: typeof partial.titleFontSize === "number" ? partial.titleFontSize : defaults.titleFontSize,
    headerFontSize: typeof partial.headerFontSize === "number" ? partial.headerFontSize : defaults.headerFontSize,
    bodyFontSize: typeof partial.bodyFontSize === "number" ? partial.bodyFontSize : defaults.bodyFontSize,
    footerFontSize: typeof partial.footerFontSize === "number" ? partial.footerFontSize : defaults.footerFontSize,
    lineHeight: typeof partial.lineHeight === "number" ? partial.lineHeight : defaults.lineHeight,
    primaryColor: partial.primaryColor || defaults.primaryColor,
    secondaryColor: partial.secondaryColor || defaults.secondaryColor,
    backgroundColor: partial.backgroundColor || defaults.backgroundColor,
    textColor: partial.textColor || defaults.textColor,
    borderColor: partial.borderColor || defaults.borderColor,
    borderStyle: partial.borderStyle || defaults.borderStyle,
    headerLayout: partial.headerLayout || defaults.headerLayout,
    margins: {
      top: typeof partial.margins?.top === "number" ? partial.margins.top : defaults.margins.top,
      bottom: typeof partial.margins?.bottom === "number" ? partial.margins.bottom : defaults.margins.bottom,
      left: typeof partial.margins?.left === "number" ? partial.margins.left : defaults.margins.left,
      right: typeof partial.margins?.right === "number" ? partial.margins.right : defaults.margins.right,
    },
    spacing: {
      sectionGap: typeof partial.spacing?.sectionGap === "number" ? partial.spacing.sectionGap : defaults.spacing.sectionGap,
      itemGap: typeof partial.spacing?.itemGap === "number" ? partial.spacing.itemGap : defaults.spacing.itemGap,
    },
    sections: {
      vitals: partial.sections?.vitals !== undefined ? Boolean(partial.sections.vitals) : defaults.sections.vitals,
      symptoms: partial.sections?.symptoms !== undefined ? Boolean(partial.sections.symptoms) : defaults.sections.symptoms,
      diagnosis: partial.sections?.diagnosis !== undefined ? Boolean(partial.sections.diagnosis) : defaults.sections.diagnosis,
      medicines: partial.sections?.medicines !== undefined ? Boolean(partial.sections.medicines) : defaults.sections.medicines,
      tests: partial.sections?.tests !== undefined ? Boolean(partial.sections.tests) : defaults.sections.tests,
      advice: partial.sections?.advice !== undefined ? Boolean(partial.sections.advice) : defaults.sections.advice,
      followup: partial.sections?.followup !== undefined ? Boolean(partial.sections.followup) : defaults.sections.followup,
      signature: partial.sections?.signature !== undefined ? Boolean(partial.sections.signature) : defaults.sections.signature,
      disclaimer: partial.sections?.disclaimer !== undefined ? Boolean(partial.sections.disclaimer) : defaults.sections.disclaimer,
    },
    customText: partial.customText !== undefined ? partial.customText : defaults.customText,
    disclaimer: partial.disclaimer || defaults.disclaimer,
    elements: Array.isArray(partial.elements) ? partial.elements : defaults.elements,
  };
}

export class PrescriptionValidationError extends Error {
  code: string;
  status: number;
  constructor(message: string, code = "INVALID_PRESCRIPTION") {
    super(message);
    this.name = "PrescriptionValidationError";
    this.code = code;
    this.status = 400;
  }
}

export function validatePrescriptionMedicines(rawMeds: unknown): PrescriptionMedicine[] {
  if (!Array.isArray(rawMeds) || rawMeds.length === 0) {
    throw new PrescriptionValidationError("At least one medicine is required to issue a prescription.", "MEDICINE_REQUIRED");
  }

  const validMedicines: PrescriptionMedicine[] = [];
  const seenNames = new Set<string>();

  for (let idx = 0; idx < rawMeds.length; idx++) {
    const m = rawMeds[idx];
    if (!m || typeof m !== "object") {
      throw new PrescriptionValidationError(`Invalid medication entry at row #${idx + 1}.`, "INVALID_MEDICINE");
    }

    const isInvalidNameType = m.name !== undefined && m.name !== null && typeof m.name !== "string";
    const rawName = typeof m.name === "string" ? m.name.trim() : "";
    const rawDosage = typeof m.dosage === "string" ? m.dosage.trim() : "";
    const rawFrequency = typeof m.frequency === "string" ? m.frequency.trim() : "";
    const rawDuration = typeof m.duration === "string" ? m.duration.trim() : "";
    const rawTiming = typeof m.timing === "string" ? m.timing.trim() : "";
    const rawInstructions = typeof m.instructions === "string" ? m.instructions.trim() : "";

    // Check if entire row is completely blank (e.g. empty extra row in form)
    const isRowEmpty = !isInvalidNameType && !rawName && !rawDosage && !rawFrequency && !rawDuration && !rawTiming && !rawInstructions;
    if (isRowEmpty) {
      continue;
    }

    if (!rawName) {
      throw new PrescriptionValidationError(`Medicine #${idx + 1} is missing the medication name.`, "MEDICINE_NAME_REQUIRED");
    }

    if (rawName.length > 120) {
      throw new PrescriptionValidationError(`Medicine #${idx + 1} name exceeds maximum 120 characters.`, "MEDICINE_NAME_TOO_LONG");
    }

    if (rawDosage.length > 60) {
      throw new PrescriptionValidationError(`Medicine #${idx + 1} dosage exceeds maximum 60 characters.`, "MEDICINE_DOSAGE_TOO_LONG");
    }

    if (rawFrequency) {
      if (rawFrequency.length > 60) {
        throw new PrescriptionValidationError(`Medicine #${idx + 1} frequency exceeds maximum 60 characters.`, "MEDICINE_FREQUENCY_TOO_LONG");
      }
      if (!/[a-zA-Z0-9]/.test(rawFrequency)) {
        throw new PrescriptionValidationError(`Medicine #${idx + 1} has an invalid frequency format.`, "INVALID_MEDICINE_FREQUENCY");
      }
    }

    if (rawDuration) {
      if (rawDuration.length > 60) {
        throw new PrescriptionValidationError(`Medicine #${idx + 1} duration exceeds maximum 60 characters.`, "MEDICINE_DURATION_TOO_LONG");
      }
      if (/^-\s*\d+/.test(rawDuration)) {
        throw new PrescriptionValidationError(`Medicine #${idx + 1} duration cannot be negative.`, "INVALID_MEDICINE_DURATION");
      }
      if (/^0\s*(days?|weeks?|months?|d|w|m)?$/i.test(rawDuration)) {
        throw new PrescriptionValidationError(`Medicine #${idx + 1} duration must be at least 1 day.`, "INVALID_MEDICINE_DURATION");
      }
      if (!/[a-zA-Z0-9]/.test(rawDuration)) {
        throw new PrescriptionValidationError(`Medicine #${idx + 1} has an invalid duration format.`, "INVALID_MEDICINE_DURATION");
      }
    }

    if (rawTiming) {
      if (rawTiming.length > 60) {
        throw new PrescriptionValidationError(`Medicine #${idx + 1} timing exceeds maximum 60 characters.`, "MEDICINE_TIMING_TOO_LONG");
      }
      if (!/[a-zA-Z0-9]/.test(rawTiming)) {
        throw new PrescriptionValidationError(`Medicine #${idx + 1} has an invalid timing format.`, "INVALID_MEDICINE_TIMING");
      }
    }

    if (rawInstructions.length > 250) {
      throw new PrescriptionValidationError(`Medicine #${idx + 1} instructions exceeds maximum 250 characters.`, "MEDICINE_INSTRUCTIONS_TOO_LONG");
    }

    // Duplicate check: normalized lower-cased medicine name (collapsing spaces and trailing punctuation)
    const normalizedName = rawName.toLowerCase().replace(/[.,;:!?]+$/, "").replace(/\s+/g, " ");
    if (seenNames.has(normalizedName)) {
      throw new PrescriptionValidationError(
        `Duplicate medicine "${rawName}" found in prescription. Each medication should be listed once with combined dosage.`,
        "DUPLICATE_MEDICINE"
      );
    }
    seenNames.add(normalizedName);

    validMedicines.push({
      name: rawName,
      dosage: rawDosage || undefined,
      frequency: rawFrequency || undefined,
      duration: rawDuration || undefined,
      timing: rawTiming || undefined,
      instructions: rawInstructions || undefined,
    });
  }

  if (validMedicines.length === 0) {
    throw new PrescriptionValidationError("At least one valid medicine is required to issue a prescription.", "MEDICINE_REQUIRED");
  }

  return validMedicines;
}

export function generatePrescriptionNumber(): string {
  const d = new Date();
  const yearMonth = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `RX-${yearMonth}-${rand}`;
}

export function filterToTimestamp(filter: PrescriptionFilter = "1y"): number {
  const now = Math.floor(Date.now() / 1000);
  switch (filter) {
    case "30d":
      return now - 30 * 24 * 3600;
    case "3m":
      return now - 90 * 24 * 3600;
    case "6m":
      return now - 180 * 24 * 3600;
    case "1y":
      return now - 365 * 24 * 3600;
    case "all":
    default:
      return 0;
  }
}

export function calculateFollowUpDates(
  consultationDateString?: string | null,
  validityDays: number | string = 7,
  targetDaysLater?: number | string,
): { followUpDate: string; validUntilDate: string; isExpired: boolean } {
  const parsedValidity = Number(validityDays);
  const validDays =
    Number.isFinite(parsedValidity) && parsedValidity > 0 ? Math.floor(parsedValidity) : 7;
  const parsedTarget =
    targetDaysLater !== undefined && targetDaysLater !== null ? Number(targetDaysLater) : NaN;
  const targetOffset =
    Number.isFinite(parsedTarget) && parsedTarget >= 0
      ? Math.floor(parsedTarget)
      : validDays;

  let y: number;
  let m: number;
  let d: number;

  if (consultationDateString && typeof consultationDateString === "string") {
    const datePart = consultationDateString.split("T")[0].trim();
    const parts = datePart.split("-").map((p) => parseInt(p, 10));
    if (
      parts.length === 3 &&
      !parts.some(isNaN) &&
      parts[0] >= 1900 &&
      parts[0] <= 2200 &&
      parts[1] >= 1 &&
      parts[1] <= 12 &&
      parts[2] >= 1 &&
      parts[2] <= 31
    ) {
      [y, m, d] = parts;
    } else {
      const parsed = new Date(consultationDateString);
      if (!isNaN(parsed.getTime())) {
        y = parsed.getUTCFullYear();
        m = parsed.getUTCMonth() + 1;
        d = parsed.getUTCDate();
      } else {
        const now = new Date();
        y = now.getUTCFullYear();
        m = now.getUTCMonth() + 1;
        d = now.getUTCDate();
      }
    }
  } else {
    const now = new Date();
    y = now.getUTCFullYear();
    m = now.getUTCMonth() + 1;
    d = now.getUTCDate();
  }

  const formatIsoUtc = (date: Date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Follow-up appointment target date (leap-year and month-boundary safe using UTC Date)
  const followUpD = new Date(Date.UTC(y, m - 1, d));
  followUpD.setUTCDate(followUpD.getUTCDate() + targetOffset);

  // Validity expiration cutoff date (at least as far out as targetOffset)
  const validUntilD = new Date(Date.UTC(y, m - 1, d));
  validUntilD.setUTCDate(validUntilD.getUTCDate() + Math.max(validDays, targetOffset));

  const followUpDate = formatIsoUtc(followUpD);
  const validUntilDate = formatIsoUtc(validUntilD);

  const todayStr = formatIsoUtc(new Date());
  const isExpired = todayStr > validUntilDate;

  return { followUpDate, validUntilDate, isExpired };
}

let _prescriptionTablesChecked = false;

export async function ensurePrescriptionTables(database?: any): Promise<void> {
  if (_prescriptionTablesChecked) return;
  try {
    let db = database;
    if (!db) {
      const runtime = await import("@/db/runtime");
      db = runtime.getD1();
    }

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS healthcare_prescription_templates (
        id text PRIMARY KEY NOT NULL,
        store_id text NOT NULL,
        name text NOT NULL,
        is_default integer DEFAULT 1 NOT NULL,
        layout_json text NOT NULL,
        created_at integer DEFAULT (unixepoch()) NOT NULL,
        updated_at integer DEFAULT (unixepoch()) NOT NULL
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS healthcare_prescriptions (
        id text PRIMARY KEY NOT NULL,
        prescription_number text NOT NULL,
        store_id text NOT NULL,
        doctor_id text,
        doctor_name text NOT NULL,
        doctor_specialization text,
        store_name text NOT NULL,
        user_id text,
        patient_name text NOT NULL,
        patient_phone text,
        patient_age integer,
        patient_gender text,
        patient_address text,
        queue_entry_id text,
        appointment_id text,
        vitals_json text,
        symptoms text,
        diagnosis text,
        medicines_json text NOT NULL,
        tests_json text,
        advice text,
        template_snapshot_json text NOT NULL,
        status text DEFAULT 'issued' NOT NULL,
        superseded_by_id text,
        original_prescription_id text,
        correction_reason text,
        issued_at integer NOT NULL,
        created_at integer DEFAULT (unixepoch()) NOT NULL,
        updated_at integer DEFAULT (unixepoch()) NOT NULL
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS healthcare_follow_ups (
        id text PRIMARY KEY NOT NULL,
        store_id text NOT NULL,
        prescription_id text NOT NULL,
        user_id text,
        patient_name text NOT NULL,
        patient_phone text,
        doctor_id text,
        doctor_name text NOT NULL,
        original_consultation_date text NOT NULL,
        follow_up_date text NOT NULL,
        valid_until_date text NOT NULL,
        validity_days integer NOT NULL,
        follow_up_type text DEFAULT 'free' NOT NULL,
        follow_up_fee real DEFAULT 0 NOT NULL,
        payment_status text DEFAULT 'free' NOT NULL,
        booking_status text DEFAULT 'not_booked' NOT NULL,
        appointment_id text,
        notes text,
        created_at integer DEFAULT (unixepoch()) NOT NULL,
        updated_at integer DEFAULT (unixepoch()) NOT NULL
      )
    `).run();

    // Safe index creations
    const indexQueries = [
      "CREATE INDEX IF NOT EXISTS healthcare_template_store_idx ON healthcare_prescription_templates (store_id, is_default)",
      "CREATE UNIQUE INDEX IF NOT EXISTS healthcare_prescription_number_idx ON healthcare_prescriptions (prescription_number)",
      "CREATE INDEX IF NOT EXISTS healthcare_rx_store_date_idx ON healthcare_prescriptions (store_id, issued_at, status)",
      "CREATE INDEX IF NOT EXISTS healthcare_rx_user_date_idx ON healthcare_prescriptions (user_id, issued_at)",
      "CREATE INDEX IF NOT EXISTS healthcare_rx_phone_idx ON healthcare_prescriptions (patient_phone, issued_at)",
      "CREATE INDEX IF NOT EXISTS healthcare_followup_store_date_idx ON healthcare_follow_ups (store_id, follow_up_date, booking_status)",
      "CREATE INDEX IF NOT EXISTS healthcare_followup_user_idx ON healthcare_follow_ups (user_id, follow_up_date)",
      "CREATE INDEX IF NOT EXISTS healthcare_followup_rx_idx ON healthcare_follow_ups (prescription_id)",
    ];

    for (const q of indexQueries) {
      try {
        await db.prepare(q).run();
      } catch {
        // ignore index exists
      }
    }

    const settingsAlters = [
      "ALTER TABLE healthcare_queue_settings ADD COLUMN default_followup_type text DEFAULT 'free'",
      "ALTER TABLE healthcare_queue_settings ADD COLUMN default_followup_validity_days integer DEFAULT 7",
      "ALTER TABLE healthcare_queue_settings ADD COLUMN default_followup_fee real DEFAULT 0",
      "ALTER TABLE healthcare_prescriptions ADD COLUMN doctor_registration text",
      "ALTER TABLE healthcare_prescriptions ADD COLUMN patient_phone text",
    ];

    for (const sql of settingsAlters) {
      try {
        await db.prepare(sql).run();
      } catch {
        // column already exists
      }
    }

    _prescriptionTablesChecked = true;
  } catch (err) {
    console.warn("Prescription tables init notice:", err);
  }
}
