"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  Settings,
  DollarSign,
  ArrowRight,
  Sparkles,
  Save,
} from "lucide-react";
import { apiFetch } from "@/lib/client-api";

interface FollowUpItem {
  id: string;
  storeId: string;
  prescriptionId: string;
  prescriptionNumber: string;
  patientName: string;
  patientPhone?: string;
  doctorName: string;
  originalConsultationDate: string;
  followUpDate: string;
  validUntilDate: string;
  validityDays: number;
  followUpType: "free" | "paid" | "discounted";
  followUpFee: number;
  paymentStatus: "free" | "unpaid" | "paid";
  bookingStatus: "not_booked" | "booked" | "completed" | "expired";
  isExpired?: boolean;
}

interface ClinicFollowupsTabProps {
  storeId: string;
  onToast?: (msg: string) => void;
  onPrescribeForFollowUp?: (patientName: string, patientPhone?: string) => void;
}

type SubTab = "today" | "upcoming" | "expired" | "settings";

export function ClinicFollowupsTab({
  storeId,
  onToast,
  onPrescribeForFollowUp,
}: ClinicFollowupsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("today");
  const [todayList, setTodayList] = useState<FollowUpItem[]>([]);
  const [upcomingList, setUpcomingList] = useState<FollowUpItem[]>([]);
  const [expiredList, setExpiredList] = useState<FollowUpItem[]>([]);

  // Settings
  const [followupType, setFollowupType] = useState<"free" | "paid" | "discounted">("free");
  const [validityDays, setValidityDays] = useState<number>(7);
  const [customValidityDays, setCustomValidityDays] = useState<number>(10);
  const [isCustomValidity, setIsCustomValidity] = useState<boolean>(false);
  const [fee, setFee] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchFollowups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{
        today: FollowUpItem[];
        upcoming: FollowUpItem[];
        expired: FollowUpItem[];
        settings?: {
          defaultFollowupType: "free" | "paid" | "discounted";
          defaultFollowupValidityDays: number;
          defaultFollowupFee: number;
        };
      }>(`/api/healthcare/follow-ups?storeId=${encodeURIComponent(storeId)}`);

      if (data) {
        setTodayList(data.today || []);
        setUpcomingList(data.upcoming || []);
        setExpiredList(data.expired || []);

        if (data.settings) {
          setFollowupType(data.settings.defaultFollowupType || "free");
          const vDays = data.settings.defaultFollowupValidityDays || 7;
          if ([1, 3, 5, 7, 14].includes(vDays)) {
            setValidityDays(vDays);
            setIsCustomValidity(false);
          } else {
            setIsCustomValidity(true);
            setCustomValidityDays(vDays);
          }
          setFee(data.settings.defaultFollowupFee || 0);
        }
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchFollowups();
  }, [fetchFollowups]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const finalDays = isCustomValidity ? customValidityDays : validityDays;
      await apiFetch("/api/healthcare/follow-ups", {
        method: "PATCH",
        json: {
          action: "configure_settings",
          storeId,
          followupType,
          validityDays: finalDays,
          fee: followupType === "free" ? 0 : fee,
        },
      });
      if (onToast) onToast("Follow-up configuration saved!");
    } catch (err: any) {
      alert(err?.message || "Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleComplete = async (fuId: string) => {
    try {
      await apiFetch("/api/healthcare/follow-ups", {
        method: "PATCH",
        json: { action: "complete", storeId, followUpId: fuId },
      });
      if (onToast) onToast("Follow-up marked as completed!");
      fetchFollowups();
    } catch {
      // fallback
    }
  };

  const activeList =
    activeSubTab === "today"
      ? todayList
      : activeSubTab === "upcoming"
      ? upcomingList
      : expiredList;

  return (
    <div className="space-y-6">
      {/* Header & Sub-navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Follow-up Care Dashboard
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Monitor and configure follow-up consultations and validity windows for your clinic.
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveSubTab("today")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "today"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Today ({todayList.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("upcoming")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "upcoming"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Upcoming ({upcomingList.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("expired")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "expired"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Expired ({expiredList.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("settings")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeSubTab === "settings"
                ? "bg-teal-700 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configure</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      {activeSubTab === "settings" ? (
        /* Follow-up Clinic Configuration */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-2xl">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Clinic Follow-up Policy
              </h3>
              <p className="text-xs text-slate-500">
                Configure default validity and pricing for patient follow-ups.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs sm:text-sm">
            {/* Follow-up Type */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-600 block mb-1.5">
                Default Follow-up Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "free", label: "Free (Complimentary)" },
                  { id: "discounted", label: "Discounted" },
                  { id: "paid", label: "Full Paid" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFollowupType(t.id as any)}
                    className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      followupType === t.id
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-xs"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Follow-up Validity */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-600 block mb-1.5">
                Follow-up Validity Period
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
                {[1, 3, 5, 7, 14].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setValidityDays(d);
                      setIsCustomValidity(false);
                    }}
                    className={`py-2 px-3 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                      !isCustomValidity && validityDays === d
                        ? "border-teal-500 bg-teal-50 text-teal-900"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {d} {d === 1 ? "day" : "days"}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsCustomValidity(true)}
                  className={`py-2 px-3 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                    isCustomValidity
                      ? "border-teal-500 bg-teal-50 text-teal-900"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  Custom
                </button>
              </div>

              {isCustomValidity && (
                <div className="mt-2">
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    Custom Validity Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={customValidityDays}
                    onChange={(e) => setCustomValidityDays(Number(e.target.value))}
                    className="w-48 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                  />
                </div>
              )}

              <p className="text-[11px] text-slate-400 mt-1">
                The system will automatically calculate validity dates for each patient starting from their original consultation.
              </p>
            </div>

            {/* Fee input */}
            {followupType !== "free" && (
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-600 block mb-1">
                  Follow-up Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50000"
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  placeholder="e.g. 200"
                  className="w-48 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-800"
                />
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{savingSettings ? "Saving..." : "Save Policy"}</span>
              </button>
            </div>
          </form>
        </div>
      ) : loading ? (
        <div className="portalSkeleton"><span /><span /><span /></div>
      ) : activeList.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-600">
            No {activeSubTab} follow-ups
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Patients scheduled for follow-up consultations in this category will appear here.
          </p>
        </div>
      ) : (
        /* List Table */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500">
                <tr>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Consultation Date</th>
                  <th className="py-3 px-4">Follow-up Date</th>
                  <th className="py-3 px-4">Validity</th>
                  <th className="py-3 px-4">Fee</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Booking Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <strong className="text-slate-900 font-extrabold block">
                        {item.patientName}
                      </strong>
                      {item.patientPhone && (
                        <span className="text-[11px] text-slate-400">{item.patientPhone}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      Dr. {item.doctorName.replace(/^Dr\.\s*/i, "")}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {item.originalConsultationDate}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {item.followUpDate}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {item.validityDays} days
                      <span className="block text-[10px] text-slate-400">
                        until {item.validUntilDate}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      {item.followUpType === "free" ? "Free" : `₹${item.followUpFee}`}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.paymentStatus === "paid" || item.paymentStatus === "free"
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {item.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                          item.isExpired
                            ? "bg-rose-50 text-rose-800"
                            : item.bookingStatus === "completed"
                            ? "bg-cyan-50 text-cyan-800"
                            : item.bookingStatus === "booked"
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.isExpired ? "Expired" : item.bookingStatus.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {item.bookingStatus !== "completed" && !item.isExpired && (
                        <button
                          type="button"
                          onClick={() => handleComplete(item.id)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          ✓ Done
                        </button>
                      )}
                      {onPrescribeForFollowUp && (
                        <button
                          type="button"
                          onClick={() => onPrescribeForFollowUp(item.patientName, item.patientPhone)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Prescribe
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
    </div>
  );
}
