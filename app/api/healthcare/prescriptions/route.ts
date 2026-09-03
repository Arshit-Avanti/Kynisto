import { getD1 } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { ensureHealthcareTables } from "@/lib/healthcare";
import { requireOwnedStore, writeAudit } from "@/lib/ownership";
import { apiError, HttpError, noStoreJson } from "@/lib/security";
import { cleanText, numberInput, safeJson } from "@/lib/validation";
import {
  ensurePrescriptionTables,
  filterToTimestamp,
  generatePrescriptionNumber,
  getDefaultTemplateLayout,
  calculateFollowUpDates,
  type PrescriptionFilter,
  type PrescriptionMedicine,
  type PrescriptionVitals,
  type PrescriptionTemplateLayout,
} from "@/lib/prescriptions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await ensureHealthcareTables();
    await ensurePrescriptionTables();
    const db = getD1();
    const url = new URL(request.url);
    const filter = (url.searchParams.get("filter") || "1y") as PrescriptionFilter;
    const storeId = url.searchParams.get("storeId");
    const id = url.searchParams.get("id");
    const search = url.searchParams.get("search")?.trim().toLowerCase() || "";
    const patientPhone = url.searchParams.get("patientPhone")?.trim() || "";
    const minTimestamp = filterToTimestamp(filter);

    // 1. Single Prescription by ID
    if (id) {
      const rx = await db
        .prepare("SELECT * FROM healthcare_prescriptions WHERE id = ? OR prescription_number = ? LIMIT 1")
        .bind(id, id)
        .first<any>();

      if (!rx) {
        throw new HttpError(404, "Prescription not found.", "PRESCRIPTION_NOT_FOUND");
      }

      // Authorization check
      const session = await requireApiPermission(request, "profile.manage_own").catch(() => null);
      if (!session) {
        throw new HttpError(401, "Authentication required to view prescriptions.", "UNAUTHENTICATED");
      }

      const isOwnerOrAdmin =
        session.user.role === "admin" ||
        (await db.prepare("SELECT id FROM stores WHERE id = ? AND owner_id = ?").bind(rx.store_id, session.user.id).first());

      const userRecord = await db.prepare("SELECT phone, email FROM users WHERE id = ?").bind(session.user.id).first<any>();
      const userPhone = userRecord?.phone || "";
      const userEmail = userRecord?.email || session.user.email || "";

      const cleanDigits = (p: string | null | undefined) => (p ? p.replace(/\D/g, "") : "");

      const isCustomer =
        (rx.user_id && rx.user_id === session.user.id) ||
        (userPhone && rx.patient_phone && cleanDigits(rx.patient_phone) === cleanDigits(userPhone)) ||
        (userEmail && rx.patient_email && rx.patient_email.toLowerCase() === userEmail.toLowerCase());

      if (!isOwnerOrAdmin && !isCustomer) {
        throw new HttpError(403, "You are not authorized to view this prescription.", "ACCESS_DENIED");
      }

      // Fetch follow-up
      const followUp = await db
        .prepare("SELECT * FROM healthcare_follow_ups WHERE prescription_id = ? LIMIT 1")
        .bind(rx.id)
        .first<any>();

      return noStoreJson({
        prescription: formatPrescriptionRow(rx, followUp),
      });
    }

    // 2. Clinic Owner Flow (storeId provided)
    if (storeId) {
      const session = await requireApiPermission(request, "queue.manage_own");
      if (session.user.role !== "admin") {
        await requireOwnedStore(session.user.id, storeId);
      }

      let query = `
        SELECT p.*, f.id AS fu_id, f.follow_up_date AS fu_date, f.valid_until_date AS fu_valid_until,
               f.validity_days AS fu_validity_days, f.follow_up_type AS fu_type, f.follow_up_fee AS fu_fee,
               f.payment_status AS fu_pay_status, f.booking_status AS fu_book_status
        FROM healthcare_prescriptions p
        LEFT JOIN healthcare_follow_ups f ON f.prescription_id = p.id
        WHERE p.store_id = ? AND p.issued_at >= ?
      `;
      const params: any[] = [storeId, minTimestamp];

      if (patientPhone) {
        query += " AND p.patient_phone = ?";
        params.push(patientPhone);
      }

      if (search) {
        query += " AND (LOWER(p.patient_name) LIKE ? OR LOWER(p.prescription_number) LIKE ? OR LOWER(p.doctor_name) LIKE ? OR p.patient_phone LIKE ?)";
        const like = `%${search}%`;
        params.push(like, like, like, like);
      }

      query += " ORDER BY p.issued_at DESC LIMIT 200";

      const rows = await db.prepare(query).bind(...params).all<any>();
      const prescriptions = (rows.results || []).map((row) => formatPrescriptionWithJoinedFollowUp(row));

      return noStoreJson({ prescriptions });
    }

    // 3. Customer Flow (My Prescriptions)
    const session = await requireApiPermission(request, "profile.manage_own");
    const userId = session.user.id;
    const userRow = await db.prepare("SELECT phone FROM users WHERE id = ?").bind(userId).first<any>();
    const userPhone = userRow?.phone || "";

    let query = `
      SELECT p.*, f.id AS fu_id, f.follow_up_date AS fu_date, f.valid_until_date AS fu_valid_until,
             f.validity_days AS fu_validity_days, f.follow_up_type AS fu_type, f.follow_up_fee AS fu_fee,
             f.payment_status AS fu_pay_status, f.booking_status AS fu_book_status
      FROM healthcare_prescriptions p
      LEFT JOIN healthcare_follow_ups f ON f.prescription_id = p.id
      WHERE (p.user_id = ? OR (p.patient_phone IS NOT NULL AND p.patient_phone != '' AND p.patient_phone = ?)) AND p.issued_at >= ?
      ORDER BY p.issued_at DESC LIMIT 100
    `;
    const rows = await db.prepare(query).bind(userId, userPhone, minTimestamp).all<any>();
    const prescriptions = (rows.results || []).map((row) => formatPrescriptionWithJoinedFollowUp(row));

    return noStoreJson({ prescriptions });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await ensureHealthcareTables();
    await ensurePrescriptionTables();
    const session = await requireApiPermission(request, "queue.manage_own", { csrf: true });
    const body = await safeJson(request);
    const storeId = cleanText(body.storeId, "Clinic", { max: 80 });

    if (session.user.role !== "admin") {
      await requireOwnedStore(session.user.id, storeId);
    }

    const db = getD1();
    const store = await db.prepare("SELECT id, name, address, phone, logo_url FROM stores WHERE id = ?").bind(storeId).first<any>();
    if (!store) throw new HttpError(404, "Clinic not found.", "STORE_NOT_FOUND");

    // Doctor info
    const doctorId = cleanText(body.doctorId, "Doctor ID", { max: 80, required: false }) || null;
    const doctorName = cleanText(body.doctorName, "Doctor Name", { min: 2, max: 120 });
    const doctorSpecialization = cleanText(body.doctorSpecialization, "Specialization", { max: 120, required: false }) || null;

    // Patient info
    const patientName = cleanText(body.patientName, "Patient Name", { min: 2, max: 120 });
    const rawUserId = cleanText(body.userId, "User ID", { max: 80, required: false }) || null;
    let patientPhone = cleanText(body.patientPhone, "Patient Phone", { max: 40, required: false }) || null;
    const patientAge = body.patientAge ? numberInput(body.patientAge, "Patient Age", { min: 0, max: 130, integer: true }) : null;
    const patientGender = cleanText(body.patientGender, "Patient Gender", { max: 20, required: false }) || null;
    const patientAddress = cleanText(body.patientAddress, "Patient Address", { max: 250, required: false }) || null;
    let userId = rawUserId;

    // Queue / Appointment links
    const queueEntryId = cleanText(body.queueEntryId, "Queue Entry", { max: 80, required: false }) || null;
    const appointmentId = cleanText(body.appointmentId, "Appointment", { max: 80, required: false }) || null;

    if (queueEntryId && (!userId || !patientPhone)) {
      const qEntry = await db.prepare("SELECT user_id, patient_phone FROM healthcare_queue_entries WHERE id = ?").bind(queueEntryId).first<any>();
      if (!userId && qEntry?.user_id) userId = qEntry.user_id;
      if (!patientPhone && qEntry?.patient_phone) patientPhone = qEntry.patient_phone;
    }

    if (!userId && patientPhone) {
      const matchedUser = await db.prepare("SELECT id FROM users WHERE phone = ? LIMIT 1").bind(patientPhone).first<{ id: string }>();
      if (matchedUser?.id) userId = matchedUser.id;
    }

    // Medical info
    const vitals: PrescriptionVitals = {
      bp: cleanText(body.vitals?.bp, "BP", { max: 20, required: false }) || undefined,
      pulse: cleanText(body.vitals?.pulse, "Pulse", { max: 20, required: false }) || undefined,
      temperature: cleanText(body.vitals?.temperature, "Temperature", { max: 20, required: false }) || undefined,
      weight: cleanText(body.vitals?.weight, "Weight", { max: 20, required: false }) || undefined,
      spo2: cleanText(body.vitals?.spo2, "SpO2", { max: 20, required: false }) || undefined,
      height: cleanText(body.vitals?.height, "Height", { max: 20, required: false }) || undefined,
    };

    const symptoms = cleanText(body.symptoms, "Symptoms", { max: 2000, required: false }) || null;
    const diagnosis = cleanText(body.diagnosis, "Diagnosis", { max: 2000, required: false }) || null;
    const advice = cleanText(body.advice, "Advice", { max: 2000, required: false }) || null;

    // Medicines array validation
    const rawMeds = Array.isArray(body.medicines) ? body.medicines : [];
    if (rawMeds.length === 0) {
      throw new HttpError(400, "At least one medicine is required to issue a prescription.", "MEDICINE_REQUIRED");
    }

    const medicines: PrescriptionMedicine[] = rawMeds.map((m: any, idx: number) => ({
      name: cleanText(m.name, `Medicine #${idx + 1} name`, { min: 1, max: 120 }),
      dosage: cleanText(m.dosage, "Dosage", { max: 60, required: false }) || undefined,
      frequency: cleanText(m.frequency, "Frequency", { max: 60, required: false }) || undefined,
      duration: cleanText(m.duration, "Duration", { max: 60, required: false }) || undefined,
      timing: cleanText(m.timing, "Timing", { max: 60, required: false }) || undefined,
      instructions: cleanText(m.instructions, "Instructions", { max: 250, required: false }) || undefined,
    }));

    // Tests array
    const rawTests = Array.isArray(body.tests) ? body.tests : [];
    const tests = rawTests.map((t: any) => typeof t === "string" ? t.trim() : "").filter(Boolean);

    // Template snapshot: fetch clinic's default template or generate one
    const templateRow = await db
      .prepare("SELECT layout_json FROM healthcare_prescription_templates WHERE store_id = ? AND is_default = 1 LIMIT 1")
      .bind(storeId)
      .first<{ layout_json: string }>();

    let templateSnapshot: PrescriptionTemplateLayout;
    if (templateRow?.layout_json) {
      try {
        templateSnapshot = JSON.parse(templateRow.layout_json);
      } catch {
        templateSnapshot = getDefaultTemplateLayout({
          name: store.name,
          address: store.address,
          phone: store.phone,
          logoUrl: store.logo_url,
        });
      }
    } else {
      templateSnapshot = getDefaultTemplateLayout({
        name: store.name,
        address: store.address,
        phone: store.phone,
        logoUrl: store.logo_url,
      });
    }

    const rxId = `rx-${crypto.randomUUID()}`;
    const prescriptionNumber = generatePrescriptionNumber();
    const now = Math.floor(Date.now() / 1000);

    const statements: D1PreparedStatement[] = [
      db.prepare(`
        INSERT INTO healthcare_prescriptions (
          id, prescription_number, store_id, doctor_id, doctor_name, doctor_specialization,
          store_name, user_id, patient_name, patient_phone, patient_age, patient_gender, patient_address,
          queue_entry_id, appointment_id, vitals_json, symptoms, diagnosis,
          medicines_json, tests_json, advice, template_snapshot_json, status,
          issued_at, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, 'issued',
          ?, ?, ?
        )
      `).bind(
        rxId, prescriptionNumber, storeId, doctorId, doctorName, doctorSpecialization,
        store.name, userId, patientName, patientPhone, patientAge, patientGender, patientAddress,
        queueEntryId, appointmentId, JSON.stringify(vitals), symptoms, diagnosis,
        JSON.stringify(medicines), JSON.stringify(tests), advice, JSON.stringify(templateSnapshot),
        now, now, now
      ),
    ];

    // If linked to active queue entry, mark consultation completed
    if (queueEntryId) {
      statements.push(
        db.prepare("UPDATE healthcare_queue_entries SET status = 'completed', completed_at = ?, left_at = ?, updated_at = ? WHERE id = ?")
          .bind(now, now, now, queueEntryId)
      );
    }

    // Follow-up setup
    let createdFollowUp: any = null;
    const followUpConfig = body.followUp;
    if (followUpConfig && (followUpConfig.enabled === true || followUpConfig.enabled === "true" || followUpConfig.validityDays)) {
      const validityDays = numberInput(followUpConfig.validityDays ?? 7, "Validity days", { min: 1, max: 180, integer: true }) as number;
      const followUpType = (["free", "paid", "discounted"].includes(followUpConfig.followUpType) ? followUpConfig.followUpType : "free") as "free" | "paid" | "discounted";
      const followUpFee = followUpType === "free" ? 0 : Number(followUpConfig.followUpFee || 0);
      const targetDays = followUpConfig.targetDays ? Number(followUpConfig.targetDays) : validityDays;

      const todayStr = new Date().toISOString().split("T")[0];
      const { followUpDate, validUntilDate } = calculateFollowUpDates(todayStr, validityDays, targetDays);
      const followUpId = `fu-${crypto.randomUUID()}`;

      statements.push(
        db.prepare(`
          INSERT INTO healthcare_follow_ups (
            id, store_id, prescription_id, user_id, patient_name, patient_phone,
            doctor_id, doctor_name, original_consultation_date, follow_up_date,
            valid_until_date, validity_days, follow_up_type, follow_up_fee,
            payment_status, booking_status, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'not_booked', ?, ?, ?)
        `).bind(
          followUpId, storeId, rxId, userId, patientName, patientPhone,
          doctorId, doctorName, todayStr, followUpDate,
          validUntilDate, validityDays, followUpType, followUpFee,
          followUpType === "free" ? "free" : "unpaid",
          followUpConfig.notes || null, now, now
        )
      );

      createdFollowUp = {
        id: followUpId,
        storeId,
        prescriptionId: rxId,
        patientName,
        doctorName,
        followUpDate,
        validUntilDate,
        validityDays,
        followUpType,
        followUpFee,
        bookingStatus: "not_booked",
      };
    }

    await db.batch(statements);
    await writeAudit(request, session.user.id, "healthcare.prescription.issued", "store", storeId, {
      rxId,
      prescriptionNumber,
      patientName,
      doctorName,
    });

    return noStoreJson({
      ok: true,
      prescriptionId: rxId,
      prescriptionNumber,
      followUp: createdFollowUp,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureHealthcareTables();
    await ensurePrescriptionTables();
    const session = await requireApiPermission(request, "queue.manage_own", { csrf: true });
    const body = await safeJson(request);
    const action = cleanText(body.action, "Action", { max: 30 });
    const storeId = cleanText(body.storeId, "Clinic", { max: 80 });

    if (session.user.role !== "admin") {
      await requireOwnedStore(session.user.id, storeId);
    }

    const db = getD1();

    // Reissue / Correction Flow
    if (action === "reissue") {
      const originalRxId = cleanText(body.prescriptionId, "Original Prescription", { max: 80 });
      const correctionReason = cleanText(body.correctionReason, "Correction Reason", { min: 3, max: 500 });

      const originalRx = await db
        .prepare("SELECT * FROM healthcare_prescriptions WHERE id = ? AND store_id = ? LIMIT 1")
        .bind(originalRxId, storeId)
        .first<any>();

      if (!originalRx) throw new HttpError(404, "Original prescription not found.", "NOT_FOUND");
      if (originalRx.status === "reissued") {
        throw new HttpError(400, "This prescription has already been reissued.", "ALREADY_REISSUED");
      }

      const store = await db.prepare("SELECT id, name, address, phone, logo_url FROM stores WHERE id = ?").bind(storeId).first<any>();
      const newRxId = `rx-${crypto.randomUUID()}`;
      const newPrescriptionNumber = generatePrescriptionNumber();
      const now = Math.floor(Date.now() / 1000);

      const doctorName = cleanText(body.doctorName ?? originalRx.doctor_name, "Doctor Name", { min: 2, max: 120 });
      const doctorSpecialization = cleanText(body.doctorSpecialization ?? originalRx.doctor_specialization, "Specialization", { max: 120, required: false }) || null;
      const patientName = cleanText(body.patientName ?? originalRx.patient_name, "Patient Name", { min: 2, max: 120 });
      const patientPhone = cleanText(body.patientPhone ?? originalRx.patient_phone, "Patient Phone", { max: 40, required: false }) || null;
      const patientAge = body.patientAge ? numberInput(body.patientAge, "Age", { min: 0, max: 130, integer: true }) : originalRx.patient_age;
      const patientGender = cleanText(body.patientGender ?? originalRx.patient_gender, "Gender", { max: 20, required: false }) || null;

      const vitals = body.vitals ? body.vitals : JSON.parse(originalRx.vitals_json || "{}");
      const symptoms = cleanText(body.symptoms ?? originalRx.symptoms, "Symptoms", { max: 2000, required: false }) || null;
      const diagnosis = cleanText(body.diagnosis ?? originalRx.diagnosis, "Diagnosis", { max: 2000, required: false }) || null;
      const advice = cleanText(body.advice ?? originalRx.advice, "Advice", { max: 2000, required: false }) || null;

      const rawMeds = Array.isArray(body.medicines) ? body.medicines : JSON.parse(originalRx.medicines_json || "[]");
      const medicines: PrescriptionMedicine[] = rawMeds.map((m: any, idx: number) => ({
        name: cleanText(m.name, `Medicine #${idx + 1} name`, { min: 1, max: 120 }),
        dosage: m.dosage || undefined,
        frequency: m.frequency || undefined,
        duration: m.duration || undefined,
        timing: m.timing || undefined,
        instructions: m.instructions || undefined,
      }));

      const rawTests = Array.isArray(body.tests) ? body.tests : JSON.parse(originalRx.tests_json || "[]");
      const templateSnapshot = body.templateSnapshot ? body.templateSnapshot : JSON.parse(originalRx.template_snapshot_json || "{}");

      const statements: D1PreparedStatement[] = [
        // 1. Mark old prescription as reissued and superseded
        db.prepare("UPDATE healthcare_prescriptions SET status = 'reissued', superseded_by_id = ?, updated_at = ? WHERE id = ?")
          .bind(newRxId, now, originalRxId),

        // 2. Insert new revised prescription
        db.prepare(`
          INSERT INTO healthcare_prescriptions (
            id, prescription_number, store_id, doctor_id, doctor_name, doctor_specialization,
            store_name, user_id, patient_name, patient_phone, patient_age, patient_gender, patient_address,
            queue_entry_id, appointment_id, vitals_json, symptoms, diagnosis,
            medicines_json, tests_json, advice, template_snapshot_json, status,
            original_prescription_id, correction_reason,
            issued_at, created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, 'issued',
            ?, ?,
            ?, ?, ?
          )
        `).bind(
          newRxId, newPrescriptionNumber, storeId, originalRx.doctor_id, doctorName, doctorSpecialization,
          store?.name || originalRx.store_name, originalRx.user_id, patientName, patientPhone, patientAge, patientGender, originalRx.patient_address,
          originalRx.queue_entry_id, originalRx.appointment_id, JSON.stringify(vitals), symptoms, diagnosis,
          JSON.stringify(medicines), JSON.stringify(rawTests), advice, JSON.stringify(templateSnapshot),
          originalRxId, correctionReason,
          now, now, now
        ),

        // 3. Point existing follow-up to new prescription
        db.prepare("UPDATE healthcare_follow_ups SET prescription_id = ?, updated_at = ? WHERE prescription_id = ?")
          .bind(newRxId, now, originalRxId),
      ];

      await db.batch(statements);
      await writeAudit(request, session.user.id, "healthcare.prescription.reissued", "store", storeId, {
        originalRxId,
        newRxId,
        newPrescriptionNumber,
        correctionReason,
      });

      return noStoreJson({
        ok: true,
        newPrescriptionId: newRxId,
        newPrescriptionNumber,
      });
    }

    throw new HttpError(400, "Invalid action.", "INVALID_ACTION");
  } catch (error) {
    return apiError(error);
  }
}

