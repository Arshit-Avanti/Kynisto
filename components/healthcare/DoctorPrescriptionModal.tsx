"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Stethoscope,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  AlertCircle,
  FileText,
  Activity,
  Eye,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import {
  getDefaultTemplateLayout,
  type PrescriptionMedicine,
  type PrescriptionVitals,
  type PrescriptionRecord,
  type PrescriptionTemplateLayout,
} from "@/lib/prescriptions";
import { PrescriptionView } from "./PrescriptionView";

interface Doctor {
  id: string;
  name: string;
  specialization?: string;
  consultationMinutes?: number;
  consultationFee?: number;
}

interface DoctorPrescriptionModalProps {
  storeId: string;
  storeName: string;
  onClose: () => void;
  onSuccess: (prescriptionId: string, rxNumber: string) => void;
  // Pre-fill fields if issued from queue or appointment
  initialPatientName?: string;
  initialPatientPhone?: string;
  queueEntryId?: string;
  appointmentId?: string;
  doctors?: Doctor[];
  // For Reissue / Correction mode
  reissueTarget?: PrescriptionRecord | null;
}

export function DoctorPrescriptionModal({
  storeId,
  storeName,
  onClose,
  onSuccess,
  initialPatientName = "",
  initialPatientPhone = "",
  queueEntryId,
  appointmentId,
  doctors = [],
  reissueTarget,
}: DoctorPrescriptionModalProps) {
  const isReissue = Boolean(reissueTarget);

  // Form step: "edit" | "preview"
  const [step, setStep] = useState<"edit" | "preview">("edit");

  // Medical form state
  const [doctorId, setDoctorId] = useState<string>(
    reissueTarget?.doctorId || (doctors[0]?.id ? String(doctors[0].id) : "")
  );
  const [doctorName, setDoctorName] = useState<string>(
    reissueTarget?.doctorName || (doctors[0]?.name || "Doctor")
  );
  const [doctorSpecialization, setDoctorSpecialization] = useState<string>(
    reissueTarget?.doctorSpecialization || (doctors[0]?.specialization || "General Medicine")
  );

  const [patientName, setPatientName] = useState<string>(
    reissueTarget?.patientName || initialPatientName || ""
  );
  const [patientPhone, setPatientPhone] = useState<string>(
    reissueTarget?.patientPhone || initialPatientPhone || ""
  );
  const [patientAge, setPatientAge] = useState<string>(
    reissueTarget?.patientAge ? String(reissueTarget.patientAge) : ""
  );
  const [patientGender, setPatientGender] = useState<string>(
    reissueTarget?.patientGender || "Male"
  );
  const [patientAddress, setPatientAddress] = useState<string>(
    reissueTarget?.patientAddress || ""
  );

  // Vitals
  const [vitals, setVitals] = useState<PrescriptionVitals>(
    reissueTarget?.vitals || {
      bp: "120/80",
      pulse: "76",
      temperature: "98.4°F",
      weight: "",
      spo2: "99",
      height: "",
    }
  );

  const [symptoms, setSymptoms] = useState<string>(reissueTarget?.symptoms || "");
  const [diagnosis, setDiagnosis] = useState<string>(reissueTarget?.diagnosis || "");
  const [advice, setAdvice] = useState<string>(reissueTarget?.advice || "");

  // Medicines
  const [medicines, setMedicines] = useState<PrescriptionMedicine[]>(
    reissueTarget?.medicines?.length
      ? reissueTarget.medicines
      : [
          {
            name: "Paracetamol 650mg",
            dosage: "1 Tab",
            frequency: "1-0-1",
            duration: "3 days",
            timing: "After food",
            instructions: "Take SOS if fever > 100°F",
          },
        ]
  );

  // Tests
  const [testsInput, setTestsInput] = useState<string>(
    reissueTarget?.tests?.join(", ") || ""
  );

  // Follow-up
  const [enableFollowUp, setEnableFollowUp] = useState<boolean>(true);
  const [validityDays, setValidityDays] = useState<number>(7);
  const [followUpType, setFollowUpType] = useState<"free" | "paid" | "discounted">("free");
  const [followUpFee, setFollowUpFee] = useState<number>(0);
  const [followUpNotes, setFollowUpNotes] = useState<string>("");

  // Clinic template layout for preview
  const [templateLayout, setTemplateLayout] = useState<PrescriptionTemplateLayout>(() =>
    reissueTarget?.templateSnapshot || getDefaultTemplateLayout({ name: storeName })
  );

  useEffect(() => {
    if (reissueTarget?.templateSnapshot) return;
    let mounted = true;
    apiFetch<{ template?: { layout?: PrescriptionTemplateLayout } }>(
      `/api/healthcare/prescription-templates?storeId=${encodeURIComponent(storeId)}`
    )
      .then((res) => {
        if (mounted && res?.template?.layout) {
          setTemplateLayout(res.template.layout);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [storeId, reissueTarget]);

  // Correction reason (for reissue)
  const [correctionReason, setCorrectionReason] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update doctor details when doctor selected
  const handleDoctorChange = (selectedId: string) => {
    setDoctorId(selectedId);
    const doc = doctors.find((d) => String(d.id) === selectedId);
    if (doc) {
      setDoctorName(doc.name);
      setDoctorSpecialization(doc.specialization || "Consultant Physician");
    }
  };

  const handleAddMedicine = () => {
    setMedicines((prev) => [
      ...prev,
      {
        name: "",
        dosage: "1 Tab",
        frequency: "1-0-1",
        duration: "5 days",
        timing: "After food",
        instructions: "",
      },
    ]);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateMedicine = (index: number, field: keyof PrescriptionMedicine, value: string) => {
    setMedicines((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Build temporary PrescriptionRecord for Preview
  const previewRecord: PrescriptionRecord = {
    id: reissueTarget?.id || "preview-id",
    prescriptionNumber: reissueTarget?.prescriptionNumber || "RX-PREVIEW-001",
    storeId,
    storeName,
    doctorId,
    doctorName,
    doctorSpecialization,
    patientName: patientName || "Patient Name",
    patientPhone,
    patientAge: patientAge ? parseInt(patientAge, 10) : undefined,
    patientGender,
    patientAddress,
    vitals,
    symptoms,
    diagnosis,
    medicines: medicines.filter((m) => m.name.trim().length > 0),
    tests: testsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    advice,
    templateSnapshot: templateLayout,
    status: "issued",
    issuedAt: Math.floor(Date.now() / 1000),
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000),
  };

  const handleSubmit = async () => {
    setError(null);
    if (!patientName.trim()) {
      setError("Patient name is required.");
      return;
    }
    const validMedicines = medicines.filter((m) => m.name.trim().length > 0);
    if (validMedicines.length === 0) {
      setError("Please add at least one valid medication.");
      return;
    }
    if (isReissue && !correctionReason.trim()) {
      setError("Please provide a reason for reissuing / correcting this prescription.");
      return;
    }

    setSubmitting(true);
    try {
      if (isReissue && reissueTarget) {
        // Reissue Flow
        const res = await apiFetch<{ ok: boolean; newPrescriptionId: string; newPrescriptionNumber: string }>(
          "/api/healthcare/prescriptions",
          {
            method: "PATCH",
            json: {
              action: "reissue",
              storeId,
              prescriptionId: reissueTarget.id,
              correctionReason,
              doctorName,
              doctorSpecialization,
              patientName,
              patientPhone,
              patientAge: patientAge ? parseInt(patientAge, 10) : undefined,
              patientGender,
              vitals,
              symptoms,
              diagnosis,
              medicines: validMedicines,
              tests: testsInput.split(",").map((t) => t.trim()).filter(Boolean),
              advice,
            },
          }
        );
        onSuccess(res.newPrescriptionId, res.newPrescriptionNumber);
      } else {
        // Create & Issue Flow
        const res = await apiFetch<{ ok: boolean; prescriptionId: string; prescriptionNumber: string }>(
          "/api/healthcare/prescriptions",
          {
            method: "POST",
            json: {
              storeId,
              doctorId: doctorId || undefined,
              doctorName,
              doctorSpecialization,
              patientName,
              patientPhone,
              patientAge: patientAge ? parseInt(patientAge, 10) : undefined,
              patientGender,
              patientAddress,
              queueEntryId,
              appointmentId,
              vitals,
              symptoms,
              diagnosis,
              medicines: validMedicines,
              tests: testsInput.split(",").map((t) => t.trim()).filter(Boolean),
              advice,
              followUp: enableFollowUp
                ? {
                    enabled: true,
                    validityDays,
                    followUpType,
                    followUpFee: followUpType === "free" ? 0 : followUpFee,
                    notes: followUpNotes,
                  }
                : undefined,
            },
          }
        );
        onSuccess(res.prescriptionId, res.prescriptionNumber);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to issue prescription.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-white">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black leading-tight">
                {isReissue ? "Reissue / Correct Prescription" : "Create & Issue Prescription"}
              </h2>
              <p className="text-xs text-white/80 font-medium">
                {storeName} • {isReissue ? `Correcting #${reissueTarget?.prescriptionNumber}` : "Official Digital Rx Record"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step === "preview" ? (
              <button
                type="button"
                onClick={() => setStep("edit")}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep("preview")}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview Rx</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === "preview" ? (
            <div>
              <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  This is a live preview using your clinic&apos;s saved prescription template.
                  Review all medical details before issuing.
                </span>
              </div>
              <PrescriptionView prescription={previewRecord} showActions={false} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* If Reissue: Show Reason Input */}
              {isReissue && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <label className="block text-xs font-black uppercase tracking-wider text-amber-900 mb-1.5">
                    Correction Reason (Required for Audit Trail) *
                  </label>
                  <input
                    type="text"
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="e.g., Adjusted antibiotic dosage to 500mg, Corrected medicine frequency"
                    className="w-full bg-white border border-amber-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    required
                  />
                  <p className="text-[11px] font-medium text-amber-700 mt-1">
                    The previous prescription will be marked as superseded. A new audited version will be issued to the patient.
                  </p>
                </div>
              )}

              {/* Doctor & Patient Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                    Doctor Details
                  </h3>
                  {doctors.length > 0 ? (
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Select Doctor</label>
                      <select
                        value={doctorId}
                        onChange={(e) => handleDoctorChange(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none"
                      >
                        {doctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            Dr. {d.name} {d.specialization ? `(${d.specialization})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Doctor Name</label>
                      <input
                        type="text"
                        value={doctorName}
                        onChange={(e) => setDoctorName(e.target.value)}
                        placeholder="Dr. Sharma"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-800"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Specialization</label>
                    <input
                      type="text"
                      value={doctorSpecialization}
                      onChange={(e) => setDoctorSpecialization(e.target.value)}
                      placeholder="General Medicine / Cardiology"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-teal-600" />
                    Patient Details
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Patient Name *</label>
                      <input
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        placeholder="+91 98765..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Age</label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        placeholder="e.g. 35"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Gender</label>
                      <select
                        value={patientGender}
                        onChange={(e) => setPatientGender(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Vitals Strip */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900 mb-3 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  Patient Vitals (Optional)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">BP (mmHg)</label>
                    <input
                      type="text"
                      value={vitals.bp || ""}
                      onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                      placeholder="120/80"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Pulse (bpm)</label>
                    <input
                      type="text"
                      value={vitals.pulse || ""}
                      onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                      placeholder="76"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Temp</label>
                    <input
                      type="text"
                      value={vitals.temperature || ""}
                      onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                      placeholder="98.6°F"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Weight (kg)</label>
                    <input
                      type="text"
                      value={vitals.weight || ""}
                      onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                      placeholder="68"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">SpO2 (%)</label>
                    <input
                      type="text"
                      value={vitals.spo2 || ""}
                      onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                      placeholder="99"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Height</label>
                    <input
                      type="text"
                      value={vitals.height || ""}
                      onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
                      placeholder="175 cm"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Symptoms & Diagnosis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                    Chief Complaints & Symptoms
                  </label>
                  <textarea
                    rows={2}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="e.g., High fever since 2 days, sore throat, mild dry cough"
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                    Clinical Diagnosis & Notes
                  </label>
                  <textarea
                    rows={2}
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g., Acute upper respiratory tract infection, viral pharyngitis"
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Prescribed Medications (Rx) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <span className="font-serif font-black text-lg text-emerald-700">℞</span>
                    Prescribed Medications ({medicines.length}) *
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddMedicine}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Medicine</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {medicines.map((med, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs items-center shadow-2xs"
                    >
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={med.name}
                          onChange={(e) => handleUpdateMedicine(idx, "name", e.target.value)}
                          placeholder="Medicine name (e.g. Amoxicillin 500mg)"
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-900"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={med.dosage || ""}
                          onChange={(e) => handleUpdateMedicine(idx, "dosage", e.target.value)}
                          placeholder="Dosage (1 Tab)"
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <select
                          value={med.frequency || "1-0-1"}
                          onChange={(e) => handleUpdateMedicine(idx, "frequency", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 font-bold"
                        >
                          <option value="1-0-1">1-0-1 (Morning-Night)</option>
                          <option value="1-1-1">1-1-1 (TDS)</option>
                          <option value="1-0-0">1-0-0 (Morning only)</option>
                          <option value="0-0-1">0-0-1 (Night only)</option>
                          <option value="SOS">SOS (When needed)</option>
                          <option value="Once daily">Once daily</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={med.duration || ""}
                          onChange={(e) => handleUpdateMedicine(idx, "duration", e.target.value)}
                          placeholder="Duration (5 days)"
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <select
                          value={med.timing || "After food"}
                          onChange={(e) => handleUpdateMedicine(idx, "timing", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-1 py-1.5 text-[11px]"
                        >
                          <option value="After food">After food</option>
                          <option value="Before food">Before food</option>
                          <option value="With food">With food</option>
                        </select>
                      </div>
                      <div className="sm:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicine(idx)}
                          disabled={medicines.length <= 1}
                          className="p-1.5 text-rose-500 hover:text-rose-700 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lab Tests & Dietary Advice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Diagnostic Lab Tests / Investigations
                  </label>
                  <input
                    type="text"
                    value={testsInput}
                    onChange={(e) => setTestsInput(e.target.value)}
                    placeholder="Comma separated (e.g. CBC, Serum Electrolytes, Chest X-Ray)"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Dietary & Lifestyle Advice
                  </label>
                  <input
                    type="text"
                    value={advice}
                    onChange={(e) => setAdvice(e.target.value)}
                    placeholder="e.g., Drink warm fluids, avoid cold beverages, adequate bed rest"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* Follow-up Section */}
              {!isReissue && (
                <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="enableFollowUp"
                        checked={enableFollowUp}
                        onChange={(e) => setEnableFollowUp(e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                      />
                      <label htmlFor="enableFollowUp" className="text-xs font-black uppercase tracking-wider text-teal-900 cursor-pointer">
                        Schedule Follow-up Consultation
                      </label>
                    </div>

                    {enableFollowUp && (
                      <span className="text-[11px] font-bold text-teal-700">
                        Valid for {validityDays} days from today
                      </span>
                    )}
                  </div>

                  {enableFollowUp && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Follow-up Validity</label>
                        <select
                          value={validityDays}
                          onChange={(e) => setValidityDays(Number(e.target.value))}
                          className="w-full bg-white border border-teal-300 rounded-xl px-3 py-2 text-slate-800 font-bold"
                        >
                          <option value="1">1 day</option>
                          <option value="3">3 days</option>
                          <option value="5">5 days</option>
                          <option value="7">7 days (Recommended)</option>
                          <option value="14">14 days</option>
                          <option value="30">30 days</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Follow-up Type</label>
                        <select
                          value={followUpType}
                          onChange={(e) => setFollowUpType(e.target.value as any)}
                          className="w-full bg-white border border-teal-300 rounded-xl px-3 py-2 text-slate-800 font-bold"
                        >
                          <option value="free">Free (Complimentary)</option>
                          <option value="discounted">Discounted Follow-up</option>
                          <option value="paid">Standard Paid</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Follow-up Fee (₹)</label>
                        <input
                          type="number"
                          disabled={followUpType === "free"}
                          value={followUpType === "free" ? 0 : followUpFee}
                          onChange={(e) => setFollowUpFee(Number(e.target.value))}
                          placeholder="0"
                          className="w-full bg-white border border-teal-300 rounded-xl px-3 py-2 text-slate-800 font-bold disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 flex-wrap gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {step === "edit" ? (
              <button
                type="button"
                onClick={() => setStep("preview")}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Preview Before Issuing</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep("edit")}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Edit More</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? "Issuing..." : isReissue ? "Reissue Prescription" : "Issue Prescription"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
