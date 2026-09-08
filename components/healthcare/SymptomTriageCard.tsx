"use client";

import React, { useState } from "react";
import { kynistoTriageSymptoms, ClinicalTriageResult } from "@/lib/kynisto-python";
import { Stethoscope, AlertTriangle, CheckCircle2, ChevronRight, Activity, Sparkles, X, ShieldAlert } from "lucide-react";

interface SymptomTriageCardProps {
  onSelectSpecialty?: (specialty: string) => void;
}

const COMMON_SYMPTOM_PILLS = [
  "High fever & headache",
  "Chest pain radiating to arm",
  "Child fever & earache",
  "Twisted ankle & swelling",
  "Skin rash with blisters",
  "Severe toothache & jaw pain",
];

export default function SymptomTriageCard({ onSelectSpecialty }: SymptomTriageCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [complaint, setComplaint] = useState("");
  const [age, setAge] = useState<number | undefined>(undefined);
  const [triageResult, setTriageResult] = useState<ClinicalTriageResult | null>(null);

  const handleTriage = (text: string, patientAge?: number) => {
    if (!text.trim()) {
      setTriageResult(null);
      return;
    }
    const result = kynistoTriageSymptoms(text, patientAge);
    setTriageResult(result);
  };

  const applyPill = (pill: string) => {
    setComplaint(pill);
    handleTriage(pill, age);
  };

  return (
    <div className="w-full max-w-5xl mx-auto mb-8">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl shadow-md flex items-center justify-between transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full text-white">
                  Python AI Triage
                </span>
                <span className="font-extrabold text-sm sm:text-base">Feeling Unwell? Check Symptoms & Urgency</span>
              </div>
              <p className="text-xs text-emerald-100 font-medium hidden sm:block">
                Instant Emergency Severity Index (ESI) assessment and specialist clinic routing.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-xs bg-white text-emerald-800 px-3.5 py-1.5 rounded-xl shadow group-hover:scale-105 transition-transform">
            <span>Check Now</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>
      ) : (
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  Clinical Symptom Triage
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                    ESI Standard
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Powered by Kynisto Python Clinical Decision Engine
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="p-4 sm:p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Describe Patient Symptoms or Medical Concern
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={complaint}
                  onChange={(e) => {
                    setComplaint(e.target.value);
                    handleTriage(e.target.value, age);
                  }}
                  placeholder="e.g. 5-year-old high fever and severe cough, or chest tightness"
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-50/50"
                />
                <input
                  type="number"
                  value={age ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                    setAge(val);
                    handleTriage(complaint, val);
                  }}
                  placeholder="Age (yrs)"
                  className="w-24 px-3 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center bg-slate-50/50"
                />
              </div>
            </div>

            {/* Quick Pills */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 self-center mr-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Examples:
              </span>
              {COMMON_SYMPTOM_PILLS.map((pill) => (
                <button
                  key={pill}
                  onClick={() => applyPill(pill)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border border-slate-200/80 transition-colors cursor-pointer"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Result Box */}
            {triageResult && (
              <div className={`mt-4 p-4 sm:p-5 rounded-2xl border transition-all ${
                triageResult.urgency === "EMERGENCY"
                  ? "bg-rose-50 border-rose-200 text-rose-900"
                  : triageResult.urgency === "URGENT"
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-emerald-50 border-emerald-200 text-emerald-900"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5">
                  <div className="flex items-center gap-2.5">
                    {triageResult.urgency === "EMERGENCY" ? (
                      <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
                    ) : triageResult.urgency === "URGENT" ? (
                      <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    )}
                    <div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        triageResult.urgency === "EMERGENCY"
                          ? "bg-rose-600 text-white"
                          : triageResult.urgency === "URGENT"
                          ? "bg-amber-600 text-white"
                          : "bg-emerald-600 text-white"
                      }`}>
                        ESI Level {triageResult.esiLevel} · {triageResult.urgency}
                      </span>
                      <h4 className="text-base font-black mt-0.5">
                        Recommended: {triageResult.recommendedSpecialty}
                      </h4>
                    </div>
                  </div>

                  {onSelectSpecialty && (
                    <button
                      onClick={() => onSelectSpecialty(triageResult.primaryDepartment)}
                      className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all self-start sm:self-auto"
                    >
                      Filter {triageResult.primaryDepartment} Clinics →
                    </button>
                  )}
                </div>

                {/* Instructions */}
                <p className="text-xs font-medium mt-3 leading-relaxed opacity-90">
                  {triageResult.guidanceInstructions}
                </p>

                {/* Red Flags Alert */}
                {triageResult.redFlags.length > 0 && (
                  <div className="mt-3 p-2.5 bg-rose-100/80 border border-rose-200 rounded-xl">
                    <p className="text-[11px] font-extrabold text-rose-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                      Critical Clinical Warning:
                    </p>
                    <ul className="list-disc list-inside text-[11px] text-rose-800 mt-1 space-y-0.5">
                      {triageResult.redFlags.map((rf, idx) => (
                        <li key={idx}>{rf}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
