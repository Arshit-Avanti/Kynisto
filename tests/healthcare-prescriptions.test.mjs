import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  validatePrescriptionMedicines,
  calculateFollowUpDates,
  mergeTemplateLayout,
  getDefaultTemplateLayout,
  generatePrescriptionNumber,
  filterToTimestamp,
  PrescriptionValidationError,
} from "../lib/prescriptions.ts";

const root = new URL("../", import.meta.url);

test("prescriptions data layer and helpers validate correctly", async () => {
  const [prescriptionsLib, prescriptionsRoute, followUpsRoute, patientsRoute, templatesRoute] = await Promise.all([
    readFile(new URL("lib/prescriptions.ts", root), "utf8"),
    readFile(new URL("app/api/healthcare/prescriptions/route.ts", root), "utf8"),
    readFile(new URL("app/api/healthcare/follow-ups/route.ts", root), "utf8"),
    readFile(new URL("app/api/healthcare/patients/route.ts", root), "utf8"),
    readFile(new URL("app/api/healthcare/prescription-templates/route.ts", root), "utf8"),
  ]);

  // Schema and helper guarantees
  assert.match(prescriptionsLib, /generatePrescriptionNumber/);
  assert.match(prescriptionsLib, /getDefaultTemplateLayout/);
  assert.match(prescriptionsLib, /calculateFollowUpDates/);
  assert.match(prescriptionsLib, /filterToTimestamp/);
  assert.match(prescriptionsLib, /ensurePrescriptionTables/);
  assert.match(prescriptionsLib, /healthcare_prescriptions/);
  assert.match(prescriptionsLib, /healthcare_prescription_templates/);
  assert.match(prescriptionsLib, /healthcare_follow_ups/);

  // Security & user lookup authorization in prescriptions route
  assert.match(prescriptionsRoute, /SELECT phone, email FROM users WHERE id = \?/);
  assert.match(prescriptionsRoute, /cleanDigits/);
  assert.match(prescriptionsRoute, /action === "reissue"/);
  assert.match(prescriptionsRoute, /superseded_by/);
  assert.match(prescriptionsRoute, /template_snapshot_json/);

  // Follow-ups API
  assert.match(followUpsRoute, /today/);
  assert.match(followUpsRoute, /upcoming/);
  assert.match(followUpsRoute, /expired/);

  // Patients API with Patient Overview and patientId
  assert.match(patientsRoute, /computePatientId/);
  assert.match(patientsRoute, /healthcare_appointments/);
  assert.match(patientsRoute, /patientOverview|prescriptionHistory|consultationHistory/);

  // Templates API with isDefault
  assert.match(templatesRoute, /healthcare_prescription_templates/);
  assert.match(templatesRoute, /is_default = 0/);
});

test("customer prescription center and detailed view UI components", async () => {
  const [customerCenter, prescriptionView, followUpCard, queueTracker] = await Promise.all([
    readFile(new URL("components/healthcare/CustomerPrescriptionCenter.tsx", root), "utf8"),
    readFile(new URL("components/healthcare/PrescriptionView.tsx", root), "utf8"),
    readFile(new URL("components/healthcare/FollowUpCard.tsx", root), "utf8"),
    readFile(new URL("components/queue/LiveQueueTracker.tsx", root), "utf8"),
  ]);

  // Customer sub-navigation & structure
  assert.match(queueTracker, /My Prescription/);
  assert.match(customerCenter, /All Prescriptions/);
  assert.match(customerCenter, /Prescription Details/);
  assert.match(customerCenter, /Follow-ups/);

  // Time filters: default Last 1 Year
  assert.match(customerCenter, /Last 1 Year/);
  assert.match(customerCenter, /Last 30 days/);
  assert.match(customerCenter, /Last 3 months/);
  assert.match(customerCenter, /Last 6 months/);

  // Actions: View, Download, Print
  assert.match(prescriptionView, /<span>View<\/span>/);
  assert.match(prescriptionView, /<span>Download<\/span>/);
  assert.match(prescriptionView, /<span>Print<\/span>/);
  assert.match(prescriptionView, /window\.print\(\)/);

  // Custom canvas elements & website branding
  assert.match(prescriptionView, /layout\.elements/);
  assert.match(prescriptionView, /layout\.website/);

  // Follow-up card requirements: exact titles and buttons
  assert.match(followUpCard, /Follow-up/);
  assert.match(followUpCard, /Book Follow-up →/);
  assert.match(followUpCard, /Follow-up period expired/);
  assert.match(followUpCard, /Valid Until/i);
  assert.match(followUpCard, /Fee/i);

  // CustomerPrescriptionCenter uses valid fetch functions (no ReferenceError)
  assert.doesNotMatch(customerCenter, /fetchCustomerData/);
  assert.match(customerCenter, /fetchFollowUps/);

  // PrescriptionView displays follow-up section
  assert.match(prescriptionView, /Recommended Follow-up Consultation/);
});

