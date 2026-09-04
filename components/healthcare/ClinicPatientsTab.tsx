"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  Search,
  User,
  Phone,
  Calendar,
  FileText,
  Clock,
  Plus,
  Stethoscope,
  ChevronRight,
  X,
  Activity,
  CheckCircle2,
  MapPin,
  Shield,
  Eye,
} from "lucide-react";
import { apiFetch } from "@/lib/client-api";

interface PatientSummary {
  patientId?: string;
  patientName: string;
  patientPhone: string;
  patientAge?: number;
  patientGender?: string;
  lastVisit: string;
  lastDoctor?: string;
  totalPrescriptions: number;
  totalVisits: number;
}

interface PatientDetail {
  patientId?: string;
  patientName: string;
  patientPhone?: string;
  patientAge?: number;
  patientGender?: string;
  patientAddress?: string;
  totalVisits: number;
  consultationHistory: Array<{
    id: string;
    tokenNumber?: number;
    status: string;
    date: string;
    completedAt?: string;
  }>;
  prescriptionHistory: Array<{
    id: string;
    prescriptionNumber: string;
    date: string;
    doctorName: string;
    diagnosis?: string;
    medicines: any[];
    status: string;
  }>;
  followUpHistory: Array<{
    id: string;
    date: string;
    validUntil: string;
    type: string;
    fee: number;
    status: string;
  }>;
}

interface ClinicPatientsTabProps {
  storeId: string;
  onPrescribeForPatient?: (patientName: string, patientPhone?: string) => void;
  onViewPrescription?: (rxId: string) => void;
}