function formatPrescriptionRow(rx: any, followUp?: any) {
  const todayStr = new Date().toISOString().split("T")[0];
  let fuRecord = null;
  if (followUp) {
    const isExp = followUp.valid_until_date && todayStr > followUp.valid_until_date && followUp.booking_status !== "completed";
    fuRecord = {
      id: followUp.id,
      storeId: followUp.store_id,
      prescriptionId: followUp.prescription_id,
      doctorName: followUp.doctor_name,
      originalConsultationDate: followUp.original_consultation_date,
      followUpDate: followUp.follow_up_date,
      validUntilDate: followUp.valid_until_date,
      validityDays: followUp.validity_days,
      followUpType: followUp.follow_up_type,
      followUpFee: Number(followUp.follow_up_fee || 0),
      paymentStatus: followUp.payment_status,
      bookingStatus: isExp ? "expired" : followUp.booking_status,
      isExpired: isExp,
    };
  }

  return {
    id: rx.id,
    prescriptionNumber: rx.prescription_number,
    storeId: rx.store_id,
    storeName: rx.store_name,
    doctorId: rx.doctor_id,
    doctorName: rx.doctor_name,
    doctorSpecialization: rx.doctor_specialization,
    userId: rx.user_id,
    patientName: rx.patient_name,
    patientPhone: rx.patient_phone,
    patientAge: rx.patient_age,
    patientGender: rx.patient_gender,
    patientAddress: rx.patient_address,
    queueEntryId: rx.queue_entry_id,
    appointmentId: rx.appointment_id,
    vitals: rx.vitals_json ? safeParse(rx.vitals_json) : null,
    symptoms: rx.symptoms,
    diagnosis: rx.diagnosis,
    medicines: rx.medicines_json ? safeParse(rx.medicines_json, []) : [],
    tests: rx.tests_json ? safeParse(rx.tests_json, []) : [],
    advice: rx.advice,
    templateSnapshot: rx.template_snapshot_json ? safeParse(rx.template_snapshot_json, {}) : {},
    status: rx.status,
    supersededById: rx.superseded_by_id,
    originalPrescriptionId: rx.original_prescription_id,
    correctionReason: rx.correction_reason,
    issuedAt: rx.issued_at,
    createdAt: rx.created_at,
    updatedAt: rx.updated_at,
    followUp: fuRecord,
  };
}