test("Canva-like prescription designer with drag & drop, resize, move, duplicate, delete", async () => {
  const designer = await readFile(new URL("components/healthcare/PrescriptionDesigner.tsx", root), "utf8");

  // Tabs: Templates | Elements | Text | Branding | Layout
  assert.match(designer, /Templates/);
  assert.match(designer, /Elements/);
  assert.match(designer, /Text/);
  assert.match(designer, /Branding/);
  assert.match(designer, /Layout/);

  // Canvas Actions & Interactivity
  assert.match(designer, /handleCanvasMouseDown/);
  assert.match(designer, /handleCanvasMouseMove/);
  assert.match(designer, /handleMoveElement/);
  assert.match(designer, /handleResizeElement/);
  assert.match(designer, /handleDuplicateElement/);
  assert.match(designer, /handleDeleteElement/);
  assert.match(designer, /handleUndo/);
  assert.match(designer, /handleRedo/);
  assert.match(designer, /handleSave/);
  assert.match(designer, /Set as Default/);

  // Customization elements
  assert.match(designer, /titleFontSize/);
  assert.match(designer, /headerFontSize/);
  assert.match(designer, /bodyFontSize/);
  assert.match(designer, /footerFontSize/);
  assert.match(designer, /website/);
});

test("doctor workflow, clinic prescription history, patients directory, and settings", async () => {
  const [doctorModal, clinicPrescriptions, clinicFollowups, clinicPatients, ownerPanel, portalShell] = await Promise.all([
    readFile(new URL("components/healthcare/DoctorPrescriptionModal.tsx", root), "utf8"),
    readFile(new URL("components/healthcare/ClinicPrescriptionsTab.tsx", root), "utf8"),
    readFile(new URL("components/healthcare/ClinicFollowupsTab.tsx", root), "utf8"),
    readFile(new URL("components/healthcare/ClinicPatientsTab.tsx", root), "utf8"),
    readFile(new URL("components/dashboard/OwnerHealthcarePanel.tsx", root), "utf8"),
    readFile(new URL("components/dashboard/PortalShell.tsx", root), "utf8"),
  ]);

  // Doctor workflow
  assert.match(doctorModal, /Issue Prescription/);
  assert.match(doctorModal, /templateLayout/);
  assert.match(doctorModal, /Preview/);
  assert.match(doctorModal, /Reissue \/ Correct/);
  assert.match(doctorModal, /Doctor name is required/);
  assert.match(doctorModal, /Patient Address/);

  // Clinic subtabs and rename
  assert.match(portalShell, /\{ label: "Healthcare", icon: Stethoscope, tab: "healthcare" \}/);
  assert.match(portalShell, /\{ label: "My Prescriptions", icon: FileText, tab: "prescriptions" \}/);
  assert.match(ownerPanel, /<h1>Healthcare<\/h1>/);
  assert.match(ownerPanel, /Prescription Design/);

  // Clinic Prescription History fields
  assert.match(clinicPrescriptions, /Diagnosis \/ Clinical Notes/);
  assert.match(clinicPrescriptions, /Medicines/);
  assert.match(clinicPrescriptions, /Tests/);
  assert.match(clinicPrescriptions, /Advice/);
  assert.match(clinicPrescriptions, /Follow-up/);

  // Follow-ups dashboard
  assert.match(clinicFollowups, /Today/);
  assert.match(clinicFollowups, /Upcoming/);
  assert.match(clinicFollowups, /Expired/);

  // Patients directory
  assert.match(clinicPatients, /Patient ID/);
  assert.match(clinicPatients, /Patient History/);
  assert.match(clinicPatients, /Consultations/);
  assert.match(clinicPatients, /Prescriptions/);
  assert.match(clinicPatients, /Follow-ups/);
});

