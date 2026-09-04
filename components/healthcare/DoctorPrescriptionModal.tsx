"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Search,
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
  registrationNumber?: string;
  doctorRegistration?: string;
}

interface DoctorPrescriptionModalProps {
  storeId: string;
  storeName: string;
  onClose: () => void;
  onSuccess: (prescriptionId: string, rxNumber: string) => void;
  // Pre-fill fields if issued from queue or appointment
  initialPatientName?: string;
  initialPatientPhone?: string;
  initialUserId?: string;
  initialPatientEmail?: string;
  queueEntryId?: string;
  appointmentId?: string;
  doctors?: Doctor[];
  // For Reissue / Correction mode
  reissueTarget?: PrescriptionRecord | null;
  // Live Queue Consultation Context
  patientId?: string;
  queueTokenNumber?: string;
  consultationDate?: string;
}

export function DoctorPrescriptionModal({
  storeId,
  storeName,
  onClose,
  onSuccess,
  initialPatientName = "",
  initialPatientPhone = "",
  initialUserId = "",
  initialPatientEmail = "",
  queueEntryId,
  appointmentId,
  doctors = [],
  reissueTarget,
  patientId,
  queueTokenNumber,
  consultationDate,
}: DoctorPrescriptionModalProps) {
  const isReissue = Boolean(reissueTarget);

  // Form step: "edit" | "preview"
  const [step, setStep] = useState<"edit" | "preview">("edit");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Medical form state
  const initialCustomDoc = !doctors.length || Boolean(reissueTarget && !doctors.some((d) => String(d.id) === reissueTarget.doctorId));
  const [isCustomDoctor, setIsCustomDoctor] = useState<boolean>(initialCustomDoc);
  const [doctorId, setDoctorId] = useState<string>(
    reissueTarget?.doctorId || (!initialCustomDoc && doctors[0]?.id ? String(doctors[0].id) : "")
  );
  const [doctorName, setDoctorName] = useState<string>(
    reissueTarget?.doctorName || (doctors[0]?.name || "")
  );
  const [doctorSpecialization, setDoctorSpecialization] = useState<string>(
    reissueTarget?.doctorSpecialization || (doctors[0]?.specialization || "General Medicine")
  );
  const [doctorRegistration, setDoctorRegistration] = useState<string>(
    reissueTarget?.doctorRegistration ||
      reissueTarget?.templateSnapshot?.doctorRegistration ||
      (doctors[0]?.doctorRegistration || doctors[0]?.registrationNumber || "")
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

  // User Selection (Sync with Customer "My Prescription")
  const [userId, setUserId] = useState<string>(
    reissueTarget?.userId || initialUserId || ""
  );
  const [patientEmail, setPatientEmail] = useState<string>(
    (reissueTarget as any)?.patientEmail || initialPatientEmail || ""
  );
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    email: string;
    phone?: string;
  } | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<
    Array<{ id: string; name: string; email: string; phone?: string }>
  >([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userPickerRef = useRef<HTMLDivElement>(null);

  const handleSearchUsers = useCallback(
    (query: string) => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      setIsSearchingUsers(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await apiFetch<{
            ok: boolean;
            users: Array<{ id: string; name: string; email: string; phone?: string }>;
          }>(
            `/api/healthcare/patients?storeId=${encodeURIComponent(storeId)}&searchUsers=1&query=${encodeURIComponent(query)}`
          );
          if (res?.users) {
            setUserSearchResults(res.users);
          }
        } catch {
          setUserSearchResults([]);
        } finally {
          setIsSearchingUsers(false);
        }
      }, 200);
    },
    [storeId]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userPickerRef.current && !userPickerRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const targetUid = reissueTarget?.userId || initialUserId;
    if (targetUid && !selectedUser) {
      apiFetch<{
        ok: boolean;
        users: Array<{ id: string; name: string; email: string; phone?: string }>;
      }>(
        `/api/healthcare/patients?storeId=${encodeURIComponent(storeId)}&searchUsers=1&query=${encodeURIComponent(targetUid)}`
      )
        .then((res) => {
          const found = res?.users?.find((u) => u.id === targetUid);
          if (found) {
            setSelectedUser(found);
            setUserId(found.id);
            setPatientEmail(found.email);
            if (!patientName) setPatientName(found.name);
            if (!patientPhone && found.phone) setPatientPhone(found.phone);
          }
        })
        .catch(() => {});
    }
  }, [initialUserId, reissueTarget, storeId, selectedUser, patientName, patientPhone]);

  const handleSelectUser = (u: { id: string; name: string; email: string; phone?: string }) => {
    setSelectedUser(u);
    setUserId(u.id);
    setPatientName(u.name);
    setPatientEmail(u.email);
    if (u.phone) {
      setPatientPhone(u.phone);
    }
    setShowUserDropdown(false);
    setUserSearchQuery("");
  };

  const handleClearSelectedUser = () => {
    setSelectedUser(null);
    setUserId("");
    setPatientEmail("");
    setUserSearchQuery("");
  };

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
  const [enableFollowUp, setEnableFollowUp] = useState<boolean>(
    reissueTarget ? Boolean(reissueTarget.followUp) : true
  );
  const [validityDays, setValidityDays] = useState<number>(
    reissueTarget?.followUp?.validityDays || 7
  );
  const [followUpType, setFollowUpType] = useState<"free" | "paid" | "discounted">(
    reissueTarget?.followUp?.followUpType || "free"
  );
  const [followUpFee, setFollowUpFee] = useState<number>(
    reissueTarget?.followUp?.followUpFee || 0
  );
  const [followUpNotes, setFollowUpNotes] = useState<string>(
    reissueTarget?.followUp?.notes || ""
  );

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

  useEffect(() => {
    if (queueEntryId && !isReissue) {
      let mounted = true;
      apiFetch<{ prescriptions?: PrescriptionRecord[] }>(
        `/api/healthcare/prescriptions?queueEntryId=${encodeURIComponent(queueEntryId)}`
      )
        .then((res) => {
          if (mounted && res?.prescriptions && res.prescriptions.length > 0) {
            const draft = res.prescriptions.find((p) => p.status === "draft");
            if (draft) {
              if (draft.diagnosis) setDiagnosis(draft.diagnosis);
              if (draft.medicines && draft.medicines.length > 0) setMedicines(draft.medicines);
              if (draft.tests && draft.tests.length > 0) setTestsInput(draft.tests.join(", "));
              if (draft.advice) setAdvice(draft.advice);
              if (draft.symptoms) setSymptoms(draft.symptoms);
              if (draft.vitals) setVitals(draft.vitals);
              if (draft.patientName) setPatientName(draft.patientName);
              if (draft.patientPhone) setPatientPhone(draft.patientPhone);
              if (draft.patientAge) setPatientAge(String(draft.patientAge));
              if (draft.patientGender) setPatientGender(draft.patientGender);
              if (draft.followUp) {
                setEnableFollowUp(Boolean(draft.followUp.enabled ?? true));
                if (draft.followUp.validityDays) setValidityDays(draft.followUp.validityDays);
                if (draft.followUp.followUpType) setFollowUpType(draft.followUp.followUpType);
                if (draft.followUp.followUpFee) setFollowUpFee(draft.followUp.followUpFee);
                if (draft.followUp.notes) setFollowUpNotes(draft.followUp.notes);
              }
            }
          }
        })
        .catch(() => {});
      return () => {
        mounted = false;
      };
    }
  }, [queueEntryId, isReissue]);

  // Correction reason (for reissue)
  const [correctionReason, setCorrectionReason] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftSuccess, setDraftSuccess] = useState(false);

  // Update doctor details when doctor selected
  const handleDoctorChange = (selectedId: string) => {
    setDoctorId(selectedId);
    const doc = doctors.find((d) => String(d.id) === selectedId);
    if (doc) {
      setDoctorName(doc.name);
      setDoctorSpecialization(doc.specialization || "Consultant Physician");
      if (doc.doctorRegistration || doc.registrationNumber) {
        setDoctorRegistration(doc.doctorRegistration || doc.registrationNumber || "");
      }
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
    if (medicines.length <= 1) {
      setMedicines([
        {
          name: "",
          dosage: "1 Tab",
          frequency: "1-0-1",
          duration: "3 days",
          timing: "After food",
          instructions: "",
        },
      ]);
      return;
    }
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
    doctorRegistration: doctorRegistration.trim() || undefined,
    userId: userId || undefined,
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
    templateSnapshot: {
      ...templateLayout,
      doctorRegistration: doctorRegistration.trim() || templateLayout.doctorRegistration,
    },
    status: "issued",
    issuedAt: Math.floor(Date.now() / 1000),
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000),
  };

  const handleSaveDraft = async () => {
    setError(null);
    if (!doctorName.trim()) {
      setError("Doctor name is required to save draft.");
      return;
    }
    if (!patientName.trim()) {
      setError("Patient name is required to save draft.");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/api/healthcare/prescriptions", {
        method: "POST",
        json: {
          action: "save_draft",
          status: "draft",
          storeId,
          doctorId: doctorId || undefined,
          doctorName: doctorName.trim(),
          doctorSpecialization,
          doctorRegistration: doctorRegistration.trim() || undefined,
          userId: userId || undefined,
          patientEmail: patientEmail.trim() || undefined,
          patientName: patientName.trim(),
          patientPhone: patientPhone.trim() || undefined,
          patientAge: patientAge ? parseInt(patientAge, 10) : undefined,
          patientGender,
          patientAddress: patientAddress.trim() || undefined,
          queueEntryId,
          appointmentId,
          vitals,
          symptoms,
          diagnosis,
          medicines: medicines.filter((m) => m.name.trim().length > 0),
          tests: testsInput.split(",").map((t) => t.trim()).filter(Boolean),
          advice,
          templateSnapshot: previewRecord.templateSnapshot,
          followUp: enableFollowUp
            ? {
                enabled: true,
                validityDays,
                followUpType,
                followUpFee: followUpType === "free" ? 0 : followUpFee,
                notes: followUpNotes,
              }
            : { enabled: false },
        },
      });
      setDraftSuccess(true);
      setTimeout(() => setDraftSuccess(false), 4500);
    } catch (err: any) {
      setError(err?.message || "Failed to save draft.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!doctorName.trim()) {
      setError("Doctor name is required.");
      return;
    }
    if (!patientName.trim()) {
      setError("Patient name is required.");
      return;
    }
    const validMedicines = medicines.filter((m) => m.name.trim().length > 0);
    if (validMedicines.length === 0) {
      setError("Please add at least one valid medication.");
      return;
    }

    const seenMeds = new Set<string>();
    for (const med of validMedicines) {
      const clean = med.name.trim().toLowerCase();
      if (seenMeds.has(clean)) {
        setError(`Duplicate medication detected: "${med.name.trim()}". Please consolidate or specify distinct dosages.`);
        return;
      }
      seenMeds.add(clean);
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
              doctorId: doctorId || undefined,
              doctorName: doctorName.trim(),
              doctorSpecialization,
              doctorRegistration: doctorRegistration.trim() || undefined,
              userId: userId || undefined,
              patientEmail: patientEmail.trim() || undefined,
              patientName: patientName.trim(),
              patientPhone: patientPhone.trim() || undefined,
              patientAge: patientAge ? parseInt(patientAge, 10) : undefined,
              patientGender,
              patientAddress: patientAddress.trim() || undefined,
              vitals,
              symptoms,
              diagnosis,
              medicines: validMedicines,
              tests: testsInput.split(",").map((t) => t.trim()).filter(Boolean),
              advice,
              templateSnapshot: previewRecord.templateSnapshot,
              followUp: enableFollowUp
                ? {
                    enabled: true,
                    validityDays,
                    followUpType,
                    followUpFee: followUpType === "free" ? 0 : followUpFee,
                    notes: followUpNotes,
                  }
                : { enabled: false },
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
              doctorName: doctorName.trim(),
              doctorSpecialization,
              doctorRegistration: doctorRegistration.trim() || undefined,
              userId: userId || undefined,
              patientEmail: patientEmail.trim() || undefined,
              patientName: patientName.trim(),
              patientPhone: patientPhone.trim() || undefined,
              patientAge: patientAge ? parseInt(patientAge, 10) : undefined,
              patientGender,
              patientAddress: patientAddress.trim() || undefined,
              queueEntryId,
              appointmentId,
              vitals,
              symptoms,
              diagnosis,
              medicines: validMedicines,
              tests: testsInput.split(",").map((t) => t.trim()).filter(Boolean),
              advice,
              templateSnapshot: previewRecord.templateSnapshot,
              followUp: enableFollowUp
                ? {
                    enabled: true,
                    validityDays,
                    followUpType,
                    followUpFee: followUpType === "free" ? 0 : followUpFee,
                    notes: followUpNotes,
                  }
                : { enabled: false },
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

          {draftSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>✓ Prescription draft saved successfully! You can resume and issue anytime.</span>
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
              {/* Live Queue Context */}
              {queueEntryId && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-500" />
                    <div>
                      <p className="text-[10px] text-indigo-400 font-bold uppercase">Patient</p>
                      <p className="text-sm font-black text-indigo-900">{patientName || "Walk-in"} {patientAge ? `(${patientAge}${patientGender ? ` / ${patientGender.charAt(0)}` : ""})` : ""}</p>
                      {patientId && <p className="text-[10px] font-bold text-indigo-600">{patientId}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <div>
                      <p className="text-[10px] text-indigo-400 font-bold uppercase">Queue Token</p>
                      <p className="text-sm font-black text-indigo-900">{queueTokenNumber || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <div>
                      <p className="text-[10px] text-indigo-400 font-bold uppercase">Date</p>
                      <p className="text-sm font-black text-indigo-900">{consultationDate || new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-indigo-500" />
                    <div>
                      <p className="text-[10px] text-indigo-400 font-bold uppercase">Consultation</p>
                      <p className="text-sm font-black text-indigo-900">{doctorName ? `Dr. ${doctorName}` : "Unassigned"} • {storeName}</p>
                    </div>
                  </div>
                </div>
              )}

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
                        value={isCustomDoctor ? "custom" : doctorId}
                        onChange={(e) => {
                          if (e.target.value === "custom") {
                            setIsCustomDoctor(true);
                            setDoctorId("");
                          } else {
                            setIsCustomDoctor(false);
                            handleDoctorChange(e.target.value);
                          }
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none"
                      >
                        {doctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            Dr. {d.name} {d.specialization ? `(${d.specialization})` : ""}
                          </option>
                        ))}
                        <option value="custom">+ Custom / Visiting Doctor</option>
                      </select>
                    </div>
                  ) : null}

                  {(isCustomDoctor || doctors.length === 0) && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Doctor Name *</label>
                      <input
                        type="text"
                        value={doctorName}
                        onChange={(e) => setDoctorName(e.target.value)}
                        placeholder="Dr. Sharma"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-800"
                        required
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

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Medical Registration No.</label>
                    <input
                      type="text"
                      value={doctorRegistration}
                      onChange={(e) => setDoctorRegistration(e.target.value)}
                      placeholder="e.g., MCI-84920 or State Council Reg"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-teal-600" />
                      Patient Details
                    </h3>
                    {selectedUser ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Account Linked
                      </span>
                    ) : null}
                  </div>

                  {/* 🔗 CHOOSE USER TO SYNC WITH CUSTOMER "MY PRESCRIPTION" */}
                  <div ref={userPickerRef} className="p-3 bg-white border border-teal-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black uppercase tracking-wide text-teal-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        <span>Choose User (Syncs to Customer &quot;My Prescription&quot;)</span>
                      </label>
                      <span className="text-[10px] text-teal-600 font-semibold">
                        Auto-syncs by Gmail ID or Name
                      </span>
                    </div>

                    {selectedUser ? (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                            {selectedUser.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-emerald-950 flex items-center gap-2 truncate">
                              <span>{selectedUser.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-200/80 text-emerald-800 rounded font-semibold shrink-0">
                                ✓ Synced Account
                              </span>
                            </div>
                            <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-2 truncate">
                              <span>✉️ {selectedUser.email}</span>
                              {selectedUser.phone ? <span>• 📞 {selectedUser.phone}</span> : null}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearSelectedUser}
                          className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            value={userSearchQuery}
                            onFocus={() => {
                              setShowUserDropdown(true);
                              if (!userSearchResults.length) handleSearchUsers("");
                            }}
                            onChange={(e) => {
                              setUserSearchQuery(e.target.value);
                              setShowUserDropdown(true);
                              handleSearchUsers(e.target.value);
                            }}
                            placeholder="Search user by Name or Gmail ID (e.g. arshit@gmail.com)..."
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-8 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-500"
                          />
                          {userSearchQuery ? (
                            <button
                              type="button"
                              onClick={() => {
                                setUserSearchQuery("");
                                handleSearchUsers("");
                              }}
                              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                            >
                              ✕
                            </button>
                          ) : null}
                        </div>

                        {showUserDropdown && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                            {isSearchingUsers ? (
                              <div className="p-3 text-center text-xs text-slate-400 font-medium">
                                Searching users...
                              </div>
                            ) : userSearchResults.length > 0 ? (
                              userSearchResults.map((u) => (
                                <div
                                  key={u.id}
                                  onClick={() => handleSelectUser(u)}
                                  className="p-2.5 hover:bg-teal-50/80 cursor-pointer transition-colors flex items-center justify-between gap-3 text-left"
                                >
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                                      <User className="w-3 h-3 text-teal-600 shrink-0" />
                                      <span>{u.name}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2 truncate mt-0.5">
                                      <span className="text-teal-700 font-semibold">✉️ {u.email}</span>
                                      {u.phone ? <span>• 📞 {u.phone}</span> : null}
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-1 rounded-lg shrink-0">
                                    Select & Sync
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="p-3 text-center text-xs text-slate-500">
                                {userSearchQuery ? (
                                  <span>No registered user found matching &quot;{userSearchQuery}&quot;. You can still enter details manually below.</span>
                                ) : (
                                  <span>Type a name or Gmail ID to search registered users...</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Patient Name *</label>
                      <input
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-teal-500"
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
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">
                        Gmail / Email <span className="text-[10px] text-teal-600 font-semibold">(Syncs to customer)</span>
                      </label>
                      <input
                        type="email"
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        placeholder="patient@gmail.com"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
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
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Patient Address</label>
                    <input
                      type="text"
                      value={patientAddress}
                      onChange={(e) => setPatientAddress(e.target.value)}
                      placeholder="e.g. Flat 302, Green Glen Layout, Bengaluru"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                    />
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
                  {/* Column Header for Desktop */}
                  <div className="hidden lg:flex items-center gap-2 px-3 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    <div className="flex-1 min-w-[200px]">Medicine Name & Strength</div>
                    <div className="w-28">Dosage</div>
                    <div className="w-40">Frequency</div>
                    <div className="w-28">Duration</div>
                    <div className="w-36">Timing</div>
                    <div className="w-12 text-center">Action</div>
                  </div>

                  {medicines.map((med, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex flex-wrap lg:flex-nowrap gap-2 text-xs items-center shadow-2xs"
                    >
                      <div className="flex-1 min-w-[200px] w-full lg:w-auto">
                        <label className="block lg:hidden text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                          Medicine Name & Strength
                        </label>
                        <input
                          type="text"
                          value={med.name}
                          onChange={(e) => handleUpdateMedicine(idx, "name", e.target.value)}
                          placeholder="e.g. Amoxicillin 500mg, Paracetamol"
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-2 font-bold text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div className="w-28 flex-1 sm:flex-none">
                        <label className="block lg:hidden text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                          Dosage
                        </label>
                        <input
                          type="text"
                          value={med.dosage || ""}
                          onChange={(e) => handleUpdateMedicine(idx, "dosage", e.target.value)}
                          placeholder="1 Tab / 5ml"
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div className="w-40 flex-1 sm:flex-none">
                        <label className="block lg:hidden text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                          Frequency
                        </label>
                        <select
                          value={med.frequency || "1-0-1"}
                          onChange={(e) => handleUpdateMedicine(idx, "frequency", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-2 py-2 text-slate-800 font-bold bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
                        >
                          <option value="1-0-1">1-0-1 (Morning-Night)</option>
                          <option value="1-1-1">1-1-1 (TDS)</option>
                          <option value="1-0-0">1-0-0 (Morning only)</option>
                          <option value="0-0-1">0-0-1 (Night only)</option>
                          <option value="SOS">SOS (When needed)</option>
                          <option value="Once daily">Once daily</option>
                        </select>
                      </div>
                      <div className="w-28 flex-1 sm:flex-none">
                        <label className="block lg:hidden text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                          Duration
                        </label>
                        <input
                          type="text"
                          value={med.duration || ""}
                          onChange={(e) => handleUpdateMedicine(idx, "duration", e.target.value)}
                          placeholder="5 days"
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div className="w-36 flex-1 sm:flex-none">
                        <label className="block lg:hidden text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                          Timing
                        </label>
                        <select
                          value={med.timing || "After food"}
                          onChange={(e) => handleUpdateMedicine(idx, "timing", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-800 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
                        >
                          <option value="After food">After food</option>
                          <option value="Before food">Before food</option>
                          <option value="With food">With food</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-end w-full lg:w-12 pt-1 lg:pt-0 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicine(idx)}
                          title="Delete / Clear Medicine Row"
                          aria-label="Delete Medicine"
                          className="h-9 px-3 lg:px-0 lg:w-9 flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all shadow-2xs cursor-pointer font-bold shrink-0"
                        >
                          <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                          <span className="lg:hidden text-xs text-rose-700 font-bold">Delete</span>
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
                      Valid for {validityDays} days {isReissue ? "from consultation" : "from today"}
                    </span>
                  )}
                </div>

                {enableFollowUp && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
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

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Follow-up Notes / Instructions (Optional)</label>
                      <input
                        type="text"
                        value={followUpNotes}
                        onChange={(e) => setFollowUpNotes(e.target.value)}
                        placeholder="e.g. Review blood sugar levels, repeat CBC if symptoms persist"
                        className="w-full bg-white border border-teal-300 rounded-xl px-3 py-2 text-slate-800 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
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
              <>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => setStep("preview")}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview Before Issuing</span>
                </button>
              </>
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
              onClick={() => {
                const validMedicines = medicines.filter((m) => m.name.trim().length > 0);
                if (validMedicines.length === 0) {
                  setError("Please add at least one valid medication.");
                  return;
                }
                setShowConfirmModal(true);
              }}
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? "Issuing..." : isReissue ? "Reissue Prescription" : "Issue Prescription"}</span>
            </button>
          </div>
        </div>
      </div>
      
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-black text-slate-800 mb-2">Issue Prescription?</h3>
            <p className="text-sm text-slate-600 mb-6 font-medium">
              Once issued, the prescription cannot be silently edited.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  handleSubmit();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm"
              >
                Issue Prescription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
