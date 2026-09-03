"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FileText,
  Search,
  Calendar,
  Clock,
  User,
  RotateCcw,
  Stethoscope,
  ChevronRight,
  Filter,
  Eye,
  Plus,
} from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import type { PrescriptionRecord, PrescriptionFilter } from "@/lib/prescriptions";
import { PrescriptionView } from "./PrescriptionView";

interface ClinicPrescriptionsTabProps {
  storeId: string;
  storeName: string;
  onNewPrescription: () => void;
  onReissuePrescription: (rx: PrescriptionRecord) => void;
}

const FILTER_OPTIONS: { id: PrescriptionFilter; label: string }[] = [
  { id: "1y", label: "Last 1 Year" },
  { id: "all", label: "All" },
  { id: "30d", label: "Last 30 days" },
  { id: "3m", label: "Last 3 months" },
  { id: "6m", label: "Last 6 months" },
];

export function ClinicPrescriptionsTab({
  storeId,
  storeName,
  onNewPrescription,
  onReissuePrescription,
}: ClinicPrescriptionsTabProps) {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<PrescriptionFilter>("1y");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedRx, setSelectedRx] = useState<PrescriptionRecord | null>(null);

  const fetchPrescriptions = useCallback(async (f: PrescriptionFilter) => {
    setLoading(true);
    try {
      const data = await apiFetch<{ prescriptions: PrescriptionRecord[] }>(
        `/api/healthcare/prescriptions?storeId=${encodeURIComponent(storeId)}&filter=${f}`
      );
      if (data?.prescriptions) {
        setPrescriptions(data.prescriptions);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchPrescriptions(activeFilter);
  }, [activeFilter, fetchPrescriptions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return prescriptions;
    return prescriptions.filter(
      (p) =>
        p.prescriptionNumber.toLowerCase().includes(q) ||
        p.patientName.toLowerCase().includes(q) ||
        p.doctorName.toLowerCase().includes(q) ||
        (p.diagnosis && p.diagnosis.toLowerCase().includes(q))
    );
  }, [prescriptions, search]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Clinic Prescription History
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Permanent, audited medical records issued by clinic doctors.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Time Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setActiveFilter(opt.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeFilter === opt.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onNewPrescription}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Issue Prescription</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Rx ID, patient name, doctor, or diagnosis..."
          className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Prescription Records Table */}
      {loading ? (
        <div className="portalSkeleton"><span /><span /><span /></div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-600">No prescriptions found</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Prescriptions issued in the selected timeframe will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Prescription ID</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Diagnosis / Clinical Notes</th>
                  <th className="py-3 px-4">Medicines</th>
                  <th className="py-3 px-4">Tests</th>
                  <th className="py-3 px-4">Advice</th>
                  <th className="py-3 px-4">Follow-up</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((rx) => {
                  const dateStr = new Date(rx.issuedAt * 1000).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const meds = rx.medicines || [];
                  const tests = rx.tests || [];
                  const hasFollowUp = Boolean(rx.followUp);

                  return (
                    <tr
                      key={rx.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={(e) => {
                        // avoid trigger if button clicked
                        if ((e.target as HTMLElement).tagName === "BUTTON") return;
                        setSelectedRx(rx);
                      }}
                    >
                      <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {dateStr}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-800 whitespace-nowrap">
                        {rx.prescriptionNumber}
                      </td>

                      <td className="py-3.5 px-4">
                        <strong className="text-slate-900 font-extrabold block">
                          {rx.patientName}
                        </strong>
                        {rx.patientPhone && (
                          <span className="text-[11px] text-slate-400">{rx.patientPhone}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        Dr. {rx.doctorName.replace(/^Dr\.\s*/i, "")}
                      </td>

                      {/* Diagnosis / Clinical Notes */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        {rx.diagnosis ? (
                          <span className="text-xs font-bold text-slate-900 block truncate">
                            {rx.diagnosis}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                        {rx.symptoms && (
                          <span className="text-[11px] text-slate-500 block truncate" title={rx.symptoms}>
                            {rx.symptoms}
                          </span>
                        )}
                      </td>

                      {/* Medicines */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        {meds.length > 0 ? (
                          <div className="space-y-0.5">
                            {meds.slice(0, 2).map((m, idx) => (
                              <div key={idx} className="text-xs text-slate-800 font-semibold truncate">
                                {m.name} <span className="text-[10px] text-slate-500 font-normal">({m.dosage || m.frequency})</span>
                              </div>
                            ))}
                            {meds.length > 2 && (
                              <span className="text-[10px] text-emerald-700 font-bold">
                                +{meds.length - 2} more med{meds.length - 2 === 1 ? "" : "s"}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Tests */}
                      <td className="py-3.5 px-4 max-w-[150px]">
                        {tests.length > 0 ? (
                          <div className="space-y-0.5">
                            {tests.slice(0, 2).map((t, idx) => (
                              <span key={idx} className="block text-[11px] text-slate-700 font-medium truncate">
                                • {t}
                              </span>
                            ))}
                            {tests.length > 2 && (
                              <span className="text-[10px] text-cyan-700 font-bold">
                                +{tests.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Advice */}
                      <td className="py-3.5 px-4 max-w-[160px]">
                        {rx.advice ? (
                          <span className="text-xs text-slate-600 block truncate" title={rx.advice}>
                            {rx.advice}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Follow-up */}
                      <td className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap">
                        {hasFollowUp && rx.followUp ? (
                          <div>
                            <span className="text-slate-800 block font-bold">
                              {new Date(rx.followUp.followUpDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                            <span className="text-[10px] text-teal-700 font-bold">
                              {rx.followUp.followUpType === "free" ? "Free" : `₹${rx.followUp.followUpFee}`}
                              {" • "}
                              {rx.followUp.validityDays}d validity
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            rx.status === "issued"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : rx.status === "reissued"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {rx.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedRx(rx)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                        >
                          View
                        </button>
                        {rx.status !== "reissued" && (
                          <button
                            type="button"
                            onClick={() => onReissuePrescription(rx)}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                            title="Reissue / Correct this prescription"
                          >
                            Reissue
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Full Prescription View Modal */}
      {selectedRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl p-6 my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <PrescriptionView
              prescription={selectedRx}
              onClose={() => setSelectedRx(null)}
              showActions={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
