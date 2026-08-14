"use client";

import { useState, useCallback, useMemo } from "react";
import { Clock, Sun, Moon, Plus, Trash2, Copy, Check } from "lucide-react";

export type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export interface DaySchedule {
  closed: boolean;
  open: string;
  close: string;
  hasEvening: boolean;
  open2: string;
  close2: string;
}

export type WeeklySchedule = Record<DayKey, DaySchedule>;

export const DAYS: Array<{ key: DayKey; name: string; index: number }> = [
  { key: "sun", name: "Sunday", index: 0 },
  { key: "mon", name: "Monday", index: 1 },
  { key: "tue", name: "Tuesday", index: 2 },
  { key: "wed", name: "Wednesday", index: 3 },
  { key: "thu", name: "Thursday", index: 4 },
  { key: "fri", name: "Friday", index: 5 },
  { key: "sat", name: "Saturday", index: 6 },
];

export function parseWeeklySchedule(
  rawHours: unknown,
  rawOpeningDays?: unknown
): WeeklySchedule {
  const defaultSchedule: WeeklySchedule = {
    sun: { closed: false, open: "09:00", close: "21:00", hasEvening: false, open2: "17:00", close2: "20:00" },
    mon: { closed: false, open: "09:00", close: "21:00", hasEvening: false, open2: "17:00", close2: "20:00" },
    tue: { closed: false, open: "09:00", close: "21:00", hasEvening: false, open2: "17:00", close2: "20:00" },
    wed: { closed: false, open: "09:00", close: "21:00", hasEvening: false, open2: "17:00", close2: "20:00" },
    thu: { closed: false, open: "09:00", close: "21:00", hasEvening: false, open2: "17:00", close2: "20:00" },
    fri: { closed: false, open: "09:00", close: "21:00", hasEvening: false, open2: "17:00", close2: "20:00" },
    sat: { closed: false, open: "09:00", close: "21:00", hasEvening: false, open2: "17:00", close2: "20:00" },
  };

  let openDaysIndices: number[] = [0, 1, 2, 3, 4, 5, 6];
  if (Array.isArray(rawOpeningDays)) {
    openDaysIndices = rawOpeningDays.map(Number);
  } else if (typeof rawOpeningDays === "string") {
    try {
      const parsed = JSON.parse(rawOpeningDays);
      if (Array.isArray(parsed)) openDaysIndices = parsed.map(Number);
    } catch {
      // Keep all days open by default
    }
  }

  let parsedHoursObj: Record<string, any> = {};
  if (rawHours && typeof rawHours === "object") {
    parsedHoursObj = rawHours as Record<string, any>;
  } else if (typeof rawHours === "string") {
    try {
      parsedHoursObj = JSON.parse(rawHours);
    } catch {
      // Legacy text format or empty
    }
  }

  const result: WeeklySchedule = { ...defaultSchedule };

  DAYS.forEach(({ key, index }) => {
    const dayData = parsedHoursObj[key] || parsedHoursObj[key.toUpperCase()] || parsedHoursObj[index];
    const isDayOpen = openDaysIndices.includes(index);

    if (dayData) {
      const isClosed = dayData.closed === true || !isDayOpen;
      const open1 = dayData.open || "09:00";
      const close1 = dayData.close || "21:00";
      const hasEve = Boolean(dayData.open2 && dayData.close2);
      const open2 = dayData.open2 || "17:00";
      const close2 = dayData.close2 || "20:00";

      result[key] = {
        closed: isClosed,
        open: open1,
        close: close1,
        hasEvening: hasEve,
        open2,
        close2,
      };
    } else {
      result[key] = {
        ...defaultSchedule[key],
        closed: !isDayOpen,
      };
    }
  });

  return result;
}

