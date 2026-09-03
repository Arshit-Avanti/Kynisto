import { getD1 } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { ensureHealthcareTables } from "@/lib/healthcare";
import { requireOwnedStore, writeAudit } from "@/lib/ownership";
import { apiError, HttpError, noStoreJson } from "@/lib/security";
import { cleanText, numberInput, safeJson } from "@/lib/validation";
import { ensurePrescriptionTables } from "@/lib/prescriptions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await ensureHealthcareTables();
    await ensurePrescriptionTables();
    const db = getD1();
    const url = new URL(request.url);
    const storeId = url.searchParams.get("storeId");
    const todayStr = new Date().toISOString().split("T")[0];

    // 1. Clinic Owner View
    if (storeId) {
      const session = await requireApiPermission(request, "queue.manage_own");
      if (session.user.role !== "admin") {
        await requireOwnedStore(session.user.id, storeId);
      }

      const rows = await db
        .prepare(`
          SELECT f.*, p.prescription_number, p.diagnosis, p.medicines_json
          FROM healthcare_follow_ups f
          JOIN healthcare_prescriptions p ON p.id = f.prescription_id
          WHERE f.store_id = ?
          ORDER BY f.follow_up_date ASC, f.created_at DESC
          LIMIT 300
        `)
        .bind(storeId)
        .all<any>();

      const settings = await db
        .prepare("SELECT default_followup_type, default_followup_validity_days, default_followup_fee FROM healthcare_queue_settings WHERE store_id = ?")
        .bind(storeId)
        .first<any>();

      const todayList: any[] = [];
      const upcomingList: any[] = [];
      const expiredList: any[] = [];

      for (const row of rows.results || []) {
        const item = formatFollowUpRow(row, todayStr);
        if (item.isExpired) {
          expiredList.push(item);
        } else if (item.followUpDate === todayStr) {
          todayList.push(item);
        } else if (item.followUpDate > todayStr) {
          upcomingList.push(item);
        } else {
          // Past follow_up_date but not yet reached valid_until_date
          todayList.push(item);
        }
      }

      return noStoreJson({
        today: todayList,
        upcoming: upcomingList,
        expired: expiredList,
        settings: {
          defaultFollowupType: settings?.default_followup_type || "free",
          defaultFollowupValidityDays: Number(settings?.default_followup_validity_days || 7),
          defaultFollowupFee: Number(settings?.default_followup_fee || 0),
        },
      });
    }

    // 2. Customer View
    const session = await requireApiPermission(request, "profile.manage_own");
    const userPhone = (session.user as any).phone || "";

    const rows = await db
      .prepare(`
        SELECT f.*, p.prescription_number, p.diagnosis, s.name AS clinic_name, s.address AS clinic_address
        FROM healthcare_follow_ups f
        JOIN healthcare_prescriptions p ON p.id = f.prescription_id
        JOIN stores s ON s.id = f.store_id
        WHERE f.user_id = ? OR f.patient_phone = ?
        ORDER BY f.follow_up_date ASC
        LIMIT 50
      `)
      .bind(session.user.id, userPhone)
      .all<any>();

    const followUps = (rows.results || []).map((row) => formatFollowUpRow(row, todayStr));
    return noStoreJson({ followUps });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureHealthcareTables();
    await ensurePrescriptionTables();
    const body = await safeJson(request);
    const action = cleanText(body.action, "Action", { max: 40 });
    const db = getD1();

    // 1. Configure Clinic Follow-up Settings
    if (action === "configure_settings") {
      const session = await requireApiPermission(request, "queue.manage_own", { csrf: true });
      const storeId = cleanText(body.storeId, "Clinic", { max: 80 });
      if (session.user.role !== "admin") {
        await requireOwnedStore(session.user.id, storeId);
      }

      const followupType = cleanText(body.followupType, "Follow-up type", { max: 20 });
      if (!["free", "paid", "discounted"].includes(followupType)) {
        throw new HttpError(400, "Invalid follow-up type.", "INVALID_TYPE");
      }

      const validityDays = numberInput(body.validityDays, "Validity days", { min: 1, max: 180, integer: true }) as number;
      const fee = Number(body.fee || 0);
      const now = Math.floor(Date.now() / 1000);

      await db.prepare(`
        UPDATE healthcare_queue_settings
        SET default_followup_type = ?, default_followup_validity_days = ?, default_followup_fee = ?, updated_at = ?
        WHERE store_id = ?
      `).bind(followupType, validityDays, fee, now, storeId).run();

      await writeAudit(request, session.user.id, "healthcare.followup.configured", "store", storeId, {
        followupType,
        validityDays,
        fee,
      });

      return noStoreJson({ ok: true, followupType, validityDays, fee });
    }

    // 2. Book Follow-up
    if (action === "book") {
      const session = await requireApiPermission(request, "profile.manage_own", { csrf: true });
      const followUpId = cleanText(body.followUpId, "Follow-up ID", { max: 80 });
      const appointmentId = cleanText(body.appointmentId, "Appointment ID", { max: 80, required: false }) || null;

      const followUp = await db
        .prepare("SELECT * FROM healthcare_follow_ups WHERE id = ? LIMIT 1")
        .bind(followUpId)
        .first<any>();

      if (!followUp) throw new HttpError(404, "Follow-up record not found.", "NOT_FOUND");

      const todayStr = new Date().toISOString().split("T")[0];
      if (followUp.valid_until_date < todayStr) {
        throw new HttpError(400, "Follow-up period has expired.", "FOLLOW_UP_EXPIRED");
      }

      const now = Math.floor(Date.now() / 1000);
      await db.prepare(`
        UPDATE healthcare_follow_ups
        SET booking_status = 'booked', appointment_id = COALESCE(?, appointment_id), updated_at = ?
        WHERE id = ?
      `).bind(appointmentId, now, followUpId).run();

      return noStoreJson({ ok: true, status: "booked" });
    }

    // 3. Complete Follow-up
    if (action === "complete") {
      const session = await requireApiPermission(request, "queue.manage_own", { csrf: true });
      const followUpId = cleanText(body.followUpId, "Follow-up ID", { max: 80 });
      const storeId = cleanText(body.storeId, "Clinic", { max: 80 });
      if (session.user.role !== "admin") {
        await requireOwnedStore(session.user.id, storeId);
      }

      const now = Math.floor(Date.now() / 1000);
      await db.prepare(`
        UPDATE healthcare_follow_ups
        SET booking_status = 'completed', updated_at = ?
        WHERE id = ? AND store_id = ?
      `).bind(now, followUpId, storeId).run();

      return noStoreJson({ ok: true, status: "completed" });
    }

    throw new HttpError(400, "Invalid action.", "INVALID_ACTION");
  } catch (error) {
    return apiError(error);
  }
}

function formatFollowUpRow(row: any, todayStr: string) {
  const isExp = row.valid_until_date && todayStr > row.valid_until_date && row.booking_status !== "completed";
  return {
    id: row.id,
    storeId: row.store_id,
    clinicName: row.clinic_name,
    clinicAddress: row.clinic_address,
    prescriptionId: row.prescription_id,
    prescriptionNumber: row.prescription_number,
    diagnosis: row.diagnosis,
    patientName: row.patient_name,
    patientPhone: row.patient_phone,
    doctorId: row.doctor_id,
    doctorName: row.doctor_name,
    originalConsultationDate: row.original_consultation_date,
    followUpDate: row.follow_up_date,
    validUntilDate: row.valid_until_date,
    validityDays: row.validity_days,
    followUpType: row.follow_up_type,
    followUpFee: Number(row.follow_up_fee || 0),
    paymentStatus: row.payment_status,
    bookingStatus: isExp ? "expired" : row.booking_status,
    isExpired: isExp,
    notes: row.notes,
    createdAt: row.created_at,
  };
}