function formatPrescriptionWithJoinedFollowUp(row: any) {
  const todayStr = new Date().toISOString().split("T")[0];
  let fuRecord = null;
  if (row.fu_id) {
    const isExp = row.fu_valid_until && todayStr > row.fu_valid_until && row.fu_book_status !== "completed";
    fuRecord = {
      id: row.fu_id,
      storeId: row.store_id,
      prescriptionId: row.id,
      doctorName: row.doctor_name,
      followUpDate: row.fu_date,
      validUntilDate: row.fu_valid_until,
      validityDays: row.fu_validity_days,
      followUpType: row.fu_type,
      followUpFee: Number(row.fu_fee || 0),
      paymentStatus: row.fu_pay_status,
      bookingStatus: isExp ? "expired" : row.fu_book_status,
      isExpired: isExp,
    };
  }

  return {
    id: row.id,
    prescriptionNumber: row.prescription_number,
    storeId: row.store_id,
    storeName: row.store_name,
    doctorId: row.doctor_id,
    doctorName: row.doctor_name,
    doctorSpecialization: row.doctor_specialization,
    userId: row.user_id,
    patientName: row.patient_name,
    patientPhone: row.patient_phone,
    patientAge: row.patient_age,
    patientGender: row.patient_gender,
    vitals: row.vitals_json ? safeParse(row.vitals_json) : null,
    symptoms: row.symptoms,
    diagnosis: row.diagnosis,
    medicines: row.medicines_json ? safeParse(row.medicines_json, []) : [],
    tests: row.tests_json ? safeParse(row.tests_json, []) : [],
    advice: row.advice,
    templateSnapshot: row.template_snapshot_json ? safeParse(row.template_snapshot_json, {}) : {},
    status: row.status,
    supersededById: row.superseded_by_id,
    originalPrescriptionId: row.original_prescription_id,
    correctionReason: row.correction_reason,
    issuedAt: row.issued_at,
    createdAt: row.created_at,
    followUp: fuRecord,
  };
}

function safeParse(jsonStr: string, fallback: any = null) {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return fallback;
  }
}
