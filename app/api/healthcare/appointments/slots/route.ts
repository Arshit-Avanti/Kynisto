import { getD1 } from "@/db/runtime";
import { requireHealthcareStore } from "@/lib/healthcare";
import { apiError, HttpError, noStoreJson } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const storeId = url.searchParams.get("storeId")?.trim();
    const date = url.searchParams.get("date")?.trim();
    const doctorId = url.searchParams.get("doctorId")?.trim() || null;
    if (!storeId) throw new HttpError(400, "Provider is required.", "VALIDATION_ERROR");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, "Valid date is required.", "VALIDATION_ERROR");

    const provider = await requireHealthcareStore(storeId);
    if (provider.allowAppointments === 0) {
      return noStoreJson({ slots: [], allowAppointments: false, message: "Appointments are currently closed by the clinic." });
    }
    const db = getD1();

    // Get queue settings for operating hours
    const settings = await db.prepare(`SELECT opening_time AS openingTime, closing_time AS closingTime, consultation_minutes AS consultationMinutes
      FROM healthcare_queue_settings WHERE store_id = ? LIMIT 1`)
      .bind(storeId).first<{ openingTime: string; closingTime: string; consultationMinutes: number }>();

    const openingTime = settings?.openingTime || "09:00";
    const closingTime = settings?.closingTime || "18:00";
    let slotMinutes = settings?.consultationMinutes || 15;

    // If doctor specified, use their consultation time
    if (doctorId) {
      const doctor = await db.prepare("SELECT consultation_minutes AS cm FROM healthcare_doctors WHERE id = ? AND store_id = ? AND status = 'active' LIMIT 1")
        .bind(doctorId, storeId).first<{ cm: number }>();
      if (doctor?.cm) slotMinutes = doctor.cm;
    }

    // Generate all possible slots
    const [openH, openM] = openingTime.split(":").map(Number);
    const [closeH, closeM] = closingTime.split(":").map(Number);
    const startMinutes = openH * 60 + openM;
    const endMinutes = closeH * 60 + closeM;
    const allSlots: string[] = [];
    for (let m = startMinutes; m + slotMinutes <= endMinutes; m += slotMinutes) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      allSlots.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
    }

    // Get booked slots
    const booked = await db.prepare(`SELECT time_slot AS timeSlot FROM healthcare_appointments
      WHERE store_id = ? AND appointment_date = ? AND status IN ('booked','confirmed','checked_in')
      ${doctorId ? "AND doctor_id = ?" : ""}`)
      .bind(storeId, date, ...(doctorId ? [doctorId] : [])).all<{ timeSlot: string }>();
    const bookedSet = new Set((booked.results ?? []).map(r => r.timeSlot));

    const slots = allSlots.map(slot => ({ time: slot, available: !bookedSet.has(slot) }));
    return noStoreJson({ slots, openingTime, closingTime, slotMinutes });
  } catch (error) { return apiError(error); }
}
