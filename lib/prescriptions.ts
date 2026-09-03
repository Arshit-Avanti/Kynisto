import { getD1 } from "@/db/runtime";

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
  consultationDateString: string,
  validityDays: number,
  targetDaysLater?: number,
): { followUpDate: string; validUntilDate: string; isExpired: boolean } {
  const baseDate = new Date(consultationDateString);
  const targetOffset = targetDaysLater ?? validityDays;

  const followUpD = new Date(baseDate);
  followUpD.setDate(followUpD.getDate() + targetOffset);

  const validUntilD = new Date(baseDate);
  validUntilD.setDate(validUntilD.getDate() + Math.max(validityDays, targetOffset));

  const formatIso = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const followUpDate = formatIso(followUpD);
  const validUntilDate = formatIso(validUntilD);

  const todayStr = formatIso(new Date());
  const isExpired = todayStr > validUntilDate;

  return { followUpDate, validUntilDate, isExpired };
}

let _prescriptionTablesChecked = false;

export async function ensurePrescriptionTables(): Promise<void> {
  if (_prescriptionTablesChecked) return;
  try {
    const db = getD1();

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
