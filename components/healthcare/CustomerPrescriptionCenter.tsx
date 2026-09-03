"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FileText,
  Calendar,
  Clock,
  User,
  Building2,
  Stethoscope,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Activity,
  Printer,
  Download,
  Eye,
  RefreshCw,
} from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import type { PrescriptionRecord, PrescriptionFilter, FollowUpRecord } from "@/lib/prescriptions";
import { PrescriptionView } from "./PrescriptionView";
import { FollowUpCard } from "./FollowUpCard";

interface CustomerPrescriptionCenterProps {
  initialPrescriptionId?: string | null;
  onSelectClinicForBooking?: (clinicId: string, clinicName: string) => void;
}

const FILTER_OPTIONS: { id: PrescriptionFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "30d", label: "Last 30 days" },
  { id: "3m", label: "Last 3 months" },
  { id: "6m", label: "Last 6 months" },
  { id: "1y", label: "Last 1 Year" },
];

export function CustomerPrescriptionCenter({
  initialPrescriptionId,
  onSelectClinicForBooking,
}: CustomerPrescriptionCenterProps) {
  const [activeSection, setActiveSection] = useState<"prescriptions" | "followups">("prescriptions");
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([]);
  const [selectedRx, setSelectedRx] = useState<PrescriptionRecord | null>(null);
  const [activeFilter, setActiveFilter] = useState<PrescriptionFilter>("1y");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [followUpsLoading, setFollowUpsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrescriptions = useCallback(async (filter: PrescriptionFilter) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ prescriptions: PrescriptionRecord[] }>(
        `/api/healthcare/prescriptions?filter=${filter}`
      );
      if (data && data.prescriptions) {
        setPrescriptions(data.prescriptions);
        if (initialPrescriptionId) {
          const match = data.prescriptions.find(
            (p) => p.id === initialPrescriptionId || p.prescriptionNumber === initialPrescriptionId
          );
          if (match) setSelectedRx(match);
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load prescriptions.");
    } finally {
      setLoading(false);
    }
  }, [initialPrescriptionId]);

  const fetchFollowUps = useCallback(async () => {
    setFollowUpsLoading(true);
    try {
      const data = await apiFetch<{ followUps: FollowUpRecord[] }>("/api/healthcare/follow-ups");
      if (data?.followUps) {
        setFollowUps(data.followUps);
      }
    } catch {
      // fallback
    } finally {
      setFollowUpsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrescriptions(activeFilter);
  }, [activeFilter, fetchPrescriptions]);

  useEffect(() => {
    if (activeSection === "followups") {
      fetchFollowUps();
    }
  }, [activeSection, fetchFollowUps]);

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return prescriptions;
    return prescriptions.filter(
      (p) =>
        p.prescriptionNumber.toLowerCase().includes(q) ||
        p.doctorName.toLowerCase().includes(q) ||
        p.storeName.toLowerCase().includes(q) ||
        (p.diagnosis && p.diagnosis.toLowerCase().includes(q))
    );
  }, [prescriptions, searchQuery]);

  const filteredFollowUps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return followUps;
    return followUps.filter(
      (f) =>
        f.doctorName.toLowerCase().includes(q) ||
        (f.patientName && f.patientName.toLowerCase().includes(q)) ||
        (f.prescriptionNumber && f.prescriptionNumber.toLowerCase().includes(q)) ||
        ((f as any).clinicName && (f as any).clinicName.toLowerCase().includes(q))
    );
  }, [followUps, searchQuery]);

  const stats = useMemo(() => {
    const total = prescriptions.length;
    const withFollowUp = prescriptions.filter(
      (p) => p.followUp && !p.followUp.isExpired && p.followUp.bookingStatus !== "completed"
    ).length;
    const completedFollowUps = prescriptions.filter(
      (p) => p.followUp && p.followUp.bookingStatus === "completed"
    ).length;
    return { total, withFollowUp, completedFollowUps };
  }, [prescriptions]);

  // Detail View for a Selected Prescription (Prescription Details)
  if (selectedRx) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => setSelectedRx(null)}
            className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-4 py-2.5 rounded-full border border-slate-200 shadow-sm cursor-pointer transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600" />
            <span>Back to My Prescriptions</span>
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase tracking-wider border border-emerald-200">
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            Prescription Details
          </div>
        </div>

        {/* The Clinic-Branded Prescription View (Read-Only) */}
        <PrescriptionView prescription={selectedRx} />

        {/* Separate Follow-up Card */}
        {selectedRx.followUp && (
          <FollowUpCard
            followUp={selectedRx.followUp}
            onBookFollowUp={(fu) => {
              if (onSelectClinicForBooking) {
                onSelectClinicForBooking(fu.storeId, selectedRx.storeName);
              }
            }}
          />
        )}
      </div>
    );
  }

  // Prescriptions List View
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase tracking-wider mb-2 border border-emerald-200">
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            Healthcare • My Prescription
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            My Prescription
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
            Access, view, download, and book follow-ups for all prescriptions issued through Kynisto.
          </p>
        </div>

        {/* Sub-Navigation Tabs: All Prescriptions | Follow-ups */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveSection("prescriptions")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSection === "prescriptions"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Prescriptions ({prescriptions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("followups")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSection === "followups"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Follow-ups ({stats.withFollowUp})
          </button>
        </div>
      </div>

      {activeSection === "prescriptions" ? (
        <>
          {/* Controls: Time Filter Pills */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
              Filter by timeframe:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setActiveFilter(opt.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeFilter === opt.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Total Prescriptions
                </span>
                <strong className="text-2xl font-black text-slate-900 tabular-nums">
                  {stats.total}
                </strong>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Active Follow-ups
                </span>
                <strong className="text-2xl font-black text-emerald-700 tabular-nums">
                  {stats.withFollowUp}
                </strong>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Completed Care
                </span>
                <strong className="text-2xl font-black text-cyan-700 tabular-nums">
                  {stats.completedFollowUps}
                </strong>
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative mb-6">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by doctor, clinic name, diagnosis, or prescription ID..."
              className="w-full bg-white border border-slate-300 rounded-2xl pl-11 pr-4 py-3 text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm shadow-sm"
            />
          </div>

          {/* Prescription List */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-bold text-sm bg-white rounded-2xl border border-slate-200">
              Loading prescriptions...
            </div>
          ) : error ? (
            <div className="p-6 text-center text-rose-700 bg-rose-50 rounded-2xl border border-rose-200 text-sm font-bold">
              {error}
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-black text-slate-800 mb-1">No Prescriptions Found</h3>
              <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">
                {searchQuery
                  ? "No prescriptions match your search criteria. Try a different query or timeframe."
                  : "Prescriptions issued to you during consultations at verified clinics will appear here automatically."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredList.map((rx) => {
                const rxDate = new Date(rx.issuedAt * 1000).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

                const hasFollowUp = Boolean(rx.followUp);
                const isFollowUpExpired = rx.followUp?.isExpired;
                const followUpFeeDisplay =
                  rx.followUp?.followUpType === "free"
                    ? "Free"
                    : rx.followUp?.followUpFee
                    ? `₹${rx.followUp.followUpFee}`
                    : "Free";

                return (
                  <div
                    key={rx.id}
                    onClick={() => setSelectedRx(rx)}
                    className="bg-white border border-slate-200 hover:border-emerald-500/40 rounded-2xl p-5 sm:p-6 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-105 transition-transform mt-0.5">
                        <Stethoscope className="w-6 h-6" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                            {rx.prescriptionNumber}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            • {rxDate}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded-md">
                            {rx.status}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors leading-snug truncate">
                          {rx.doctorName.startsWith("Dr.") ? rx.doctorName : `Dr. ${rx.doctorName}`}
                        </h3>

                        <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{rx.storeName}</span>
                        </p>

                        {rx.diagnosis && (
                          <p className="text-xs font-semibold text-slate-500 mt-2 line-clamp-1 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 w-fit">
                            Diagnosis: <span className="text-slate-800">{rx.diagnosis}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Follow-up strip & CTA */}
                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 shrink-0">
                      {hasFollowUp && rx.followUp ? (
                        <div className="text-left md:text-right text-xs">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                            Follow-up
                          </span>
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <Calendar className="w-3 h-3 text-teal-600" />
                            <span>{new Date(rx.followUp.followUpDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                            <span className="text-emerald-700 font-extrabold">• {followUpFeeDisplay}</span>
                          </div>
                          <span className={`text-[10px] font-bold ${isFollowUpExpired ? "text-rose-600" : "text-teal-700"}`}>
                            {isFollowUpExpired ? "Period expired" : rx.followUp.bookingStatus === "booked" ? "Booked" : "Available"}
                          </span>
                        </div>
                      ) : (
                        <div className="text-left md:text-right text-xs text-slate-400">
                          <span className="text-[10px] uppercase font-bold block mb-0.5">Follow-up</span>
                          <span>None scheduled</span>
                        </div>
                      )}

                      <button
                        type="button"
                        className="px-4 py-2.5 rounded-xl bg-slate-900 group-hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-sm ml-auto md:ml-0"
                      >
                        <span>View Prescription</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Follow-ups Dedicated Section */
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-black text-slate-900 tracking-tight mb-1">
              Your Follow-up Consultations
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Review allocated follow-up windows, check validity dates, and book appointments.
            </p>
          </div>

          {followUpsLoading ? (
            <div className="p-12 text-center text-slate-400 font-bold text-sm bg-white rounded-2xl border border-slate-200">
              Loading follow-ups...
            </div>
          ) : filteredFollowUps.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-black text-slate-800 mb-1">No Follow-ups Found</h3>
              <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">
                Any follow-up consultations scheduled by your treating doctor will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFollowUps.map((fu) => {
                const isExp = fu.isExpired;
                const isBooked = fu.bookingStatus === "booked" || fu.bookingStatus === "completed";
                const feeText = fu.followUpType === "free" ? "Free" : `₹${fu.followUpFee}`;

                return (
                  <div
                    key={fu.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                          {fu.prescriptionNumber || "Prescription"}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                          isExp ? "bg-rose-50 text-rose-800 border border-rose-200" : isBooked ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-teal-50 text-teal-800 border border-teal-200"
                        }`}>
                          {isExp ? "Expired" : isBooked ? "Booked" : "Available"}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                        Dr. {fu.doctorName.replace(/^Dr\.\s*/i, "")}
                      </h3>

                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {(fu as any).clinicName || "Clinic Consultation"}
                      </p>

                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-600 flex-wrap">
                        <span><strong>Consultation:</strong> {fu.originalConsultationDate}</span>
                        <span><strong>Follow-up Date:</strong> {fu.followUpDate}</span>
                        <span><strong>Valid until:</strong> {fu.validUntilDate}</span>
                        <span className="text-emerald-700 font-bold"><strong>Fee:</strong> {feeText}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await apiFetch<{ prescription: PrescriptionRecord }>(
                              `/api/healthcare/prescriptions?id=${fu.prescriptionId}`
                            );
                            if (res?.prescription) setSelectedRx(res.prescription);
                          } catch {}
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                      >
                        View Rx
                      </button>

                      {isExp ? (
                        <button
                          disabled
                          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs border border-slate-200 cursor-not-allowed"
                        >
                          Follow-up period expired
                        </button>
                      ) : isBooked ? (
                        <button
                          disabled
                          className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 flex items-center gap-1.5 cursor-default"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Booked</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectClinicForBooking) {
                              onSelectClinicForBooking(fu.storeId, (fu as any).clinicName || "Clinic");
                            }
                          }}
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-sm cursor-pointer transition-all flex items-center gap-1.5"
                        >
                          <span>Book Follow-up →</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
