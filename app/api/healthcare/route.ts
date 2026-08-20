import { getD1 } from "@/db/runtime";
import { ensureSeeded } from "@/db/seed";
import { expireHealthcareQueueEntries, HEALTHCARE_LABELS, HEALTHCARE_TYPES, patientQueueState } from "@/lib/healthcare";
import { apiError } from "@/lib/security";
import { d1SearchText } from "@/lib/validation";
import { microCache, microCacheJson } from "@/lib/micro-cache";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const cacheKey = `healthcare:${url.searchParams.toString()}`;
    const cached = microCache.get<any>(cacheKey);
    if (cached) {
      return microCacheJson(cached, "public, max-age=10, stale-while-revalidate=30");
    }

    await ensureSeeded();
    await expireHealthcareQueueEntries();

    const db = getD1();

    // Auto-sync: Ensure all healthcare categories have module='healthcare'
    await db.prepare(`
      UPDATE categories SET module = 'healthcare' 
      WHERE module <> 'healthcare' 
      AND (
        slug IN ('clinics-doctors', 'pharmacies', 'dental-care', 'opticians', 'pet-care')
        OR name LIKE '%Clinic%' OR name LIKE '%Doctor%' OR name LIKE '%Hospital%' 
        OR name LIKE '%Pharm%' OR name LIKE '%Dental%' OR name LIKE '%Health%' 
        OR name LIKE '%Optic%'
      )
    `).run().catch(() => {});

    // Auto-sync: Ensure all healthcare stores have a verified healthcare_provider_profile
    await db.prepare(`
      INSERT INTO healthcare_provider_profiles 
        (store_id, provider_type, accepting_patients, emergency_available, admin_queue_enabled, owner_queue_enabled, queue_activation_status, verification_status, created_at, updated_at)
      SELECT 
        s.id,
        CASE 
          WHEN c.name LIKE '%Hospital%' OR s.name LIKE '%Hospital%' THEN 'hospital'
          WHEN c.name LIKE '%Dental%' OR s.name LIKE '%Dental%' THEN 'dental_clinic'
          WHEN c.name LIKE '%Pharm%' OR s.name LIKE '%Pharm%' OR s.name LIKE '%Medical%' THEN 'pharmacy'
          WHEN c.name LIKE '%Diagnostic%' OR c.name LIKE '%Lab%' OR s.name LIKE '%Diagnostic%' OR s.name LIKE '%Scan%' THEN 'diagnostic_lab'
          WHEN c.name LIKE '%Optic%' OR c.name LIKE '%Eye%' THEN 'eye_clinic'
          WHEN c.name LIKE '%Pet%' OR c.name LIKE '%Vet%' THEN 'veterinary_clinic'
          ELSE 'clinic'
        END,
        1,
        CASE WHEN c.name LIKE '%Hospital%' OR s.name LIKE '%Hospital%' THEN 1 ELSE 0 END,
        1, 1, 'approved', 'verified', unixepoch(), unixepoch()
      FROM stores s 
      JOIN categories c ON c.id = s.category_id
      WHERE (
        c.module = 'healthcare' 
        OR c.slug IN ('clinics-doctors', 'pharmacies', 'dental-care', 'opticians', 'pet-care') 
        OR c.name LIKE '%Clinic%' OR c.name LIKE '%Doctor%' OR c.name LIKE '%Hospital%' 
        OR c.name LIKE '%Pharm%' OR c.name LIKE '%Dental%' OR c.name LIKE '%Health%' 
        OR c.name LIKE '%Optic%'
      )
      AND NOT EXISTS (SELECT 1 FROM healthcare_provider_profiles hp WHERE hp.store_id = s.id)
    `).run().catch(() => {});

    // Auto-sync: Ensure all healthcare stores have queue settings (default to closed until owner starts queue)
    const today = new Date().toISOString().slice(0, 10);
    await db.prepare(`
      INSERT INTO healthcare_queue_settings 
        (store_id, status, consultation_minutes, current_token_number, next_token_number, service_date, opening_time, closing_time, maximum_daily_patients, updated_at)
      SELECT s.id, 'closed', 15, 0, 1, ?, '09:00', '21:00', 100, unixepoch()
      FROM stores s 
      JOIN healthcare_provider_profiles hp ON hp.store_id = s.id
      WHERE NOT EXISTS (SELECT 1 FROM healthcare_queue_settings qs WHERE qs.store_id = s.id)
    `).bind(today).run().catch(() => {});

    const params = url.searchParams;
    const conditions = [
      "(s.status = 'approved' OR s.status = 'active')",
      "(c.module = 'healthcare' OR c.slug IN ('clinics-doctors', 'pharmacies', 'dental-care', 'opticians', 'pet-care') OR c.name LIKE '%Clinic%' OR c.name LIKE '%Doctor%' OR c.name LIKE '%Hospital%' OR c.name LIKE '%Pharm%' OR c.name LIKE '%Dental%' OR c.name LIKE '%Health%' OR c.name LIKE '%Optic%' OR hp.store_id IS NOT NULL)",
      "(hp.verification_status = 'verified' OR hp.verification_status IS NULL)"
    ];
    const bindings: unknown[] = [];
    const type = params.get("type");
    if (type && HEALTHCARE_TYPES.includes(type as never)) {
      conditions.push(`(
        hp.provider_type = ? OR (
          hp.provider_type IS NULL AND (
            CASE 
              WHEN c.name LIKE '%Hospital%' OR s.name LIKE '%Hospital%' THEN 'hospital'
              WHEN c.name LIKE '%Dental%' OR s.name LIKE '%Dental%' THEN 'dental_clinic'
              WHEN c.name LIKE '%Pharm%' OR s.name LIKE '%Pharm%' OR s.name LIKE '%Medical%' THEN 'pharmacy'
              WHEN c.name LIKE '%Diagnostic%' OR c.name LIKE '%Lab%' OR s.name LIKE '%Diagnostic%' OR s.name LIKE '%Scan%' THEN 'diagnostic_lab'
              WHEN c.name LIKE '%Optic%' OR c.name LIKE '%Eye%' THEN 'eye_clinic'
              WHEN c.name LIKE '%Pet%' OR c.name LIKE '%Vet%' THEN 'veterinary_clinic'
              ELSE 'clinic'
            END
          ) = ?
        )
      )`);
      bindings.push(type, type);
    }
    const query = d1SearchText((params.get("q") ?? "").replace(/[%_]/g, "").trim());
    if (query) {
      const pattern = `%${query}%`;
      conditions.push("(s.name LIKE ? OR s.address LIKE ? OR c.name LIKE ? OR sc.name LIKE ?)");
      bindings.push(pattern, pattern, pattern, pattern);
    }
    if (params.get("queue") === "true") {
      conditions.push("COALESCE(hp.admin_queue_enabled, 1) = 1 AND COALESCE(hp.owner_queue_enabled, 1) = 1 AND COALESCE(qs.status, 'closed') = 'open'");
    }

    const result = await db.prepare(
      `SELECT s.id, s.name, s.slug, s.description, s.address, s.area, s.city, s.state,
        s.latitude, s.longitude, s.phone, s.whatsapp, s.rating_average AS rating,
        s.rating_count AS reviews, s.logo_url AS logoUrl, c.name AS category,
        sc.name AS subcategory,
        COALESCE(
          hp.provider_type,
          CASE 
            WHEN c.name LIKE '%Hospital%' OR s.name LIKE '%Hospital%' THEN 'hospital'
            WHEN c.name LIKE '%Dental%' OR s.name LIKE '%Dental%' THEN 'dental_clinic'
            WHEN c.name LIKE '%Pharm%' OR s.name LIKE '%Pharm%' OR s.name LIKE '%Medical%' THEN 'pharmacy'
            WHEN c.name LIKE '%Diagnostic%' OR c.name LIKE '%Lab%' OR s.name LIKE '%Diagnostic%' OR s.name LIKE '%Scan%' THEN 'diagnostic_lab'
            WHEN c.name LIKE '%Optic%' OR c.name LIKE '%Eye%' THEN 'eye_clinic'
            WHEN c.name LIKE '%Pet%' OR c.name LIKE '%Vet%' THEN 'veterinary_clinic'
            ELSE 'clinic'
          END
        ) AS providerType,
        COALESCE(hp.accepting_patients, 1) AS acceptingPatients,
        COALESCE(hp.emergency_available, 0) AS emergencyAvailable,
        COALESCE(hp.admin_queue_enabled, 1) AS adminQueueEnabled,
        COALESCE(hp.owner_queue_enabled, 1) AS ownerQueueEnabled,
        COALESCE(hp.queue_activation_status, 'approved') AS queueActivationStatus,
        COALESCE(hp.allow_appointments, 1) AS allowAppointments,
        CASE
          WHEN COALESCE(hp.owner_queue_enabled, 1) = 0 OR COALESCE(hp.admin_queue_enabled, 1) = 0 THEN 'no_queue'
          WHEN COALESCE(hp.accepting_patients, 1) = 0 THEN 'closed'
          ELSE COALESCE(qs.status, 'closed')
        END AS queueStatus,
        COALESCE((SELECT current.token_number FROM healthcare_queue_entries current
          WHERE current.store_id = s.id AND current.service_date = qs.service_date AND current.status = 'called' LIMIT 1), 0) AS currentTokenNumber,
        COALESCE(qs.consultation_minutes, 15) AS consultationMinutes,
        COALESCE(qs.opening_time, '09:00') AS openingTime,
        COALESCE(qs.closing_time, '21:00') AS closingTime,
        COALESCE(qs.maximum_daily_patients, 100) AS maximumDailyPatients,
        COALESCE((SELECT COUNT(*) FROM healthcare_queue_entries qe WHERE qe.store_id = s.id AND qe.service_date = qs.service_date AND qe.status = 'waiting'), 0) AS waitingCount
       FROM stores s JOIN categories c ON c.id = s.category_id
       LEFT JOIN categories sc ON sc.id = s.subcategory_id
       LEFT JOIN healthcare_provider_profiles hp ON hp.store_id = s.id
       LEFT JOIN healthcare_queue_settings qs ON qs.store_id = s.id
       WHERE ${conditions.join(" AND ")}
       ORDER BY CASE 
         WHEN COALESCE(hp.owner_queue_enabled, 1) = 1 AND COALESCE(hp.admin_queue_enabled, 1) = 1 AND COALESCE(qs.status, 'closed') = 'open' THEN 0 
         WHEN COALESCE(hp.owner_queue_enabled, 1) = 1 AND COALESCE(hp.admin_queue_enabled, 1) = 1 AND COALESCE(qs.status, 'closed') = 'paused' THEN 1 
         ELSE 2 
       END,
       s.rating_average DESC, s.rating_count DESC LIMIT 100`,
    ).bind(...bindings).all();

    const data = {
      items: result.results ?? [],
      types: HEALTHCARE_TYPES.map((value) => ({ value, label: HEALTHCARE_LABELS[value] })),
    };
    microCache.set(cacheKey, data, 1_000);
    return microCacheJson(data, "public, max-age=1, stale-while-revalidate=5");
  } catch (error) { return apiError(error); }
}

export async function HEAD(request: Request) {
  try {
    const storeId = new URL(request.url).searchParams.get("storeId");
    if (storeId) await patientQueueState(storeId);
    return new Response(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
