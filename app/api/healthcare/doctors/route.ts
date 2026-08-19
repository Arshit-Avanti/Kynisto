import { getD1 } from "@/db/runtime";
import { requireApiSession } from "@/lib/auth";
import { requireHealthcareStore } from "@/lib/healthcare";
import { requireOwnedStore, writeAudit } from "@/lib/ownership";
import { apiError, HttpError, noStoreJson } from "@/lib/security";
import { requireFeaturePermission } from "@/lib/subscriptions";
import { cleanText, numberInput, safeJson } from "@/lib/validation";

export const dynamic = "force-dynamic";

// Public: list active doctors for a store
export async function GET(request: Request) {
  try {
    const storeId = new URL(request.url).searchParams.get("storeId")?.trim();
    if (!storeId) throw new HttpError(400, "Provider is required.", "VALIDATION_ERROR");
    await requireHealthcareStore(storeId);
    const doctors = await getD1()
      .prepare(`SELECT id, name, specialization, consultation_minutes AS consultationMinutes, sort_order AS sortOrder
        FROM healthcare_doctors WHERE store_id = ? AND status = 'active' ORDER BY sort_order ASC, name ASC`)
      .bind(storeId).all();
    return noStoreJson({ doctors: doctors.results ?? [] });
  } catch (error) { return apiError(error); }
}

// Owner: manage doctors
export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    await requireFeaturePermission(session.user.id, "healthcare");
    const body = await safeJson(request);
    const storeId = cleanText(body.storeId, "Provider", { max: 80 });
    await requireOwnedStore(session.user.id, storeId);
    await requireHealthcareStore(storeId);
    const action = cleanText(body.action, "Action", { max: 20 });
    const db = getD1();
    const now = Math.floor(Date.now() / 1000);

    if (action === "add") {
      const name = cleanText(body.name, "Doctor name", { min: 2, max: 120 });
      const specialization = cleanText(body.specialization, "Specialization", { max: 120, required: false }) || null;
      const consultationMinutes = numberInput(body.consultationMinutes ?? 15, "Consultation time", { min: 5, max: 180, integer: true }) as number;
      const id = crypto.randomUUID();
      await db.prepare(`INSERT INTO healthcare_doctors (id, store_id, name, specialization, consultation_minutes, status, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'active', (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM healthcare_doctors WHERE store_id = ?), ?, ?)`)
        .bind(id, storeId, name, specialization, consultationMinutes, storeId, now, now).run();
      await writeAudit(request, session.user.id, "healthcare.doctor.added", "store", storeId, { doctorId: id, name });
      return noStoreJson({ ok: true, doctor: { id, name, specialization, consultationMinutes } }, { status: 201 });
    }

    if (action === "update") {
      const doctorId = cleanText(body.doctorId, "Doctor", { max: 80 });
      const name = cleanText(body.name, "Doctor name", { min: 2, max: 120 });
      const specialization = cleanText(body.specialization, "Specialization", { max: 120, required: false }) || null;
      const consultationMinutes = numberInput(body.consultationMinutes ?? 15, "Consultation time", { min: 5, max: 180, integer: true }) as number;
      const result = await db.prepare("UPDATE healthcare_doctors SET name = ?, specialization = ?, consultation_minutes = ?, updated_at = ? WHERE id = ? AND store_id = ? RETURNING id")
        .bind(name, specialization, consultationMinutes, now, doctorId, storeId).first();
      if (!result) throw new HttpError(404, "Doctor not found.", "DOCTOR_NOT_FOUND");
      await writeAudit(request, session.user.id, "healthcare.doctor.updated", "store", storeId, { doctorId, name });
      return noStoreJson({ ok: true });
    }

    if (action === "remove") {
      const doctorId = cleanText(body.doctorId, "Doctor", { max: 80 });
      const result = await db.prepare("UPDATE healthcare_doctors SET status = 'inactive', updated_at = ? WHERE id = ? AND store_id = ? AND status = 'active' RETURNING id")
        .bind(now, doctorId, storeId).first();
      if (!result) throw new HttpError(404, "Doctor not found.", "DOCTOR_NOT_FOUND");
      await writeAudit(request, session.user.id, "healthcare.doctor.removed", "store", storeId, { doctorId });
      return noStoreJson({ ok: true });
    }

    throw new HttpError(400, "Unsupported doctor action.", "INVALID_ACTION");
  } catch (error) { return apiError(error); }
}
