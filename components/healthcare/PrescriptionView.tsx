"use client";

import React, { useState, useRef } from "react";
import {
  Printer,
  Download,
  Eye,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  Stethoscope,
  Activity,
  FileText,
  AlertTriangle,
  Building2,
} from "lucide-react";
import {
  mergeTemplateLayout,
  type PrescriptionRecord,
  type PrescriptionTemplateLayout,
} from "@/lib/prescriptions";

interface PrescriptionViewProps {
  prescription: PrescriptionRecord;
  onClose?: () => void;
  showActions?: boolean;
}

export function PrescriptionView({
  prescription,
  onClose,
  showActions = true,
}: PrescriptionViewProps) {
  const [isFullscreenViewer, setIsFullscreenViewer] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const layout = mergeTemplateLayout(prescription.templateSnapshot, { name: prescription.storeName });
  const isReissued = prescription.status === "reissued";

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleDownload = () => {
    // Generate standalone printable HTML page and open print/save dialog
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;

    let headStyles = "";
    if (typeof document !== "undefined") {
      const elements = document.querySelectorAll("style, link[rel='stylesheet']");
      elements.forEach((el) => {
        headStyles += el.outerHTML;
      });
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription_${prescription.prescriptionNumber}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          ${headStyles}
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Merriweather:wght@400;700&family=Roboto:wght@400;500;700&display=swap');
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 10mm 12mm;
            }
            body {
              font-family: ${layout.fontFamily || "Inter, sans-serif"};
              background: #ffffff !important;
              color: ${layout.textColor || "#0f172a"} !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .a4-container {
              max-width: 100% !important;
              width: 100% !important;
              margin: 0 auto !important;
              background: #ffffff !important;
              box-shadow: none !important;
              border: none !important;
              min-height: auto !important;
            }
            @media print {
              body { padding: 0 !important; margin: 0 !important; }
              .no-print { display: none !important; }
              .a4-container { min-height: auto !important; box-shadow: none !important; border: none !important; }
              tr, .prescription-section, .signature-block {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              thead { display: table-header-group !important; }
            }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            th { background: #f8fafc; font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; color: #475569; }
          </style>
        </head>
        <body>
          <div class="a4-container">
            ${content}
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formattedDate = new Date(prescription.issuedAt * 1000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const formattedTime = new Date(prescription.issuedAt * 1000).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const primaryColor = layout.primaryColor || "#0f766e";
  const secondaryColor = layout.secondaryColor || "#0284c7";
  const borderColor = layout.borderColor || "#e2e8f0";

  return (
    <div className="w-full flex flex-col items-center">
      {/* Action Bar */}
      {showActions && (
        <div className="no-print w-full max-w-4xl flex items-center justify-between flex-wrap gap-3 mb-6 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black uppercase rounded-full border border-emerald-200">
              {prescription.status.toUpperCase()}
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">
              #{prescription.prescriptionNumber}
            </span>
            {isReissued && (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[11px] font-bold rounded-md border border-amber-200">
                Superseded / Reissued
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreenViewer(true)}
              type="button"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-emerald-600" />
              <span>View</span>
            </button>

            <button
              onClick={handleDownload}
              type="button"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>

            <button
              onClick={handlePrint}
              type="button"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                type="button"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {/* Printable Prescription Canvas */}
      <div
        ref={printRef}
        className="relative w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden print:shadow-none print:border-none print:rounded-none print:min-h-0 print:overflow-visible print:p-0 print:m-0"
        style={{
          fontFamily: layout.fontFamily || "Inter, sans-serif",
          color: layout.textColor || "#0f172a",
          minHeight: "1050px", // Approximate A4 aspect ratio preview
        }}
      >
        {/* Reissue / Superseded Audit Watermark & Banner */}
        {isReissued && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="uppercase tracking-wider font-black">SUPERSEDED PRESCRIPTION RECORD</span>
              <p className="font-medium text-amber-800 text-[11px] mt-0.5">
                This prescription has been superseded by a corrected prescription.
                {prescription.correctionReason ? ` Correction Reason: ${prescription.correctionReason}` : ""}
              </p>
            </div>
          </div>
        )}

        {prescription.originalPrescriptionId && !isReissued && (
          <div className="p-3 bg-teal-50 border-b border-teal-200 text-teal-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <div>
              <span className="uppercase tracking-wider font-black">REISSUED & AUDITED PRESCRIPTION</span>
              {prescription.correctionReason && (
                <p className="font-medium text-teal-800 text-[11px] mt-0.5">
                  Correction Reason: {prescription.correctionReason}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Render Custom Canvas Elements (Badges, Stamps, Notes) */}
        {layout.elements &&
          layout.elements
            .filter((el) => el.visible !== false)
            .map((el) => {
              if (el.type === "badge" || el.type === "stamp") {
                return (
                  <div
                    key={el.id}
                    className="absolute pointer-events-none select-none z-20 font-black px-2.5 py-1 rounded-lg border shadow-xs text-center"
                    style={{
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      color: el.color || primaryColor,
                      borderColor: el.color || primaryColor,
                      fontSize: el.fontSize ? `${el.fontSize}px` : "13px",
                      backgroundColor: `${el.color || primaryColor}12`,
                      transform: el.type === "stamp" ? "rotate(-7deg)" : undefined,
                      minWidth: el.width ? `${el.width}px` : undefined,
                    }}
                  >
                    {el.content || el.label || "℞"}
                  </div>
                );
              }
              if (el.type === "text") {
                return (
                  <div
                    key={el.id}
                    className="absolute pointer-events-none select-none z-20 font-bold"
                    style={{
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      color: el.color || layout.textColor || "#0f172a",
                      fontSize: el.fontSize ? `${el.fontSize}px` : "13px",
                      maxWidth: el.width ? `${el.width}px` : "260px",
                    }}
                  >
                    {el.content || el.label}
                  </div>
                );
              }
              return null;
            })}
        {/* Prescription Document Header Strip */}
        <div
          className="p-6 sm:p-8 border-b"
          style={{
            borderColor: borderColor,
            background: `linear-gradient(135deg, ${primaryColor}08 0%, ${secondaryColor}05 100%)`,
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            {/* Left: Clinic details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                {layout.logoUrl && layout.showLogo && (
                  <img
                    src={layout.logoUrl}
                    alt={layout.clinicName}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0"
                  />
                )}
                <div>
                  <h1
                    className="text-xl sm:text-2xl font-black tracking-tight leading-tight"
                    style={{ color: primaryColor }}
                  >
                    {layout.clinicName || prescription.storeName}
                  </h1>
                  {layout.tagline && (
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      {layout.tagline}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-0.5 text-xs text-slate-600 font-medium">
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{layout.address || "Clinic Address"}</span>
                </p>
                <p className="flex items-center gap-1.5 flex-wrap">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{layout.phone || "Contact"}</span>
                  {layout.email && <span>• {layout.email}</span>}
                  {layout.website && <span>• {layout.website}</span>}
                </p>
              </div>
            </div>

            {/* Right: Treating Doctor credentials */}
            <div className="sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-200">
              <div
                className="inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider mb-1"
                style={{ background: `${primaryColor}15`, color: primaryColor }}
              >
                Treating Physician
              </div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">
                {prescription.doctorName.startsWith("Dr.") ? prescription.doctorName : `Dr. ${prescription.doctorName}`}
              </h2>
              {prescription.doctorSpecialization && (
                <p className="text-xs font-bold text-slate-600">
                  {prescription.doctorSpecialization}
                </p>
              )}
              {(prescription.doctorRegistration || layout.doctorRegistration) && (
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  Reg No: {prescription.doctorRegistration || layout.doctorRegistration}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Patient & Prescription Meta Ribbon */}
        <div
          className="p-5 sm:p-6 bg-slate-50 border-b grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium"
          style={{ borderColor: borderColor }}
        >
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
              Patient Name
            </span>
            <span className="text-sm font-black text-slate-900 block truncate">
              {prescription.patientName}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
              Age / Gender
            </span>
            <span className="text-sm font-black text-slate-900 block">
              {prescription.patientAge ? `${prescription.patientAge} yrs` : "—"} /{" "}
              {prescription.patientGender ? prescription.patientGender : "—"}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
              Date & Time
            </span>
            <span className="text-sm font-black text-slate-900 block">
              {formattedDate} · <span className="text-xs font-semibold text-slate-500">{formattedTime}</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
              Prescription ID
            </span>
            <span className="text-sm font-black font-mono text-emerald-700 block">
              {prescription.prescriptionNumber}
            </span>
          </div>
        </div>

        {/* Vitals Ribbon (if enabled in template sections and recorded) */}
        {layout.sections?.vitals !== false && prescription.vitals && Object.values(prescription.vitals).some(Boolean) && (
          <div
            className="px-6 py-3.5 border-b bg-emerald-50/40 flex flex-wrap items-center gap-6 text-xs"
            style={{ borderColor: borderColor }}
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              Patient Vitals
            </span>
            {prescription.vitals.bp && (
              <span className="font-bold text-slate-700">
                BP: <strong className="text-slate-950 font-black">{prescription.vitals.bp}</strong> mmHg
              </span>
            )}
            {prescription.vitals.pulse && (
              <span className="font-bold text-slate-700">
                Pulse: <strong className="text-slate-950 font-black">{prescription.vitals.pulse}</strong> bpm
              </span>
            )}
            {prescription.vitals.temperature && (
              <span className="font-bold text-slate-700">
                Temp: <strong className="text-slate-950 font-black">{prescription.vitals.temperature}</strong>
              </span>
            )}
            {prescription.vitals.spo2 && (
              <span className="font-bold text-slate-700">
                SpO2: <strong className="text-slate-950 font-black">{prescription.vitals.spo2}</strong>%
              </span>
            )}
            {prescription.vitals.weight && (
              <span className="font-bold text-slate-700">
                Weight: <strong className="text-slate-950 font-black">{prescription.vitals.weight}</strong> kg
              </span>
            )}
            {prescription.vitals.height && (
              <span className="font-bold text-slate-700">
                Height: <strong className="text-slate-950 font-black">{prescription.vitals.height}</strong>
              </span>
            )}
          </div>
        )}

        {/* Clinical Notes & Diagnosis */}
        {((layout.sections?.symptoms !== false && prescription.symptoms) || (layout.sections?.diagnosis !== false && prescription.diagnosis)) && (
          <div className="p-6 sm:p-8 border-b space-y-4" style={{ borderColor: borderColor }}>
            {layout.sections?.symptoms !== false && prescription.symptoms && (
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                  Symptoms & Chief Complaints
                </h4>
                <p className="text-sm font-semibold text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {prescription.symptoms}
                </p>
              </div>
            )}

            {layout.sections?.diagnosis !== false && prescription.diagnosis && (
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                  Clinical Diagnosis
                </h4>
                <p className="text-base font-extrabold text-slate-950 leading-relaxed bg-teal-50/50 p-3 rounded-xl border border-teal-100">
                  {prescription.diagnosis}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Prescription / Rx Section */}
        {layout.sections?.medicines !== false && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <span
                className="text-2xl sm:text-3xl font-serif font-black"
                style={{ color: primaryColor }}
              >
                ℞
              </span>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900">
                Prescribed Medications
              </h3>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      #
                    </th>
                    <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Medicine Name & Dosage
                    </th>
                    <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Frequency
                    </th>
                    <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Duration
                    </th>
                    <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Instructions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {prescription.medicines.map((med, index) => (
                    <tr key={index} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-400 tabular-nums">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <strong className="text-slate-900 font-extrabold block text-sm sm:text-base">
                          {med.name}
                        </strong>
                        {med.dosage && (
                          <span className="text-xs font-semibold text-emerald-700">
                            {med.dosage}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 font-extrabold text-slate-800 text-xs font-mono">
                          {med.frequency || "As directed"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {med.duration || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                        {med.timing && <span className="font-bold text-teal-700 block">{med.timing}</span>}
                        {med.instructions && <span>{med.instructions}</span>}
                        {!med.timing && !med.instructions && "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tests & Advice Section */}
        {((layout.sections?.tests !== false && prescription.tests && prescription.tests.length > 0) || (layout.sections?.advice !== false && prescription.advice)) && (
          <div className="px-6 sm:px-8 pb-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {layout.sections?.tests !== false && prescription.tests && prescription.tests.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-teal-600" />
                  Recommended Investigations / Lab Tests
                </h4>
                <ul className="space-y-1.5 text-xs sm:text-sm font-bold text-slate-800">
                  {prescription.tests.map((test, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      <span>{test}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {layout.sections?.advice !== false && prescription.advice && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  Dietary & General Advice
                </h4>
                <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">
                  {prescription.advice}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Doctor Signature & Clinic Stamp Box */}
        {layout.sections?.signature !== false && (
          <div className="px-6 sm:px-8 pb-8 pt-4 flex flex-col sm:flex-row items-end justify-between gap-6 border-t border-slate-100">
            <div className="w-full sm:w-auto text-xs text-slate-400">
              {layout.customText && (
                <p className="max-w-md italic mb-2">{layout.customText}</p>
              )}
              <p className="font-mono text-[11px]">
                Auth Hash: {prescription.id.slice(0, 16).toUpperCase()} • Kynisto Verified Record
              </p>
            </div>

            <div className="text-center sm:text-right shrink-0">
              <div className="w-48 h-16 border-b border-dashed border-slate-400 mb-2 flex items-end justify-center sm:justify-end pb-1">
                <span className="text-xs font-script italic text-slate-600">
                  Dr. {prescription.doctorName.replace(/^Dr\.\s*/i, "")}
                </span>
              </div>
              <p className="text-xs font-black text-slate-900">
                {prescription.doctorName.startsWith("Dr.") ? prescription.doctorName : `Dr. ${prescription.doctorName}`}
              </p>
              <p className="text-[11px] font-semibold text-slate-500">
                {prescription.doctorSpecialization || "Consultant Doctor"}
              </p>
              {(prescription.doctorRegistration || layout.doctorRegistration) && (
                <p className="text-[10px] font-mono text-slate-400">
                  Reg: {prescription.doctorRegistration || layout.doctorRegistration}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Legal Disclaimer Footer */}
        {layout.sections?.disclaimer !== false && (
          <div
            className="p-4 bg-slate-50 border-t text-center text-[10px] text-slate-500 leading-normal"
            style={{ borderColor: borderColor }}
          >
            {layout.disclaimer ||
              "This prescription is a valid digital medical document issued under Kynisto Healthcare protocols."}
          </div>
        )}
      </div>

      {/* Full-Page Detailed Viewer Modal */}
      {isFullscreenViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto no-print">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-6 my-8 max-h-[95vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  {prescription.prescriptionNumber}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  High-Fidelity Official Document Viewer
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreenViewer(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="w-full flex-1">
              <PrescriptionView prescription={prescription} showActions={false} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
