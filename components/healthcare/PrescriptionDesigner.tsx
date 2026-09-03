"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Palette,
  Layout as LayoutIcon,
  Type,
  Layers,
  Sparkles,
  RotateCcw,
  RotateCw,
  Save,
  CheckCircle2,
  Eye,
  Building2,
  Stethoscope,
  Move,
  Trash2,
  Copy,
  Upload,
  AlertCircle,
  Plus,
  Maximize2,
  Minimize2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import {
  getDefaultTemplateLayout,
  type PrescriptionTemplateLayout,
  type PrescriptionRecord,
  type CanvasElement,
} from "@/lib/prescriptions";
import { PrescriptionView } from "./PrescriptionView";

interface PrescriptionDesignerProps {
  storeId: string;
  storeName?: string;
  onToast?: (msg: string) => void;
}

type DesignerTab = "templates" | "elements" | "text" | "branding" | "layout";

const PRESET_TEMPLATES: {
  id: string;
  name: string;
  desc: string;
  previewColor: string;
  config: Partial<PrescriptionTemplateLayout>;
}[] = [
  {
    id: "modern_emerald",
    name: "Modern Emerald",
    desc: "Vibrant teal-emerald tones with crisp two-column layout.",
    previewColor: "#0f766e",
    config: {
      primaryColor: "#0f766e",
      secondaryColor: "#06b6d4",
      headerLayout: "two_column",
      borderStyle: "subtle",
      fontFamily: "Inter, sans-serif",
      titleFontSize: 24,
      headerFontSize: 15,
      bodyFontSize: 13,
      footerFontSize: 11,
    },
  },
  {
    id: "classic_clinical",
    name: "Classic Clinical Blue",
    desc: "Authoritative medical blue with structured borders.",
    previewColor: "#1d4ed8",
    config: {
      primaryColor: "#1d4ed8",
      secondaryColor: "#0284c7",
      headerLayout: "two_column",
      borderStyle: "solid",
      fontFamily: "Roboto, sans-serif",
      titleFontSize: 24,
      headerFontSize: 15,
      bodyFontSize: 13,
      footerFontSize: 11,
    },
  },
  {
    id: "minimal_rx",
    name: "Minimalist Monolith",
    desc: "Ultra-clean black & slate styling with generous whitespace.",
    previewColor: "#0f172a",
    config: {
      primaryColor: "#0f172a",
      secondaryColor: "#475569",
      headerLayout: "left",
      borderStyle: "none",
      fontFamily: "Inter, sans-serif",
      titleFontSize: 22,
      headerFontSize: 14,
      bodyFontSize: 13,
      footerFontSize: 11,
    },
  },
  {
    id: "academic_serif",
    name: "Heritage Medical",
    desc: "Prestigious serif typography with centered crest header.",
    previewColor: "#064e3b",
    config: {
      primaryColor: "#064e3b",
      secondaryColor: "#b45309",
      headerLayout: "center",
      borderStyle: "double",
      fontFamily: "Merriweather, serif",
      titleFontSize: 26,
      headerFontSize: 16,
      bodyFontSize: 13,
      footerFontSize: 11,
    },
  },
];

