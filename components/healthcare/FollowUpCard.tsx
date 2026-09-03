"use client";

import React, { useState } from "react";
import { Calendar, Clock, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import type { FollowUpRecord } from "@/lib/prescriptions";
import { apiFetch } from "@/lib/client-api";

interface FollowUpCardProps {
  followUp: FollowUpRecord;
  onBookFollowUp?: (followUp: FollowUpRecord) => void;
  readOnly?: boolean;
}

export function FollowUpCard({
  followUp,
  onBookFollowUp,
  readOnly = false,
}: FollowUpCardProps) {
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(followUp.bookingStatus === "booked" || followUp.bookingStatus === "completed");
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];
  const isExpired =
    followUp.isExpired ||
    (followUp.validUntilDate && todayStr > followUp.validUntilDate && !booked);

  const formatDisplayDate = (dStr: string) => {
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dStr;
    }
  };

  const handleBook = async () => {
    setBooking(true);
    setError(null);
    try {
      await apiFetch("/api/healthcare/follow-ups", {
        method: "PATCH",
        json: {
          action: "book",
          followUpId: followUp.id,
        },
      });
      setBooked(true);
      if (onBookFollowUp) {
        onBookFollowUp(followUp);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to book follow-up.");
    } finally {
      setBooking(false);
    }
  };

  const feeDisplay =
    followUp.followUpType === "free"
      ? "Free"
      : followUp.followUpFee
      ? `₹${followUp.followUpFee} (${followUp.followUpType === "discounted" ? "Discounted" : "Paid"})`
      : "Free";

  return (
    <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl p-6 shadow-md transition-all mt-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Follow-up
            </h3>
            <p className="text-xs font-semibold text-slate-500">
              Dr. {followUp.doctorName.replace(/^Dr\.\s*/i, "")}
            </p>
          </div>
        </div>

        <div>
          {booked ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-black uppercase rounded-full border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Follow-up Booked
            </span>
          ) : isExpired ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-800 text-xs font-black uppercase rounded-full border border-rose-300">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              Follow-up period expired
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-800 text-xs font-black uppercase rounded-full border border-teal-300">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              Follow-up Available
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 mb-6 text-xs">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Follow-up Date
          </span>
          <span className="text-sm font-black text-slate-900 block">
            {formatDisplayDate(followUp.followUpDate)}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Valid Until
          </span>
          <span className="text-sm font-black text-slate-900 block">
            {formatDisplayDate(followUp.validUntilDate)}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Fee
          </span>
          <span className="text-sm font-black text-emerald-700 block">
            {feeDisplay}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Status
          </span>
          <span className="text-sm font-black text-slate-800 block capitalize">
            {booked ? "Booked" : isExpired ? "Expired" : "Available"}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200">
          {error}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
        <p className="text-xs text-slate-500 font-medium">
          {isExpired
            ? "The allocated follow-up validity window has ended. Regular consultation charges apply."
            : booked
            ? "Your follow-up is confirmed. Please arrive according to the schedule."
            : `Schedule your follow-up before ${formatDisplayDate(followUp.validUntilDate)} to avail ${feeDisplay} consultation.`}
        </p>

        {!readOnly && (
          <div>
            {isExpired ? (
              <button
                disabled
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs sm:text-sm border border-slate-200 cursor-not-allowed"
              >
                Follow-up period expired
              </button>
            ) : booked ? (
              <button
                disabled
                className="px-5 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs sm:text-sm border border-emerald-200 flex items-center gap-1.5 cursor-default"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmed</span>
              </button>
            ) : (
              <button
                onClick={handleBook}
                disabled={booking}
                type="button"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span>{booking ? "Booking..." : "Book Follow-up →"}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