export function ClinicPatientsTab({
  storeId,
  onPrescribeForPatient,
  onViewPrescription,
}: ClinicPatientsTabProps) {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ patients: PatientSummary[] }>(
        `/api/healthcare/patients?storeId=${encodeURIComponent(storeId)}`
      );
      if (data?.patients) {
        setPatients(data.patients);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const openPatientProfile = async (p: PatientSummary) => {
    setDetailLoading(true);
    try {
      const q = p.patientPhone && p.patientPhone !== "Not recorded"
        ? `phone=${encodeURIComponent(p.patientPhone)}`
        : `name=${encodeURIComponent(p.patientName)}`;
      const data = await apiFetch<{ patient: PatientDetail }>(
        `/api/healthcare/patients?storeId=${encodeURIComponent(storeId)}&${q}`
      );
      if (data?.patient) {
        setSelectedPatient({
          ...data.patient,
          patientId: p.patientId || data.patient.patientId,
        });
      }
    } catch {
      // fallback mock
      setSelectedPatient({
        patientId: p.patientId,
        patientName: p.patientName,
        patientPhone: p.patientPhone,
        patientAge: p.patientAge,
        patientGender: p.patientGender,
        totalVisits: p.totalVisits,
        consultationHistory: [],
        prescriptionHistory: [],
        followUpHistory: [],
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.patientName.toLowerCase().includes(q) ||
        (p.patientId && p.patientId.toLowerCase().includes(q)) ||
        (p.patientPhone && p.patientPhone.toLowerCase().includes(q))
    );
  }, [patients, search]);

  return (
    <div className="w-full space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Patients Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Search and view complete medical, prescription, and consultation history for every patient.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name, patient ID, or phone number..."
            className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Patient List */}
      {loading ? (
        <div className="portalSkeleton"><span /><span /><span /></div>
      ) : filteredPatients.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-600">No patients found</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Patients who visit your clinic, book appointments, or receive prescriptions will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500">
                <tr>
                  <th className="py-3 px-4">Patient ID</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Total Visits</th>
                  <th className="py-3 px-4">Prescriptions</th>
                  <th className="py-3 px-4">Last Visit</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-800 text-xs">
                      {p.patientId || `PID-${String(idx + 1).padStart(4, "0")}`}
                    </td>
                    <td className="py-3.5 px-4">
                      <strong className="text-slate-900 font-extrabold block">
                        {p.patientName}
                      </strong>
                      {(p.patientAge || p.patientGender) && (
                        <span className="text-[11px] text-slate-400">
                          {p.patientAge ? `${p.patientAge}y` : ""} {p.patientGender || ""}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {p.patientPhone}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {p.totalVisits} visit{p.totalVisits === 1 ? "" : "s"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold">
                        {p.totalPrescriptions} Rx
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium text-xs">
                      {p.lastVisit}
                      {p.lastDoctor && <span className="block text-[11px] text-slate-400">Dr. {p.lastDoctor}</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openPatientProfile(p)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                      >
                        Patient Overview
                      </button>
                      {onPrescribeForPatient && (
                        <button
                          type="button"
                          onClick={() => onPrescribeForPatient(p.patientName, p.patientPhone)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                        >
                          + Prescribe
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Patient Profile Modal (Patient Overview) */}
      {selectedPatient && (
        <PatientHistoryModal
          storeId={storeId}
          patientName={selectedPatient.patientName}
          patientPhone={selectedPatient.patientPhone}
          patientId={selectedPatient.patientId}
          onClose={() => setSelectedPatient(null)}
          onViewPrescription={onViewPrescription}
        />
      )}
    </div>
  );
}

export interface PatientHistoryModalProps {
  storeId: string;
  patientName: string;
  patientPhone?: string;
  patientId?: string;
  onClose: () => void;
  onViewPrescription?: (rxId: string) => void;
}

export function PatientHistoryModal({
  storeId,
  patientName,
  patientPhone,
  patientId,
  onClose,
  onViewPrescription,
}: PatientHistoryModalProps) {
  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"consultations" | "prescriptions" | "followups">("prescriptions");

  useEffect(() => {
    let mounted = true;
    async function fetchPatientData() {
      setLoading(true);
      try {
        const q = patientPhone && patientPhone !== "Not recorded"
          ? `phone=${encodeURIComponent(patientPhone)}`
          : `name=${encodeURIComponent(patientName)}`;
        const data = await apiFetch<{ patient: PatientDetail }>(
          `/api/healthcare/patients?storeId=${encodeURIComponent(storeId)}&${q}`
        );
        if (mounted && data?.patient) {
          setSelectedPatient({
            ...data.patient,
            patientId: patientId || data.patient.patientId,
          });
        }
      } catch {
        if (mounted) {
          setSelectedPatient({
            patientId,
            patientName,
            patientPhone,
            totalVisits: 0,
            consultationHistory: [],
            prescriptionHistory: [],
            followUpHistory: [],
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    fetchPatientData();
    return () => { mounted = false; };
  }, [storeId, patientName, patientPhone, patientId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-2xl">
          <div className="portalSkeleton"><span /><span /><span /></div>
        </div>
      </div>
    );
  }

  if (!selectedPatient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 my-8 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-black text-lg">
              {selectedPatient.patientName.charAt(0)}
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 w-fit mb-1">
                Patient History
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {selectedPatient.patientName}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {selectedPatient.patientId && <span className="font-mono font-bold text-slate-700">{selectedPatient.patientId} • </span>}
                {selectedPatient.patientPhone || "No contact"} • {selectedPatient.patientAge ? `${selectedPatient.patientAge} years` : "Age not specified"} • {selectedPatient.patientGender || "Gender not specified"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("prescriptions")}
            className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === "prescriptions" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            Prescriptions ({selectedPatient.prescriptionHistory.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("consultations")}
            className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === "consultations" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            Consultations ({selectedPatient.consultationHistory.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("followups")}
            className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === "followups" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            Follow-ups ({selectedPatient.followUpHistory.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === "prescriptions" && (
            <div>
              {selectedPatient.prescriptionHistory.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No prescriptions issued yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedPatient.prescriptionHistory.map((rx) => (
                    <div key={rx.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {rx.prescriptionNumber}
                          </span>
                          <span className="text-slate-400">• {rx.date}</span>
                          <span className="font-semibold text-slate-700">Dr. {rx.doctorName}</span>
                        </div>
                        {rx.diagnosis && (
                          <p className="text-slate-600 mt-1 font-medium">
                            Diagnosis: <span className="font-bold text-slate-800">{rx.diagnosis}</span>
                          </p>
                        )}
                      </div>
                      {onViewPrescription && (
                        <button
                          type="button"
                          onClick={() => onViewPrescription(rx.id)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 cursor-pointer"
                        >
                          View
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "consultations" && (
            <div>
              {selectedPatient.consultationHistory.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No queue consultation records.</p>
              ) : (
                <div className="space-y-2">
                  {selectedPatient.consultationHistory.map((q) => (
                    <div key={q.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 font-black flex items-center justify-center">
                          #{q.tokenNumber || "—"}
                        </span>
                        <div>
                          <strong className="text-slate-900 block font-bold">
                            Token #{q.tokenNumber || "—"}
                          </strong>
                          <span className="text-slate-500">{q.date}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase rounded">
                        {q.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "followups" && (
            <div>
              {selectedPatient.followUpHistory.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No follow-ups recorded.</p>
              ) : (
                <div className="space-y-2">
                  {selectedPatient.followUpHistory.map((fu) => (
                    <div key={fu.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-slate-900 block font-bold">
                          Follow-up: {fu.date}
                        </strong>
                        <span className="text-slate-500">
                          Valid until {fu.validUntil} • {fu.type === "free" ? "Free" : `₹${fu.fee}`}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-black uppercase rounded">
                        {fu.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
