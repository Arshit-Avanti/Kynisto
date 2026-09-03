import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

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
  assert.match(clinicPatients, /Patient Overview/);
  assert.match(clinicPatients, /Basic Patient Information/);
  assert.match(clinicPatients, /Consultation History/);
  assert.match(clinicPatients, /Prescription History/);
  assert.match(clinicPatients, /Follow-up History/);
});
