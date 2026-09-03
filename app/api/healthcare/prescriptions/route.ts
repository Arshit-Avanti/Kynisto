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
  mergeTemplateLayout,
  validatePrescriptionMedicines,
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
      const uDigits = cleanDigits(userPhone);
      const pDigits = cleanDigits(rx.patient_phone);

      const isCustomer =
        (rx.user_id && rx.user_id === session.user.id) ||
        (uDigits && pDigits && (pDigits === uDigits || (uDigits.length >= 10 && pDigits.length >= 10 && pDigits.slice(-10) === uDigits.slice(-10)))) ||
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
        SELECT p.*, f.id AS fu_id, f.original_consultation_date AS fu_orig_date, f.follow_up_date AS fu_date,
               f.valid_until_date AS fu_valid_until, f.validity_days AS fu_validity_days,
               f.follow_up_type AS fu_type, f.follow_up_fee AS fu_fee, f.payment_status AS fu_pay_status,
               f.booking_status AS fu_book_status, f.notes AS fu_notes, f.appointment_id AS fu_appt_id
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
    const cleanDigits = (p: string | null | undefined) => (p ? p.replace(/\D/g, "") : "");
    const uPhoneDigits = cleanDigits(userPhone);
    const phoneSuffix = uPhoneDigits.length >= 10 ? `%${uPhoneDigits.slice(-10)}` : (userPhone ? userPhone : "__NO_PHONE__");

    let query = `
      SELECT p.*, f.id AS fu_id, f.original_consultation_date AS fu_orig_date, f.follow_up_date AS fu_date,
             f.valid_until_date AS fu_valid_until, f.validity_days AS fu_validity_days,
             f.follow_up_type AS fu_type, f.follow_up_fee AS fu_fee, f.payment_status AS fu_pay_status,
             f.booking_status AS fu_book_status, f.notes AS fu_notes, f.appointment_id AS fu_appt_id
      FROM healthcare_prescriptions p
      LEFT JOIN healthcare_follow_ups f ON f.prescription_id = p.id
      WHERE (p.user_id = ? OR (p.patient_phone IS NOT NULL AND p.patient_phone != '' AND ? != '' AND (p.patient_phone = ? OR p.patient_phone LIKE ?))) AND p.issued_at >= ?
      ORDER BY p.issued_at DESC LIMIT 100
    `;
    const rows = await db.prepare(query).bind(userId, userPhone, userPhone, phoneSuffix, minTimestamp).all<any>();
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
    const doctorRegistration = cleanText(body.doctorRegistration, "Doctor Registration", { max: 100, required: false }) || null;

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

    // Medicines array validation using robust validator
    let medicines: PrescriptionMedicine[];
    try {
      medicines = validatePrescriptionMedicines(body.medicines);
    } catch (err: any) {
      throw new HttpError(400, err.message, err.code || "INVALID_MEDICINE");
    }

    // Tests array
    const rawTests = Array.isArray(body.tests) ? body.tests : [];
    const tests = rawTests.map((t: any) => typeof t === "string" ? t.trim() : "").filter(Boolean);

    // Template snapshot: use provided snapshot or fetch clinic's default template and merge with sound fallbacks
    let templateSnapshot: PrescriptionTemplateLayout;
    if (body.templateSnapshot && typeof body.templateSnapshot === "object") {
      templateSnapshot = mergeTemplateLayout(body.templateSnapshot, {
        name: store.name,
        address: store.address,
        phone: store.phone,
        logoUrl: store.logo_url,
      });
    } else {
      const templateRow = await db
        .prepare("SELECT layout_json FROM healthcare_prescription_templates WHERE store_id = ? AND is_default = 1 LIMIT 1")
        .bind(storeId)
        .first<{ layout_json: string }>();

      let parsedLayout = null;
      if (templateRow?.layout_json) {
        try {
          parsedLayout = JSON.parse(templateRow.layout_json);
        } catch {}
      }
      templateSnapshot = mergeTemplateLayout(parsedLayout, {
        name: store.name,
        address: store.address,
        phone: store.phone,
        logoUrl: store.logo_url,
      });
    }

    if (doctorRegistration) {
      templateSnapshot.doctorRegistration = doctorRegistration;
    }

    const rxId = `rx-${crypto.randomUUID()}`;
    const prescriptionNumber = generatePrescriptionNumber();
    const now = Math.floor(Date.now() / 1000);

    const statements: D1PreparedStatement[] = [
      db.prepare(`
        INSERT INTO healthcare_prescriptions (
          id, prescription_number, store_id, doctor_id, doctor_name, doctor_specialization, doctor_registration,
          store_name, user_id, patient_name, patient_phone, patient_age, patient_gender, patient_address,
          queue_entry_id, appointment_id, vitals_json, symptoms, diagnosis,
          medicines_json, tests_json, advice, template_snapshot_json, status,
          issued_at, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, 'issued',
          ?, ?, ?
        )
      `).bind(
        rxId, prescriptionNumber, storeId, doctorId, doctorName, doctorSpecialization, doctorRegistration,
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
    const isFollowUpExplicitlyDisabled =
      Boolean(followUpConfig) &&
      (followUpConfig.enabled === false || followUpConfig.enabled === "false");
    const isFollowUpEnabled =
      Boolean(followUpConfig) &&
      !isFollowUpExplicitlyDisabled &&
      (followUpConfig.enabled === true || followUpConfig.enabled === "true" || Boolean(followUpConfig.validityDays));

    if (isFollowUpEnabled) {
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
      if (originalRx.status !== "issued") {
        throw new HttpError(400, `Cannot reissue a prescription with status '${originalRx.status}'.`, "INVALID_STATUS");
      }

      const store = await db.prepare("SELECT id, name, address, phone, logo_url FROM stores WHERE id = ?").bind(storeId).first<any>();
      const newRxId = `rx-${crypto.randomUUID()}`;
      const newPrescriptionNumber = generatePrescriptionNumber();
      const now = Math.floor(Date.now() / 1000);

      const doctorId = cleanText(body.doctorId ?? originalRx.doctor_id, "Doctor ID", { max: 80, required: false }) || null;
      const doctorName = cleanText(body.doctorName ?? originalRx.doctor_name, "Doctor Name", { min: 2, max: 120 });
      const doctorSpecialization = cleanText(body.doctorSpecialization ?? originalRx.doctor_specialization, "Specialization", { max: 120, required: false }) || null;
      const doctorRegistration = cleanText(body.doctorRegistration ?? originalRx.doctor_registration, "Doctor Registration", { max: 100, required: false }) || null;

      const patientName = cleanText(body.patientName ?? originalRx.patient_name, "Patient Name", { min: 2, max: 120 });
      const patientPhone = cleanText(body.patientPhone ?? originalRx.patient_phone, "Patient Phone", { max: 40, required: false }) || null;
      const patientAge = body.patientAge ? numberInput(body.patientAge, "Age", { min: 0, max: 130, integer: true }) : originalRx.patient_age;
      const patientGender = cleanText(body.patientGender ?? originalRx.patient_gender, "Gender", { max: 20, required: false }) || null;
      const patientAddress = cleanText(body.patientAddress ?? originalRx.patient_address, "Address", { max: 250, required: false }) || null;

      const vitals = body.vitals ? body.vitals : safeParse(originalRx.vitals_json, {});
      const symptoms = cleanText(body.symptoms ?? originalRx.symptoms, "Symptoms", { max: 2000, required: false }) || null;
      const diagnosis = cleanText(body.diagnosis ?? originalRx.diagnosis, "Diagnosis", { max: 2000, required: false }) || null;
      const advice = cleanText(body.advice ?? originalRx.advice, "Advice", { max: 2000, required: false }) || null;

      const rawMeds = Array.isArray(body.medicines) ? body.medicines : safeParse(originalRx.medicines_json, []);
      let medicines: PrescriptionMedicine[];
      try {
        medicines = validatePrescriptionMedicines(rawMeds);
      } catch (err: any) {
        throw new HttpError(400, err.message, err.code || "INVALID_MEDICINE");
      }

      const rawTests = Array.isArray(body.tests) ? body.tests : safeParse(originalRx.tests_json, []);
      const tests = rawTests.map((t: any) => typeof t === "string" ? t.trim() : "").filter(Boolean);

      const rawSnapshot = body.templateSnapshot ? body.templateSnapshot : safeParse(originalRx.template_snapshot_json, null);
      const templateSnapshot = mergeTemplateLayout(rawSnapshot, {
        name: store?.name || originalRx.store_name,
        address: store?.address,
        phone: store?.phone,
        logoUrl: store?.logo_url,
      });
      if (doctorRegistration) {
        templateSnapshot.doctorRegistration = doctorRegistration;
      }

      const rootOriginalId = originalRx.original_prescription_id || originalRx.id;

      const statements: D1PreparedStatement[] = [
        // 1. Mark old prescription as reissued and superseded (preserves original record intact for audit trail)
        db.prepare("UPDATE healthcare_prescriptions SET status = 'reissued', superseded_by_id = ?, updated_at = ? WHERE id = ?")
          .bind(newRxId, now, originalRxId),

        // 2. Insert new revised prescription linking to root original
        db.prepare(`
          INSERT INTO healthcare_prescriptions (
            id, prescription_number, store_id, doctor_id, doctor_name, doctor_specialization, doctor_registration,
            store_name, user_id, patient_name, patient_phone, patient_age, patient_gender, patient_address,
            queue_entry_id, appointment_id, vitals_json, symptoms, diagnosis,
            medicines_json, tests_json, advice, template_snapshot_json, status,
            original_prescription_id, correction_reason,
            issued_at, created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, 'issued',
            ?, ?,
            ?, ?, ?
          )
        `).bind(
          newRxId, newPrescriptionNumber, storeId, doctorId, doctorName, doctorSpecialization, doctorRegistration,
          store?.name || originalRx.store_name, originalRx.user_id, patientName, patientPhone, patientAge, patientGender, patientAddress,
          originalRx.queue_entry_id, originalRx.appointment_id, JSON.stringify(vitals), symptoms, diagnosis,
          JSON.stringify(medicines), JSON.stringify(tests), advice, JSON.stringify(templateSnapshot),
          rootOriginalId, correctionReason,
          now, now, now
        ),
      ];

      // 3. Handle Follow-up in Reissue
      const followUpConfig = body.followUp;
      const isFollowUpExplicitlyDisabled =
        Boolean(followUpConfig) &&
        (followUpConfig.enabled === false || followUpConfig.enabled === "false");
      const isFollowUpEnabled =
        Boolean(followUpConfig) &&
        !isFollowUpExplicitlyDisabled &&
        (followUpConfig.enabled === true || followUpConfig.enabled === "true" || Boolean(followUpConfig.validityDays));

      if (isFollowUpEnabled) {
        const validityDays = numberInput(followUpConfig.validityDays ?? 7, "Validity days", { min: 1, max: 180, integer: true }) as number;
        const followUpType = (["free", "paid", "discounted"].includes(followUpConfig.followUpType) ? followUpConfig.followUpType : "free") as "free" | "paid" | "discounted";
        const followUpFee = followUpType === "free" ? 0 : Number(followUpConfig.followUpFee || 0);
        const targetDays = followUpConfig.targetDays ? Number(followUpConfig.targetDays) : validityDays;

        const existingFollowUp = await db
          .prepare("SELECT * FROM healthcare_follow_ups WHERE prescription_id = ? LIMIT 1")
          .bind(originalRxId)
          .first<any>();

        const baseConsultationDate =
          existingFollowUp?.original_consultation_date ||
          (originalRx.issued_at ? new Date(originalRx.issued_at * 1000).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);

        const { followUpDate, validUntilDate } = calculateFollowUpDates(baseConsultationDate, validityDays, targetDays);

        if (existingFollowUp) {
          statements.push(
            db.prepare(`
              UPDATE healthcare_follow_ups
              SET prescription_id = ?, doctor_id = ?, doctor_name = ?, patient_name = ?, patient_phone = ?,
                  follow_up_date = ?, valid_until_date = ?, validity_days = ?, follow_up_type = ?, follow_up_fee = ?,
                  notes = COALESCE(?, notes), updated_at = ?
              WHERE id = ?
            `).bind(
              newRxId, doctorId, doctorName, patientName, patientPhone,
              followUpDate, validUntilDate, validityDays, followUpType, followUpFee,
              followUpConfig.notes || null, now, existingFollowUp.id
            )
          );
        } else {
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
              followUpId, storeId, newRxId, originalRx.user_id, patientName, patientPhone,
              doctorId, doctorName, baseConsultationDate, followUpDate,
              validUntilDate, validityDays, followUpType, followUpFee,
              followUpType === "free" ? "free" : "unpaid",
              followUpConfig.notes || null, now, now
            )
          );
        }
      } else if (isFollowUpExplicitlyDisabled) {
        statements.push(
          db.prepare("DELETE FROM healthcare_follow_ups WHERE prescription_id = ? AND booking_status = 'not_booked'")
            .bind(originalRxId)
        );
      } else {
        // Point existing follow-up to new prescription
        statements.push(
          db.prepare("UPDATE healthcare_follow_ups SET prescription_id = ?, updated_at = ? WHERE prescription_id = ?")
            .bind(newRxId, now, originalRxId)
        );
      }

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
    const isBookedOrCompleted = followUp.booking_status === "booked" || followUp.booking_status === "completed";
    const isExp = Boolean(followUp.valid_until_date && todayStr > followUp.valid_until_date && !isBookedOrCompleted);
    fuRecord = {
      id: followUp.id,
      storeId: followUp.store_id,
      prescriptionId: followUp.prescription_id,
      patientName: followUp.patient_name || rx.patient_name,
      patientPhone: followUp.patient_phone || rx.patient_phone,
      doctorId: followUp.doctor_id || rx.doctor_id,
      doctorName: followUp.doctor_name || rx.doctor_name,
      originalConsultationDate: followUp.original_consultation_date,
      followUpDate: followUp.follow_up_date,
      validUntilDate: followUp.valid_until_date,
      validityDays: followUp.validity_days,
      followUpType: followUp.follow_up_type,
      followUpFee: Number(followUp.follow_up_fee || 0),
      paymentStatus: followUp.payment_status,
      bookingStatus: isExp ? "expired" : followUp.booking_status,
      isExpired: isExp,
      appointmentId: followUp.appointment_id || null,
      notes: followUp.notes || null,
    };
  }

  const rawSnapshot = safeParse(rx.template_snapshot_json, null);
  const templateSnapshot = mergeTemplateLayout(rawSnapshot, { name: rx.store_name });
  if (rx.doctor_registration) {
    templateSnapshot.doctorRegistration = rx.doctor_registration;
  }

  return {
    id: rx.id,
    prescriptionNumber: rx.prescription_number,
    storeId: rx.store_id,
    storeName: rx.store_name,
    doctorId: rx.doctor_id,
    doctorName: rx.doctor_name,
    doctorSpecialization: rx.doctor_specialization,
    doctorRegistration: rx.doctor_registration || templateSnapshot.doctorRegistration || null,
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
    templateSnapshot,
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
    const isBookedOrCompleted = row.fu_book_status === "booked" || row.fu_book_status === "completed";
    const isExp = Boolean(row.fu_valid_until && todayStr > row.fu_valid_until && !isBookedOrCompleted);
    fuRecord = {
      id: row.fu_id,
      storeId: row.store_id,
      prescriptionId: row.id,
      patientName: row.patient_name,
      patientPhone: row.patient_phone,
      doctorId: row.doctor_id,
      doctorName: row.doctor_name,
      originalConsultationDate: row.fu_orig_date || null,
      followUpDate: row.fu_date,
      validUntilDate: row.fu_valid_until,
      validityDays: row.fu_validity_days,
      followUpType: row.fu_type,
      followUpFee: Number(row.fu_fee || 0),
      paymentStatus: row.fu_pay_status,
      bookingStatus: isExp ? "expired" : row.fu_book_status,
      isExpired: isExp,
      appointmentId: row.fu_appt_id || null,
      notes: row.fu_notes || null,
    };
  }

  const rawSnapshot = safeParse(row.template_snapshot_json, null);
  const templateSnapshot = mergeTemplateLayout(rawSnapshot, { name: row.store_name });
  if (row.doctor_registration) {
    templateSnapshot.doctorRegistration = row.doctor_registration;
  }

  return {
    id: row.id,
    prescriptionNumber: row.prescription_number,
    storeId: row.store_id,
    storeName: row.store_name,
    doctorId: row.doctor_id,
    doctorName: row.doctor_name,
    doctorSpecialization: row.doctor_specialization,
    doctorRegistration: row.doctor_registration || templateSnapshot.doctorRegistration || null,
    userId: row.user_id,
    patientName: row.patient_name,
    patientPhone: row.patient_phone,
    patientAge: row.patient_age,
    patientGender: row.patient_gender,
    patientAddress: row.patient_address || null,
    vitals: row.vitals_json ? safeParse(row.vitals_json) : null,
    symptoms: row.symptoms,
    diagnosis: row.diagnosis,
    medicines: row.medicines_json ? safeParse(row.medicines_json, []) : [],
    tests: row.tests_json ? safeParse(row.tests_json, []) : [],
    advice: row.advice,
    templateSnapshot,
    status: row.status,
    supersededById: row.superseded_by_id,
    originalPrescriptionId: row.original_prescription_id,
    correctionReason: row.correction_reason,
    issuedAt: row.issued_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at || row.issued_at,
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