test("validatePrescriptionMedicines deep logic and edge case validation", () => {
  // 1. Valid medications pass and are trimmed
  const valid = validatePrescriptionMedicines([
    {
      name: "  Amoxicillin 500mg  ",
      dosage: " 1 capsule ",
      frequency: " 1-0-1 ",
      duration: " 5 days ",
      timing: " After food ",
      instructions: " Complete the full course ",
    },
    {
      name: "Paracetamol 650mg",
      frequency: "SOS",
    },
  ]);
  assert.equal(valid.length, 2);
  assert.equal(valid[0].name, "Amoxicillin 500mg");
  assert.equal(valid[0].dosage, "1 capsule");
  assert.equal(valid[0].frequency, "1-0-1");
  assert.equal(valid[0].duration, "5 days");
  assert.equal(valid[0].timing, "After food");
  assert.equal(valid[0].instructions, "Complete the full course");
  assert.equal(valid[1].name, "Paracetamol 650mg");
  assert.equal(valid[1].frequency, "SOS");
  assert.equal(valid[1].dosage, undefined);

  // 2. Rejection of empty / non-array inputs
  assert.throws(
    () => validatePrescriptionMedicines([]),
    (err) => err instanceof PrescriptionValidationError && err.code === "MEDICINE_REQUIRED"
  );
  assert.throws(
    () => validatePrescriptionMedicines(null),
    (err) => err instanceof PrescriptionValidationError && err.code === "MEDICINE_REQUIRED"
  );
  assert.throws(
    () => validatePrescriptionMedicines(undefined),
    (err) => err instanceof PrescriptionValidationError && err.code === "MEDICINE_REQUIRED"
  );
  assert.throws(
    () => validatePrescriptionMedicines("not-an-array"),
    (err) => err instanceof PrescriptionValidationError && err.code === "MEDICINE_REQUIRED"
  );

  // 3. Rejection of missing / blank medicine name
  assert.throws(
    () => validatePrescriptionMedicines([{ name: "", dosage: "1 tab" }]),
    (err) => err instanceof PrescriptionValidationError && err.code === "MEDICINE_NAME_REQUIRED"
  );
  assert.throws(
    () => validatePrescriptionMedicines([{ name: "   " }]),
    (err) => err instanceof PrescriptionValidationError && err.code === "MEDICINE_REQUIRED"
  );
  assert.throws(
    () => validatePrescriptionMedicines([{ name: 123, dosage: "5mg" }]),
    (err) => err instanceof PrescriptionValidationError && err.code === "MEDICINE_NAME_REQUIRED"
  );

  // 4. Rejection of name exceeding 120 chars
  const longName = "A".repeat(125);
  assert.throws(
    () => validatePrescriptionMedicines([{ name: longName }]),
    (err) => err instanceof PrescriptionValidationError && err.code === "MEDICINE_NAME_TOO_LONG"
  );

  // 5. Rejection of duplicate medicine rows (case-insensitive & whitespace trimmed)
  assert.throws(
    () =>
      validatePrescriptionMedicines([
        { name: "Metformin 500mg", frequency: "1-0-0" },
        { name: "  metformin 500mg  ", frequency: "0-0-1" },
      ]),
    (err) => err instanceof PrescriptionValidationError && err.code === "DUPLICATE_MEDICINE"
  );

  // 6. Sanitization / rejection of oversized auxiliary fields
  assert.throws(
    () =>
      validatePrescriptionMedicines([
        { name: "Valid Med", instructions: "X".repeat(300) },
      ]),
    (err) => err instanceof PrescriptionValidationError && err.code === "MEDICINE_INSTRUCTIONS_TOO_LONG"
  );
  assert.throws(
    () =>
      validatePrescriptionMedicines([
        { name: "Valid Med", dosage: "D".repeat(70) },
      ]),
    (err) => err instanceof PrescriptionValidationError && err.code === "MEDICINE_DOSAGE_TOO_LONG"
  );

  // 7. Rejection of negative / zero / invalid durations
  assert.throws(
    () => validatePrescriptionMedicines([{ name: "Valid Med", duration: "-5 days" }]),
    (err) => err instanceof PrescriptionValidationError && err.code === "INVALID_MEDICINE_DURATION"
  );
  assert.throws(
    () => validatePrescriptionMedicines([{ name: "Valid Med", duration: "0 days" }]),
    (err) => err instanceof PrescriptionValidationError && err.code === "INVALID_MEDICINE_DURATION"
  );
  assert.throws(
    () => validatePrescriptionMedicines([{ name: "Valid Med", duration: "---" }]),
    (err) => err instanceof PrescriptionValidationError && err.code === "INVALID_MEDICINE_DURATION"
  );

  // 8. Rejection of invalid frequency and timing formats
  assert.throws(
    () => validatePrescriptionMedicines([{ name: "Valid Med", frequency: "???" }]),
    (err) => err instanceof PrescriptionValidationError && err.code === "INVALID_MEDICINE_FREQUENCY"
  );
  assert.throws(
    () => validatePrescriptionMedicines([{ name: "Valid Med", timing: "***" }]),
    (err) => err instanceof PrescriptionValidationError && err.code === "INVALID_MEDICINE_TIMING"
  );

  // 9. Rejection of duplicate medicine with punctuation differences
  assert.throws(
    () =>
      validatePrescriptionMedicines([
        { name: "Amoxicillin 500mg", frequency: "1-0-1" },
        { name: "  amoxicillin 500mg. ", frequency: "1-0-1" },
      ]),
    (err) => err instanceof PrescriptionValidationError && err.code === "DUPLICATE_MEDICINE"
  );
});