export function WeeklyScheduleEditor({
  initialHours,
  initialOpeningDays,
  onChange,
}: {
  initialHours?: unknown;
  initialOpeningDays?: unknown;
  onChange?: (schedule: WeeklySchedule, jsonHours: string, openingDays: number[]) => void;
}) {
  const [schedule, setSchedule] = useState<WeeklySchedule>(() =>
    parseWeeklySchedule(initialHours, initialOpeningDays)
  );
  const [copiedMsg, setCopiedMsg] = useState("");

  const updateDay = useCallback(
    (key: DayKey, patch: Partial<DaySchedule>) => {
      setSchedule((prev) => {
        const next = {
          ...prev,
          [key]: { ...prev[key], ...patch },
        };
        return next;
      });
    },
    []
  );

  // Serialized output for forms
  const { jsonHours, openDaysList, firstOpen, firstClose } = useMemo(() => {
    const serializable: Record<string, any> = {};
    const openDays: number[] = [];

    DAYS.forEach(({ key, index }) => {
      const day = schedule[key];
      if (day.closed) {
        serializable[key] = { closed: true };
      } else {
        openDays.push(index);
        serializable[key] = {
          open: day.open,
          close: day.close,
          closed: false,
          ...(day.hasEvening
            ? { open2: day.open2, close2: day.close2 }
            : {}),
        };
      }
    });

    const json = JSON.stringify(serializable);
    const firstActive = DAYS.find((d) => !schedule[d.key].closed);
    const firstO = firstActive ? schedule[firstActive.key].open : "09:00";
    const firstC = firstActive ? (schedule[firstActive.key].hasEvening ? schedule[firstActive.key].close2 : schedule[firstActive.key].close) : "21:00";

    return {
      jsonHours: json,
      openDaysList: openDays,
      firstOpen: firstO,
      firstClose: firstC,
    };
  }, [schedule]);

  const applyPresetSplit = () => {
    setSchedule({
      sun: { closed: false, open: "09:00", close: "14:00", hasEvening: true, open2: "17:00", close2: "20:00" },
      mon: { closed: false, open: "09:00", close: "14:00", hasEvening: true, open2: "17:00", close2: "20:00" },
      tue: { closed: false, open: "09:00", close: "14:00", hasEvening: true, open2: "17:00", close2: "20:00" },
      wed: { closed: false, open: "09:00", close: "14:00", hasEvening: true, open2: "17:00", close2: "20:00" },
      thu: { closed: false, open: "09:00", close: "14:00", hasEvening: true, open2: "17:00", close2: "20:00" },
      fri: { closed: false, open: "09:00", close: "14:00", hasEvening: true, open2: "17:00", close2: "20:00" },
      sat: { closed: false, open: "09:00", close: "14:00", hasEvening: true, open2: "17:00", close2: "20:00" },
    });
    setCopiedMsg("Split schedule applied (9 AM–2 PM & 5 PM–8 PM)");
    setTimeout(() => setCopiedMsg(""), 2500);
  };

  const applyPresetFullDay = () => {
    setSchedule({
      sun: { closed: false, open: "09:00", close: "21:00", hasEvening: false, open2: "17:00", close2: "20:00" },
      mon: { closed: false, open: "09:00", close: "21:00", hasEvening: false, open2: "17:00", close2: "20:00" },
      tue: { closed: false, open: "09:00", close: "21:00", hasEvening: false, open2: "17:00", close2: "20:00" },
      wed: { closed: false, open: "09:00", close: "21:00", hasEvening: false, open2: "17:00", close2: "20:00" },
      thu: { closed: false, open: "09:00", close: "21:00", hasEvening: false, open2: "17:00", close2: "20:00" },
      fri: { closed: false, open: "09:00", close: "21:00", hasEvening: false, open2: "17:00", close2: "20:00" },
      sat: { closed: false, open: "09:00", close: "21:00", hasEvening: false, open2: "17:00", close2: "20:00" },
    });
    setCopiedMsg("All-day schedule applied (9 AM–9 PM)");
    setTimeout(() => setCopiedMsg(""), 2500);
  };

  const copyDayToAll = (sourceKey: DayKey) => {
    const src = schedule[sourceKey];
    const updated: WeeklySchedule = {} as WeeklySchedule;
    DAYS.forEach(({ key }) => {
      updated[key] = { ...src };
    });
    setSchedule(updated);
    setCopiedMsg(`Applied ${DAYS.find((d) => d.key === sourceKey)?.name} timings to all days`);
    setTimeout(() => setCopiedMsg(""), 2500);
  };

  return (
    <div className="weeklyScheduleContainer full" style={{ marginTop: "12px", marginBottom: "16px" }}>
      {/* Hidden inputs to feed standard form serialization */}
      <input type="hidden" name="businessHours" value={jsonHours} />
      <input type="hidden" name="openTime" value={firstOpen} />
      <input type="hidden" name="closeTime" value={firstClose} />
      {openDaysList.map((d) => (
        <input key={d} type="hidden" name="openingDay" value={d} />
      ))}

      {/* Header & Quick presets */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "16px",
          paddingBottom: "12px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={20} color="#FF7A00" />
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#f8fafc" }}>
              Weekly Timings &amp; Split Shift Schedule
            </h3>
          </div>
          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
            Configure custom morning and evening shifts separately for each day.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={applyPresetSplit}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              background: "rgba(255, 122, 0, 0.15)",
              border: "1px solid rgba(255, 122, 0, 0.35)",
              color: "#FF8A00",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            ☀️🌙 9am–2pm &amp; 5pm–8pm
          </button>
          <button
            type="button"
            onClick={applyPresetFullDay}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              background: "rgba(59, 130, 246, 0.15)",
              border: "1px solid rgba(59, 130, 246, 0.35)",
              color: "#60a5fa",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            ⚡ Full Day 9am–9pm
          </button>
        </div>
      </div>

      {copiedMsg && (
        <div
          style={{
            background: "rgba(34, 197, 94, 0.15)",
            border: "1px solid rgba(34, 197, 94, 0.4)",
            color: "#4ade80",
            padding: "8px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Check size={14} />
          {copiedMsg}
        </div>
      )}

      {/* Days List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {DAYS.map(({ key, name }) => {
          const day = schedule[key];
          return (
            <div
              key={key}
              style={{
                background: day.closed ? "rgba(15, 23, 42, 0.4)" : "rgba(30, 41, 59, 0.7)",
                border: day.closed
                  ? "1px solid rgba(255, 255, 255, 0.05)"
                  : "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "12px",
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                opacity: day.closed ? 0.65 : 1,
                transition: "all 0.15s ease",
              }}
            >
              {/* Day Header Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => updateDay(key, { closed: !day.closed })}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      border: "none",
                      cursor: "pointer",
                      background: day.closed ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.2)",
                      color: day.closed ? "#f87171" : "#4ade80",
                    }}
                  >
                    {day.closed ? "Closed" : "Open"}
                  </button>
                  <strong style={{ fontSize: "14px", color: day.closed ? "#94a3b8" : "#ffffff" }}>
                    {name}
                  </strong>
                </div>

                {!day.closed && (
                  <button
                    type="button"
                    title={`Apply ${name} timings to all days`}
                    onClick={() => copyDayToAll(key)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      fontSize: "11px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#FF8A00")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#94a3b8")}
                  >
                    <Copy size={12} />
                    Copy to all days
                  </button>
                )}
              </div>

              {/* Timing Controls (if open) */}
              {!day.closed && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {/* Shift 1: Morning / Primary Shift */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "8px",
                      background: "rgba(15, 23, 42, 0.5)",
                      padding: "8px 12px",
                      borderRadius: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#fbbf24",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        minWidth: "120px",
                      }}
                    >
                      <Sun size={14} /> Morning Shift:
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="time"
                        value={day.open}
                        onChange={(e) => updateDay(key, { open: e.target.value })}
                        style={{
                          background: "#0f172a",
                          color: "#ffffff",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "6px",
                          padding: "4px 8px",
                          fontSize: "13px",
                        }}
                      />
                      <span style={{ color: "#94a3b8", fontSize: "12px" }}>to</span>
                      <input
                        type="time"
                        value={day.close}
                        onChange={(e) => updateDay(key, { close: e.target.value })}
                        style={{
                          background: "#0f172a",
                          color: "#ffffff",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "6px",
                          padding: "4px 8px",
                          fontSize: "13px",
                        }}
                      />
                    </div>

                    {!day.hasEvening && (
                      <button
                        type="button"
                        onClick={() =>
                          updateDay(key, {
                            hasEvening: true,
                            close: day.close === "21:00" ? "14:00" : day.close,
                          })
                        }
                        style={{
                          marginLeft: "auto",
                          background: "rgba(255, 122, 0, 0.1)",
                          border: "1px dashed rgba(255, 122, 0, 0.4)",
                          color: "#FF8A00",
                          borderRadius: "6px",
                          padding: "4px 8px",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Plus size={12} /> Add Evening Shift
                      </button>
                    )}
                  </div>

                  {/* Shift 2: Evening Shift */}
                  {day.hasEvening && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "8px",
                        background: "rgba(15, 23, 42, 0.5)",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        borderLeft: "2px solid #818cf8",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#a5b4fc",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          minWidth: "120px",
                        }}
                      >
                        <Moon size={14} /> Evening Shift:
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <input
                          type="time"
                          value={day.open2}
                          onChange={(e) => updateDay(key, { open2: e.target.value })}
                          style={{
                            background: "#0f172a",
                            color: "#ffffff",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "13px",
                          }}
                        />
                        <span style={{ color: "#94a3b8", fontSize: "12px" }}>to</span>
                        <input
                          type="time"
                          value={day.close2}
                          onChange={(e) => updateDay(key, { close2: e.target.value })}
                          style={{
                            background: "#0f172a",
                            color: "#ffffff",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "13px",
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        title="Remove Evening Shift"
                        onClick={() => updateDay(key, { hasEvening: false })}
                        style={{
                          marginLeft: "auto",
                          background: "transparent",
                          border: "none",
                          color: "#f87171",
                          cursor: "pointer",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "11px",
                        }}
                      >
                        <Trash2 size={13} />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
