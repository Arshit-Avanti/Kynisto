import { getD1 } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { ensureHealthcareTables } from "@/lib/healthcare";
import { requireOwnedStore } from "@/lib/ownership";
import { apiError, HttpError, noStoreJson } from "@/lib/security";
import { cleanText } from "@/lib/validation";
import { ensurePrescriptionTables } from "@/lib/prescriptions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await ensureHealthcareTables();
    await ensurePrescriptionTables();
    const session = await requireApiPermission(request, "queue.manage_own");
    const url = new URL(request.url);
    const storeId = cleanText(url.searchParams.get("storeId"), "Clinic", { max: 80 });

    if (session.user.role !== "admin") {
      await requireOwnedStore(session.user.id, storeId);
    }

    const db = getD1();
    const search = url.searchParams.get("search")?.trim().toLowerCase() || "";
    const detailPatientPhone = url.searchParams.get("phone")?.trim();
    const detailPatientName = url.searchParams.get("name")?.trim();

    // 1. Detailed Patient Profile Overview
    if (detailPatientPhone || detailPatientName) {
      const matchCond = detailPatientPhone ? "patient_phone = ?" : "patient_name = ?";
      const matchVal = detailPatientPhone || detailPatientName;

      // Prescriptions for this patient
      const rxRows = await db
        .prepare(`
          SELECT * FROM healthcare_prescriptions
          WHERE store_id = ? AND ${matchCond}
          ORDER BY issued_at DESC
        `)
        .bind(storeId, matchVal)
        .all<any>();

      // Consultations / Queue entries for this patient
      const qRows = await db
        .prepare(`
          SELECT id, token_number, status, arrival_status, joined_at, completed_at, doctor_id
          FROM healthcare_queue_entries
          WHERE store_id = ? AND (patient_phone = ? OR patient_name = ?)
          ORDER BY joined_at DESC
        `)
        .bind(storeId, matchVal, matchVal)
        .all<any>();

      // Appointments for this patient
      const apptRows = await db
        .prepare(`
          SELECT id, appointment_date, time_slot, status, notes
          FROM healthcare_appointments
          WHERE store_id = ? AND (patient_phone = ? OR patient_name = ?)
          ORDER BY appointment_date DESC
        `)
        .bind(storeId, matchVal, matchVal)
        .all<any>();

      // Follow-ups for this patient
      const fuRows = await db
        .prepare(`
          SELECT * FROM healthcare_follow_ups
          WHERE store_id = ? AND ${matchCond}
          ORDER BY follow_up_date DESC
        `)
        .bind(storeId, matchVal)
        .all<any>();

      const latestRx = rxRows.results?.[0];

      const patientOverview = {
        patientName: latestRx?.patient_name || detailPatientName || "Patient",
        patientPhone: latestRx?.patient_phone || detailPatientPhone || null,
        patientAge: latestRx?.patient_age || null,
        patientGender: latestRx?.patient_gender || null,
        patientAddress: latestRx?.patient_address || null,
        totalVisits: (rxRows.results?.length || 0) + (qRows.results?.length || 0),
        consultationHistory: (qRows.results || []).map((q) => ({
          id: q.id,
          tokenNumber: q.token_number,
          status: q.status,
          arrivalStatus: q.arrival_status,
          date: new Date((q.joined_at || 0) * 1000).toLocaleDateString(),
          completedAt: q.completed_at ? new Date(q.completed_at * 1000).toLocaleDateString() : null,
        })),
        appointmentsHistory: apptRows.results || [],
        prescriptionHistory: (rxRows.results || []).map((rx) => ({
          id: rx.id,
          prescriptionNumber: rx.prescription_number,
          date: new Date(rx.issued_at * 1000).toLocaleDateString(),
          doctorName: rx.doctor_name,
          diagnosis: rx.diagnosis,
          medicines: safeParse(rx.medicines_json, []),
          tests: safeParse(rx.tests_json, []),
          status: rx.status,
        })),
        followUpHistory: (fuRows.results || []).map((fu) => ({
          id: fu.id,
          date: fu.follow_up_date,
          validUntil: fu.valid_until_date,
          type: fu.follow_up_type,
          fee: fu.follow_up_fee,
          status: fu.booking_status,
        })),
      };

      return noStoreJson({ patient: patientOverview });
    }

    // 2. Patient List across Queue, Appointments, and Prescriptions
    const patientsMap = new Map<string, any>();

    function computePatientId(name: string, phone: string) {
      let hash = 0;
      const str = `${(name || "").toLowerCase()}:${phone || "none"}`;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return `PID-${Math.abs(hash).toString(36).toUpperCase().padStart(6, "0")}`;
    }

    // From prescriptions
    const rxList = await db
      .prepare(`
        SELECT patient_name, patient_phone, patient_age, patient_gender, issued_at, doctor_name
        FROM healthcare_prescriptions
        WHERE store_id = ?
        ORDER BY issued_at DESC
      `)
      .bind(storeId)
      .all<any>();

    for (const row of rxList.results || []) {
      const key = (row.patient_phone || row.patient_name || "").toLowerCase();
      if (!key) continue;
      if (!patientsMap.has(key)) {
        patientsMap.set(key, {
          patientId: computePatientId(row.patient_name, row.patient_phone || ""),
          patientName: row.patient_name,
          patientPhone: row.patient_phone || "Not recorded",
          patientAge: row.patient_age,
          patientGender: row.patient_gender,
          lastVisit: new Date(row.issued_at * 1000).toLocaleDateString(),
          lastDoctor: row.doctor_name,
          totalPrescriptions: 1,
          totalVisits: 1,
        });
      } else {
        const p = patientsMap.get(key);
        p.totalPrescriptions += 1;
        p.totalVisits += 1;
      }
    }

    // From queue entries
    const qList = await db
      .prepare(`
        SELECT patient_name, patient_phone, joined_at
        FROM healthcare_queue_entries
        WHERE store_id = ?
        ORDER BY joined_at DESC
      `)
      .bind(storeId)
      .all<any>();

    for (const row of qList.results || []) {
      const key = (row.patient_phone || row.patient_name || "").toLowerCase();
      if (!key) continue;
      if (!patientsMap.has(key)) {
        patientsMap.set(key, {
          patientId: computePatientId(row.patient_name, row.patient_phone || ""),
          patientName: row.patient_name,
          patientPhone: row.patient_phone || "Not recorded",
          lastVisit: new Date((row.joined_at || 0) * 1000).toLocaleDateString(),
          lastDoctor: null,
          totalPrescriptions: 0,
          totalVisits: 1,
        });
      } else {
        const p = patientsMap.get(key);
        p.totalVisits += 1;
      }
    }

    // From appointments
    const apptList = await db
      .prepare(`
        SELECT patient_name, patient_phone, appointment_date
        FROM healthcare_appointments
        WHERE store_id = ?
        ORDER BY created_at DESC
      `)
      .bind(storeId)
      .all<any>();

    for (const row of apptList.results || []) {
      const key = (row.patient_phone || row.patient_name || "").toLowerCase();
      if (!key) continue;
      if (!patientsMap.has(key)) {
        patientsMap.set(key, {
          patientId: computePatientId(row.patient_name, row.patient_phone || ""),
          patientName: row.patient_name,
          patientPhone: row.patient_phone || "Not recorded",
          lastVisit: row.appointment_date,
          lastDoctor: null,
          totalPrescriptions: 0,
          totalVisits: 1,
        });
      } else {
        const p = patientsMap.get(key);
        p.totalVisits += 1;
      }
    }

    let patients = Array.from(patientsMap.values());
    if (search) {
      patients = patients.filter(
        (p) =>
          p.patientName.toLowerCase().includes(search) ||
          (p.patientId && p.patientId.toLowerCase().includes(search)) ||
          (p.patientPhone && p.patientPhone.toLowerCase().includes(search))
      );
    }

    return noStoreJson({ patients });
  } catch (error) {
    return apiError(error);
  }
}

function safeParse(str: string, fallback: any = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