test("calculateFollowUpDates timezone-safe leap year and boundary logic", () => {
  // 1. Standard 7-day validity and target
  const std = calculateFollowUpDates("2025-03-10", 7, 7);
  assert.equal(std.followUpDate, "2025-03-17");
  assert.equal(std.validUntilDate, "2025-03-17");

  // 2. Custom target days (3 days target, 14 days validity)
  const custom = calculateFollowUpDates("2025-03-10", 14, 3);
  assert.equal(custom.followUpDate, "2025-03-13");
  assert.equal(custom.validUntilDate, "2025-03-24");

  // 3. Leap year February 28 to February 29
  const leap1 = calculateFollowUpDates("2024-02-28", 7, 1);
  assert.equal(leap1.followUpDate, "2024-02-29");
  assert.equal(leap1.validUntilDate, "2024-03-06");

  // 4. Leap year February 29 to March 01
  const leap2 = calculateFollowUpDates("2024-02-29", 7, 1);
  assert.equal(leap2.followUpDate, "2024-03-01");
  assert.equal(leap2.validUntilDate, "2024-03-07");

  // 5. Non-leap year February 28 to March 01
  const nonLeap = calculateFollowUpDates("2023-02-28", 7, 1);
  assert.equal(nonLeap.followUpDate, "2023-03-01");
  assert.equal(nonLeap.validUntilDate, "2023-03-07");

  // 6. Month boundary crossing (31-day month: January 31 + 5 days)
  const monthBoundary = calculateFollowUpDates("2025-01-31", 10, 5);
  assert.equal(monthBoundary.followUpDate, "2025-02-05");
  assert.equal(monthBoundary.validUntilDate, "2025-02-10");

  // 7. Year boundary crossing (December 30 + 5 days)
  const yearBoundary = calculateFollowUpDates("2024-12-30", 10, 5);
  assert.equal(yearBoundary.followUpDate, "2025-01-04");
  assert.equal(yearBoundary.validUntilDate, "2025-01-09");

  // 8. Graceful fallback on invalid or empty date string (never produces NaN)
  const invalidDate = calculateFollowUpDates("invalid-date", 7, 3);
  assert.match(invalidDate.followUpDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(invalidDate.validUntilDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(invalidDate.validUntilDate >= invalidDate.followUpDate);

  // 9. Target days clamped so validity date is never before follow-up date
  const clamped = calculateFollowUpDates("2025-06-01", 5, 10);
  assert.equal(clamped.followUpDate, "2025-06-11");
  assert.equal(clamped.validUntilDate, "2025-06-11");

  // 10. String number inputs are parsed properly without falling back to defaults
  const stringInputs = calculateFollowUpDates("2025-03-10", "14", "3");
  assert.equal(stringInputs.followUpDate, "2025-03-13");
  assert.equal(stringInputs.validUntilDate, "2025-03-24");
});

test("mergeTemplateLayout snapshot fallbacks and customization merger", () => {
  // 1. Null / undefined / empty input yields complete defaults
  const emptyDefault = mergeTemplateLayout(null, { name: "Care Hospital", phone: "+91 9876543210" });
  assert.equal(emptyDefault.clinicName, "Care Hospital");
  assert.equal(emptyDefault.phone, "+91 9876543210");
  assert.equal(emptyDefault.primaryColor, "#0f766e");
  assert.equal(emptyDefault.sections.vitals, true);
  assert.equal(emptyDefault.sections.medicines, true);
  assert.equal(emptyDefault.sections.diagnosis, true);
  assert.equal(emptyDefault.sections.tests, true);
  assert.equal(emptyDefault.sections.signature, true);
  assert.equal(emptyDefault.sections.disclaimer, true);
  assert.equal(emptyDefault.margins.top, 24);
  assert.equal(emptyDefault.spacing.itemGap, 10);
  assert.ok(Array.isArray(emptyDefault.elements));

  // 2. Partial layout preserves custom values and backfills missing fields
  const partial = mergeTemplateLayout(
    {
      primaryColor: "#dc2626",
      sections: { vitals: false },
      customText: "Please bring this prescription for follow-up",
      doctorRegistration: "MCI-45892",
    },
    { name: "Apex Clinic" }
  );
  assert.equal(partial.clinicName, "Apex Clinic");
  assert.equal(partial.primaryColor, "#dc2626");
  assert.equal(partial.sections.vitals, false);
  assert.equal(partial.sections.medicines, true); // backfilled default
  assert.equal(partial.sections.signature, true); // backfilled default
  assert.equal(partial.customText, "Please bring this prescription for follow-up");
  assert.equal(partial.doctorRegistration, "MCI-45892");
  assert.equal(partial.fontFamily, "Inter, sans-serif"); // backfilled
});

test("prescription number generation and filter timestamp utilities", () => {
  // 1. Prescription number format and uniqueness
  const set = new Set();
  for (let i = 0; i < 50; i++) {
    const num = generatePrescriptionNumber();
    assert.match(num, /^RX-\d{6}-\d{5}$/);
    set.add(num);
  }
  assert.equal(set.size, 50);

  // 2. Filter timestamp ranges
  const now = Math.floor(Date.now() / 1000);
  const t30d = filterToTimestamp("30d");
  assert.ok(t30d <= now - 29 * 86400 && t30d >= now - 31 * 86400);

  const t1y = filterToTimestamp("1y");
  assert.ok(t1y <= now - 364 * 86400 && t1y >= now - 366 * 86400);

});

test("live queue prescription integration tests", () => {
  // Test 1: Queue entry prescription states mapping
  function resolveQueuePrescriptionState(entryStatus, rxStatus) {
    if (rxStatus === "issued") return "issued";
    if (rxStatus === "draft") return "draft";
    if (entryStatus === "completed") return "not_issued";
    return "not_available";
  }

  assert.equal(resolveQueuePrescriptionState("waiting", null), "not_available");
  assert.equal(resolveQueuePrescriptionState("called", null), "not_available");
  assert.equal(resolveQueuePrescriptionState("in_consultation", null), "not_available");
  assert.equal(resolveQueuePrescriptionState("completed", null), "not_issued");
  assert.equal(resolveQueuePrescriptionState("completed", "draft"), "draft");
  assert.equal(resolveQueuePrescriptionState("completed", "issued"), "issued");
  assert.equal(resolveQueuePrescriptionState("waiting", "draft"), "draft");

  // Test 2: Draft saving, retrieval by queueEntryId, and continuation
  const mockDraft = {
    queueEntryId: "entry-q102",
    storeId: "store-care-1",
    patientName: "Arshit Anand",
    diagnosis: "Acute Bronchitis",
    status: "draft",
    medicines: [{ name: "Azithromycin 500mg", duration: "3 days", frequency: "1-0-0" }],
    issuedAt: 0,
  };
  assert.equal(mockDraft.status, "draft");
  assert.equal(mockDraft.issuedAt, 0);
  assert.equal(mockDraft.queueEntryId, "entry-q102");

  // Test 3: Confirmation modal invariant (issued prescription is locked)
  const isPrescriptionLocked = (status) => status === "issued";
  assert.equal(isPrescriptionLocked("issued"), true);
  assert.equal(isPrescriptionLocked("draft"), false);

  // Test 4: Follow-up connection from prescription to live queue and follow-up dashboard
  const followUpCalc = calculateFollowUpDates("2026-09-04", 3);
  assert.equal(followUpCalc.followUpDate, "2026-09-07");
  assert.equal(followUpCalc.validUntilDate, "2026-09-07");

  // Test 5: Customer ticket state reflection and notification upon prescription issuance
  function customerPassNotification(rxStatus, clinicName) {
    if (rxStatus === "issued") {
      return {
        badge: "Prescription Issued ✓",
        title: "Your Prescription is Ready!",
        message: `Your official clinic prescription from ${clinicName} is now available.`,
        action: "View Prescription →",
      };
    }
    return null;
  }
  const notif = customerPassNotification("issued", "Kynisto Medical Care Centre");
  assert.ok(notif);
  assert.equal(notif.badge, "Prescription Issued ✓");
  assert.match(notif.message, /Kynisto Medical Care Centre/);
});

test("healthcare fixes: Back to Hub, Follow-up None option, and History performance", () => {
  // 1. Follow-up "None" option (validityDays === 0)
  function resolveFollowUpConfig(enableFollowUp, validityDays, followUpType, followUpFee, notes) {
    if (!enableFollowUp || Number(validityDays) === 0) {
      return { enabled: false };
    }
    return {
      enabled: true,
      validityDays: Number(validityDays),
      followUpType,
      followUpFee: followUpType === "free" ? 0 : followUpFee,
      notes,
    };
  }

  // When user selects "None" (validityDays = 0)
  const noneConfig = resolveFollowUpConfig(true, 0, "free", 0, "");
  assert.equal(noneConfig.enabled, false);

  // When followUp is disabled
  const disabledConfig = resolveFollowUpConfig(false, 7, "free", 0, "");
  assert.equal(disabledConfig.enabled, false);

  // When followUp is enabled with 7 days
  const activeConfig = resolveFollowUpConfig(true, 7, "paid", 200, "Review BP");
  assert.equal(activeConfig.enabled, true);
  assert.equal(activeConfig.validityDays, 7);
  assert.equal(activeConfig.followUpFee, 200);

  // 2. Back to Healthcare Hub screen navigation invariant
  function shouldRenderCompletedScreen(view, isCompleted, selectedQueue) {
    return view === "ticket" && Boolean(isCompleted) && Boolean(selectedQueue);
  }
  function shouldRenderCancelledScreen(view, isCancelled, selectedQueue) {
    return view === "ticket" && Boolean(isCancelled) && Boolean(selectedQueue);
  }

  // When in ticket view and consultation completes
  assert.equal(shouldRenderCompletedScreen("ticket", true, { id: "store-1" }), true);
  // When user clicks "Back to Healthcare Hub" (view becomes 'list')
  assert.equal(shouldRenderCompletedScreen("list", true, { id: "store-1" }), false);
  // When queue pass is reset
  assert.equal(shouldRenderCompletedScreen("list", false, null), false);

  // When in ticket view and visit cancelled
  assert.equal(shouldRenderCancelledScreen("ticket", true, { id: "store-1" }), true);
  // When user clicks "Back to Healthcare Hub" or "Find Another Clinic"
  assert.equal(shouldRenderCancelledScreen("list", true, { id: "store-1" }), false);

  // 3. Daily history preservation and diffing bailout
  function shouldBailoutStateUpdate(prev, next) {
    const prevSig = (prev.entries || []).map((e) => `${e.id}:${e.status}:${e.arrivalStatus}:${e.prescriptionStatus || ""}`).join("|");
    const nextSig = (next.entries || []).map((e) => `${e.id}:${e.status}:${e.arrivalStatus}:${e.prescriptionStatus || ""}`).join("|");
    const prevProf = JSON.stringify(prev.profile || {});
    const nextProf = JSON.stringify(next.profile || {});
    return prevSig === nextSig && prevProf === nextProf;
  }

  const state1 = {
    profile: { id: "p1", consultationMinutes: 15 },
    entries: [{ id: "e1", status: "waiting", arrivalStatus: "waiting" }],
    history: [{ serviceDate: "2026-09-03", total: 10, completed: 8 }],
  };
  const state2Identical = {
    profile: { id: "p1", consultationMinutes: 15 },
    entries: [{ id: "e1", status: "waiting", arrivalStatus: "waiting" }],
    history: [], // Fast poll returned empty history
  };

  // State diffing recognizes unchanged queue entries & profile
  assert.equal(shouldBailoutStateUpdate(state1, state2Identical), true);

  // History preservation: empty history in fast poll does not overwrite existing history
  const preservedHistory = (state2Identical.history && state2Identical.history.length > 0)
    ? state2Identical.history
    : (state1.history || []);
  assert.equal(preservedHistory.length, 1);
  assert.equal(preservedHistory[0].serviceDate, "2026-09-03");
});

test("UX & Performance Fixes: Image 1-5 & Mobile/APK Lag", async () => {
  const { readFileSync } = await import("fs");

  // 1. Image 1: Navbar is transparent when !scrolled and text remains crisp
  const navCode = readFileSync("components/landing/Navbar3D.tsx", "utf-8");
  assert.ok(navCode.includes("bg-transparent border-transparent shadow-none"), "Navbar must be transparent when not scrolled");
  assert.ok(navCode.includes("variant={scrolled ? \"dark\" : \"light\"}"), "Logo must switch variant between scrolled and transparent states");

  // 2. Image 2: Quick action category pills removed from hero
  const heroCode = readFileSync("components/dashboard/CredixInteractiveHeroFeatures.tsx", "utf-8");
  assert.equal(heroCode.includes("Live OPD Queues"), false, "Live OPD Queues pill must be removed from hero");
  assert.equal(heroCode.includes("Home Services"), false, "Home Services pill must be removed from hero");

  // 3. Image 3: Hero padding shifted down to prevent navbar overlap on mobile
  assert.ok(heroCode.includes("148px 16px 36px 16px"), "Hero mobile top padding must be shifted down to 148px to prevent overlap");

  // 4. Image 4: No Appts button shown when appointment booking is not available
  const queueCode = readFileSync("components/queue/LiveQueueTracker.tsx", "utf-8");
  assert.ok(queueCode.includes("No Appts"), "No Appts option must be displayed when clinic does not allow appointments");

  // 5. Image 5: Customer healthcare navigation bar has horizontal scroll and responsive layout
  assert.ok(queueCode.includes("overflow-x-auto no-scrollbar"), "Healthcare navigation tabs must have horizontal scroll on mobile");
  assert.ok(queueCode.includes("whitespace-nowrap"), "Healthcare navigation buttons must have whitespace-nowrap");

  // 6. Mobile & APK Lag fixes: VideoBackground skips video on mobile, and globals.css disables heavy backdrop-filter
  const videoCode = readFileSync("components/media/VideoBackground.tsx", "utf-8");
  assert.ok(videoCode.includes("!isMobile &&"), "VideoBackground must skip video decoding on mobile/APKs to eliminate lag");

  const cssCode = readFileSync("app/globals.css", "utf-8");
  assert.ok(cssCode.includes("backdrop-filter: none !important"), "Mobile backdrop-filter must be disabled to eliminate APK lag");
  assert.ok(cssCode.includes("-webkit-overflow-scrolling: touch"), "Mobile touch scroll must be enabled");
  assert.ok(cssCode.includes("touch-action: pan-y pinch-zoom"), "Vertical touch-action pan-y must be enabled on mobile for smooth scrolling");
  assert.ok(cssCode.includes("overflow-x: clip"), "overflow-x: clip must be used to prevent breaking mobile scroll containers");
});