export function PrescriptionDesigner({
  storeId,
  storeName = "Clinic",
  onToast,
}: PrescriptionDesignerProps) {
  const [activeTab, setActiveTab] = useState<DesignerTab>("branding");
  const [layout, setLayout] = useState<PrescriptionTemplateLayout>(() =>
    getDefaultTemplateLayout({ name: storeName })
  );

  // Undo / Redo history
  const [history, setHistory] = useState<PrescriptionTemplateLayout[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Element Selection & Manipulation
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const dragStartPos = useRef<{ mouseX: number; mouseY: number; elX: number; elY: number } | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const [templateName, setTemplateName] = useState("Standard Clinic Template");
  const [isDefault, setIsDefault] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load existing template from server
  useEffect(() => {
    let mounted = true;
    apiFetch<{ template: { name: string; layout: PrescriptionTemplateLayout; isDefault: boolean } }>(
      `/api/healthcare/prescription-templates?storeId=${encodeURIComponent(storeId)}`
    )
      .then((res) => {
        if (!mounted) return;
        if (res?.template?.layout) {
          setLayout(res.template.layout);
          setTemplateName(res.template.name || "Clinic Prescription Template");
          setIsDefault(Boolean(res.template.isDefault));
          setHistory([res.template.layout]);
          setHistoryIndex(0);
        }
      })
      .catch(() => {
        // use default
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [storeId]);

  const updateLayout = useCallback(
    (updater: (prev: PrescriptionTemplateLayout) => PrescriptionTemplateLayout) => {
      setLayout((prev) => {
        const next = updater(prev);
        // Push to history
        setHistory((h) => {
          const cut = h.slice(0, historyIndex + 1);
          return [...cut, next].slice(-30);
        });
        setHistoryIndex((i) => i + 1);
        return next;
      });
    },
    [historyIndex]
  );

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setLayout(prev);
      setHistoryIndex((i) => i - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setLayout(next);
      setHistoryIndex((i) => i + 1);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/healthcare/prescription-templates", {
        method: "POST",
        json: {
          storeId,
          name: templateName,
          layout,
          isDefault,
        },
      });
      const msg = isDefault
        ? "Prescription design saved & set as default template!"
        : "Prescription template saved successfully!";
      setToastMessage(msg);
      if (onToast) onToast(msg);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      alert(err?.message || "Failed to save template.");
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: (typeof PRESET_TEMPLATES)[0]) => {
    updateLayout((prev) => ({
      ...prev,
      ...preset.config,
    }));
  };

  // Canvas Elements Operations: Add, Move, Resize, Delete, Duplicate
  const handleAddElement = (type: CanvasElement["type"], label: string, content?: string) => {
    const newEl: CanvasElement = {
      id: `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      label,
      content: content || label,
      color: layout.primaryColor,
      fontSize: type === "badge" ? 22 : type === "stamp" ? 11 : 13,
      x: 150 + Math.floor(Math.random() * 80),
      y: 160 + Math.floor(Math.random() * 80),
      width: type === "stamp" ? 120 : type === "badge" ? 40 : 220,
      height: 36,
      visible: true,
    };
    updateLayout((prev) => ({
      ...prev,
      elements: [...(prev.elements || []), newEl],
    }));
    setSelectedElementId(newEl.id);
  };

  const handleMoveElement = (id: string, deltaX: number, deltaY: number) => {
    updateLayout((prev) => ({
      ...prev,
      elements: (prev.elements || []).map((el) => {
        if (el.id !== id) return el;
        const newX = Math.max(0, Math.min(720, el.x + deltaX));
        const newY = Math.max(0, Math.min(1000, el.y + deltaY));
        return { ...el, x: newX, y: newY };
      }),
    }));
  };

  const handleResizeElement = (id: string, deltaSize: number) => {
    updateLayout((prev) => ({
      ...prev,
      elements: (prev.elements || []).map((el) => {
        if (el.id !== id) return el;
        const newFontSize = Math.max(9, Math.min(36, (el.fontSize || 13) + deltaSize));
        const newWidth = el.width ? Math.max(30, el.width + deltaSize * 8) : undefined;
        return { ...el, fontSize: newFontSize, width: newWidth };
      }),
    }));
  };

  const handleDeleteElement = (id: string) => {
    updateLayout((prev) => ({
      ...prev,
      elements: (prev.elements || []).filter((el) => el.id !== id),
    }));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const handleDuplicateElement = (id: string) => {
    const target = (layout.elements || []).find((el) => el.id === id);
    if (!target) return;
    const clone: CanvasElement = {
      ...target,
      id: `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      x: Math.min(700, target.x + 25),
      y: Math.min(950, target.y + 25),
    };
    updateLayout((prev) => ({
      ...prev,
      elements: [...(prev.elements || []), clone],
    }));
    setSelectedElementId(clone.id);
  };

  // Drag & Drop event handlers on the live canvas
  const handleCanvasMouseDown = (e: React.MouseEvent, elId: string) => {
    e.stopPropagation();
    setSelectedElementId(elId);
    const targetEl = (layout.elements || []).find((el) => el.id === elId);
    if (!targetEl) return;
    setIsDraggingElement(true);
    dragStartPos.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elX: targetEl.x,
      elY: targetEl.y,
    };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingElement || !selectedElementId || !dragStartPos.current) return;
    const deltaX = e.clientX - dragStartPos.current.mouseX;
    const deltaY = e.clientY - dragStartPos.current.mouseY;
    const targetX = Math.max(10, Math.min(720, dragStartPos.current.elX + deltaX));
    const targetY = Math.max(10, Math.min(1000, dragStartPos.current.elY + deltaY));

    setLayout((prev) => ({
      ...prev,
      elements: (prev.elements || []).map((el) =>
        el.id === selectedElementId ? { ...el, x: targetX, y: targetY } : el
      ),
    }));
  };

  const handleCanvasMouseUp = () => {
    if (isDraggingElement) {
      setIsDraggingElement(false);
      dragStartPos.current = null;
      // Record in undo history
      updateLayout((prev) => ({ ...prev }));
    }
  };

  // Mock record for live preview
  const mockRecord: PrescriptionRecord = {
    id: "preview-id",
    prescriptionNumber: "RX-2026-92841",
    storeId,
    storeName: layout.clinicName || storeName,
    doctorName: "Dr. Sharma",
    doctorSpecialization: "MD, Consultant Physician",
    patientName: "Rahul Verma",
    patientAge: 38,
    patientGender: "Male",
    vitals: {
      bp: "120/80",
      pulse: "72",
      temperature: "98.4°F",
      weight: "70",
      spo2: "99",
    },
    symptoms: "Mild fever, sore throat, and nasal congestion for 3 days",
    diagnosis: "Acute Viral Pharyngitis (Upper Respiratory)",
    medicines: [
      {
        name: "Amoxicillin 500mg",
        dosage: "1 Capsule",
        frequency: "1-0-1",
        duration: "5 days",
        timing: "After food",
        instructions: "Complete full 5-day course",
      },
      {
        name: "Paracetamol 650mg",
        dosage: "1 Tab",
        frequency: "SOS",
        duration: "3 days",
        timing: "After food",
        instructions: "Take SOS if body temp > 100°F",
      },
      {
        name: "Levocetirizine 5mg",
        dosage: "1 Tab",
        frequency: "0-0-1",
        duration: "5 days",
        timing: "At bedtime",
        instructions: "May cause slight drowsiness",
      },
    ],
    tests: ["Complete Blood Count (CBC)", "Throat Swab Culture"],
    advice: "Drink plenty of warm liquids. Avoid cold drinks. Get adequate bed rest.",
    templateSnapshot: layout,
    status: "issued",
    issuedAt: Math.floor(Date.now() / 1000),
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000),
  };

  const selectedEl = (layout.elements || []).find((el) => el.id === selectedElementId);

  if (loading) {
    return <div className="portalSkeleton"><span /><span /><span /></div>;
  }

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Top Designer Toolbar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-200">
              Canva-like Visual Editor
            </span>
            <span className="text-xs font-bold text-slate-500">• Live A4 Canvas</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Prescription Designer
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Customize the official clinic letterhead once. The system automatically renders all future doctor prescriptions using this design.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {/* Undo / Redo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 cursor-pointer"
            title="Undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 cursor-pointer"
            title="Redo"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Set as Default Toggle */}
          <button
            type="button"
            onClick={() => setIsDefault(!isDefault)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isDefault
                ? "bg-teal-50 text-teal-800 border border-teal-300 font-black"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
            }`}
            title="Set this design as clinic's active default"
          >
            <Check className={`w-3.5 h-3.5 ${isDefault ? "text-teal-600" : "text-slate-400"}`} />
            <span>{isDefault ? "Default Template" : "Set as Default"}</span>
          </button>

          {/* Preview Action */}
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Template"}</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Studio: Left Inspector Controls | Right Live A4 Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Category Tabs & Inspector Controls */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-5">
          {/* Category Navigation Strip */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-100 no-scrollbar">
            {[
              { id: "templates", label: "Templates", icon: LayoutIcon },
              { id: "elements", label: "Elements", icon: Sparkles },
              { id: "text", label: "Text", icon: Type },
              { id: "branding", label: "Branding", icon: Palette },
              { id: "layout", label: "Layout", icon: Layers },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id as DesignerTab)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  activeTab === id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Tab 1: Templates (Presets) */}
          {activeTab === "templates" && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Preset Styles
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                {PRESET_TEMPLATES.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500/50 bg-slate-50 hover:bg-white text-left transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div>
                      <strong className="text-sm font-black text-slate-900 group-hover:text-emerald-700 block">
                        {preset.name}
                      </strong>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {preset.desc}
                      </p>
                    </div>
                    <span
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm shrink-0"
                      style={{ backgroundColor: preset.previewColor }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Elements (Add Badges, Stamps, Notes + Section Toggles) */}
          {activeTab === "elements" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Add Canvas Elements
                </h3>
                <p className="text-[11px] text-slate-400 mb-3">
                  Click to add floating badges, stamps, or notes. Drag & drop them anywhere on the A4 canvas.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddElement("badge", "℞ Medical Rx", "℞")}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-emerald-700 text-lg font-serif font-black">℞</span>
                    <span>+ Rx Symbol</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddElement("stamp", "Official Stamp", "VERIFIED RX")}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>+ Official Stamp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddElement("text", "Custom Note", "Consultation Valid For 7 Days")}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Type className="w-4 h-4 text-teal-600" />
                    <span>+ Custom Note</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddElement("stamp", "Urgent Badge", "URGENT")}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-rose-600" />
                    <span>+ Urgent Badge</span>
                  </button>
                </div>
              </div>

              {/* Selected Element Controls: Move, Resize, Duplicate, Delete */}
              {selectedEl && (
                <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-teal-900">
                      Selected Element: {selectedEl.label || selectedEl.type}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedElementId(null)}
                      className="text-[11px] text-teal-700 hover:text-teal-900 font-bold"
                    >
                      Deselect
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Move Controls */}
                    <div className="p-2 bg-white rounded-xl border border-teal-100 flex items-center justify-between">
                      <span className="font-bold text-slate-600">Move:</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveElement(selectedEl.id, -15, 0)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200"
                          title="Move Left"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveElement(selectedEl.id, 15, 0)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200"
                          title="Move Right"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveElement(selectedEl.id, 0, -15)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveElement(selectedEl.id, 0, 15)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Resize Controls */}
                    <div className="p-2 bg-white rounded-xl border border-teal-100 flex items-center justify-between">
                      <span className="font-bold text-slate-600">Resize:</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleResizeElement(selectedEl.id, -2)}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-bold"
                          title="Decrease Size"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResizeElement(selectedEl.id, 2)}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-bold"
                          title="Increase Size"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleDuplicateElement(selectedEl.id)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-teal-200 flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteElement(selectedEl.id)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sections Toggles */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                  Toggle Prescription Sections
                </h3>
                <div className="space-y-1.5">
                  {[
                    { key: "vitals", label: "Patient Vitals (BP, Pulse, Temp, SpO2)" },
                    { key: "symptoms", label: "Symptoms & Chief Complaints" },
                    { key: "diagnosis", label: "Clinical Diagnosis Box" },
                    { key: "medicines", label: "Medicines (Rx) Table" },
                    { key: "tests", label: "Investigations / Lab Tests" },
                    { key: "advice", label: "Dietary & Lifestyle Advice" },
                    { key: "signature", label: "Doctor Signature Block" },
                    { key: "disclaimer", label: "Legal Disclaimer Footer" },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-between cursor-pointer text-xs font-bold text-slate-800 transition-colors"
                    >
                      <span>{label}</span>
                      <input
                        type="checkbox"
                        checked={(layout.sections as any)[key] !== false}
                        onChange={(e) =>
                          updateLayout((p) => ({
                            ...p,
                            sections: { ...p.sections, [key]: e.target.checked },
                          }))
                        }
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Text & Typography (Doctor Header, Reg, Custom Text, Disclaimer, Font Sizes) */}
          {activeTab === "text" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Doctor Header Title
                </label>
                <input
                  type="text"
                  value={layout.doctorHeader || ""}
                  onChange={(e) =>
                    updateLayout((p) => ({ ...p, doctorHeader: e.target.value }))
                  }
                  placeholder="Consultant Physician & Surgeon"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Registration / Council Number Prefix
                </label>
                <input
                  type="text"
                  value={layout.doctorRegistration || ""}
                  onChange={(e) =>
                    updateLayout((p) => ({ ...p, doctorRegistration: e.target.value }))
                  }
                  placeholder="REG-MED-IN-..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Custom Header Note / Emergency Notice
                </label>
                <textarea
                  rows={2}
                  value={layout.customText || ""}
                  onChange={(e) =>
                    updateLayout((p) => ({ ...p, customText: e.target.value }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Footer Legal Disclaimer
                </label>
                <textarea
                  rows={3}
                  value={layout.disclaimer || ""}
                  onChange={(e) =>
                    updateLayout((p) => ({ ...p, disclaimer: e.target.value }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>

              {/* Font Sizes Customization */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                  Font Sizes (px)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block">Title</label>
                    <input
                      type="number"
                      min="18"
                      max="32"
                      value={layout.titleFontSize || 24}
                      onChange={(e) =>
                        updateLayout((p) => ({ ...p, titleFontSize: Number(e.target.value) }))
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block">Header</label>
                    <input
                      type="number"
                      min="12"
                      max="20"
                      value={layout.headerFontSize || 15}
                      onChange={(e) =>
                        updateLayout((p) => ({ ...p, headerFontSize: Number(e.target.value) }))
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block">Body</label>
                    <input
                      type="number"
                      min="11"
                      max="16"
                      value={layout.bodyFontSize || 13}
                      onChange={(e) =>
                        updateLayout((p) => ({ ...p, bodyFontSize: Number(e.target.value) }))
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block">Footer</label>
                    <input
                      type="number"
                      min="9"
                      max="14"
                      value={layout.footerFontSize || 11}
                      onChange={(e) =>
                        updateLayout((p) => ({ ...p, footerFontSize: Number(e.target.value) }))
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Branding (Clinic Info, Logo, Colors, Website) */}
          {activeTab === "branding" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Clinic Brand Name
                </label>
                <input
                  type="text"
                  value={layout.clinicName}
                  onChange={(e) =>
                    updateLayout((p) => ({ ...p, clinicName: e.target.value }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Clinic Tagline / Department
                </label>
                <input
                  type="text"
                  value={layout.tagline || ""}
                  onChange={(e) =>
                    updateLayout((p) => ({ ...p, tagline: e.target.value }))
                  }
                  placeholder="e.g. Center for Family Medicine & Cardiology"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Clinic Logo URL
                  </label>
                  <input
                    type="text"
                    value={layout.logoUrl || ""}
                    onChange={(e) =>
                      updateLayout((p) => ({ ...p, logoUrl: e.target.value }))
                    }
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Clinic Website
                  </label>
                  <input
                    type="text"
                    value={layout.website || ""}
                    onChange={(e) =>
                      updateLayout((p) => ({ ...p, website: e.target.value }))
                    }
                    placeholder="https://kynisto.in"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={layout.primaryColor}
                      onChange={(e) =>
                        updateLayout((p) => ({ ...p, primaryColor: e.target.value }))
                      }
                      className="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={layout.primaryColor}
                      onChange={(e) =>
                        updateLayout((p) => ({ ...p, primaryColor: e.target.value }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={layout.secondaryColor}
                      onChange={(e) =>
                        updateLayout((p) => ({ ...p, secondaryColor: e.target.value }))
                      }
                      className="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={layout.secondaryColor}
                      onChange={(e) =>
                        updateLayout((p) => ({ ...p, secondaryColor: e.target.value }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Clinic Address
                </label>
                <input
                  type="text"
                  value={layout.address}
                  onChange={(e) =>
                    updateLayout((p) => ({ ...p, address: e.target.value }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={layout.phone}
                    onChange={(e) =>
                      updateLayout((p) => ({ ...p, phone: e.target.value }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Email
                  </label>
                  <input
                    type="text"
                    value={layout.email || ""}
                    onChange={(e) =>
                      updateLayout((p) => ({ ...p, email: e.target.value }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Layout & Margins */}
          {activeTab === "layout" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Header Style
                </label>
                <select
                  value={layout.headerLayout}
                  onChange={(e) =>
                    updateLayout((p) => ({
                      ...p,
                      headerLayout: e.target.value as any,
                    }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="two_column">Two-Column (Clinic Left, Doctor Right)</option>
                  <option value="center">Centered Letterhead (Formal Crest)</option>
                  <option value="left">Left Aligned Minimal</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Typography / Font Family
                </label>
                <select
                  value={layout.fontFamily}
                  onChange={(e) =>
                    updateLayout((p) => ({ ...p, fontFamily: e.target.value }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="Inter, sans-serif">Inter (Modern & Clean)</option>
                  <option value="Roboto, sans-serif">Roboto (Structured Clinical)</option>
                  <option value="Merriweather, serif">Merriweather (Heritage Serif)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Border Style
                </label>
                <select
                  value={layout.borderStyle}
                  onChange={(e) =>
                    updateLayout((p) => ({
                      ...p,
                      borderStyle: e.target.value as any,
                    }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="subtle">Subtle Line</option>
                  <option value="solid">Solid Accent</option>
                  <option value="double">Double Medical Rule</option>
                  <option value="none">No Border</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                  Canvas Margins & Gap (px)
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block">Top/Bottom</label>
                    <input
                      type="number"
                      min="10"
                      max="60"
                      value={layout.margins.top}
                      onChange={(e) =>
                        updateLayout((p) => ({
                          ...p,
                          margins: { ...p.margins, top: Number(e.target.value), bottom: Number(e.target.value) },
                        }))
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block">Section Gap</label>
                    <input
                      type="number"
                      min="8"
                      max="40"
                      value={layout.spacing.sectionGap}
                      onChange={(e) =>
                        updateLayout((p) => ({
                          ...p,
                          spacing: { ...p.spacing, sectionGap: Number(e.target.value) },
                        }))
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Interactive Live A4 Canvas */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-wider mb-2 px-2">
            <span>Live A4 Paper Canvas (Interactive Drag & Drop)</span>
            <span>{selectedElementId ? "Element Selected" : "Click element to edit"}</span>
          </div>

          <div
            ref={canvasContainerRef}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            className="w-full scale-[0.88] origin-top shadow-2xl rounded-2xl overflow-hidden border border-slate-200 relative select-none"
          >
            {/* Interactive draggable elements layer over the canvas */}
            {layout.elements &&
              layout.elements
                .filter((el) => el.visible !== false)
                .map((el) => {
                  const isSelected = selectedElementId === el.id;
                  return (
                    <div
                      key={el.id}
                      onMouseDown={(e) => handleCanvasMouseDown(e, el.id)}
                      className={`absolute z-30 cursor-move font-black px-2.5 py-1 rounded-lg border text-center transition-shadow ${
                        isSelected
                          ? "ring-2 ring-emerald-500 ring-offset-2 shadow-lg scale-105"
                          : "hover:ring-1 hover:ring-slate-400 shadow-xs"
                      }`}
                      style={{
                        left: `${el.x}px`,
                        top: `${el.y}px`,
                        color: el.color || layout.primaryColor,
                        borderColor: el.color || layout.primaryColor,
                        fontSize: el.fontSize ? `${el.fontSize}px` : "13px",
                        backgroundColor: `${el.color || layout.primaryColor}15`,
                        transform: el.type === "stamp" ? "rotate(-7deg)" : undefined,
                        minWidth: el.width ? `${el.width}px` : undefined,
                      }}
                      title="Drag to reposition or click to edit"
                    >
                      {el.content || el.label || "℞"}
                    </div>
                  );
                })}

            <PrescriptionView prescription={mockRecord} showActions={false} />
          </div>
        </div>
      </div>

      {/* Full Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl p-6 my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <h3 className="text-lg font-black text-slate-900">
                100% Scale Printable Preview
              </h3>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Close Preview
              </button>
            </div>
            <PrescriptionView prescription={mockRecord} showActions={true} />
          </div>
        </div>
      )}
    </div>
  );
}
