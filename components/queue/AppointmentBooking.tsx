'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Calendar, Clock, User, ChevronRight, ArrowLeft, CheckCircle2, XCircle, RefreshCw, Stethoscope } from 'lucide-react';
import { apiFetch } from '@/lib/client-api';

// ---- Types ----------------------------------------------------------------

interface Doctor {
  id: string;
  name: string;
  specialization?: string;
  consultationMinutes?: number;
  consultationFee?: number;
}

interface SlotItem {
  time: string;
  available: boolean;
}

interface Appointment {
  id: string;
  storeId: string;
  storeName: string;
  appointmentDate: string;
  timeSlot: string;
  durationMinutes: number;
  status: 'booked' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
  doctorId?: string;
  doctorName?: string;
  doctorSpecialization?: string;
  patientName?: string;
  notes?: string;
  queueEntryId?: string;
}

type BookingStep = 'doctor' | 'date' | 'slot' | 'confirm' | 'success';

interface Props {
  storeId: string;
  storeName: string;
  allowAppointments?: boolean;
  onClose: () => void;
  onCheckedIn?: (tokenNumber: number) => void;
}

// ---- Helper ---------------------------------------------------------------

function todayIst() {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function formatDate(d: string) {
  if (!d) return '';
  try {
    const parts = d.split('-').map(Number);
    if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return d;
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    return dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' });
  } catch {
    return d;
  }
}

function addDays(dateStr: string, n: number) {
  try {
    const parts = dateStr.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2] + n);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  } catch {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }
}

function next14Days() {
  const today = todayIst();
  return Array.from({ length: 14 }, (_, i) => addDays(today, i));
}

// ---- Component ------------------------------------------------------------

export function AppointmentBooking({ storeId, storeName, allowAppointments, onClose, onCheckedIn }: Props) {
  const [step, setStep] = useState<BookingStep>('doctor');
  const [appointmentsDisabled, setAppointmentsDisabled] = useState<boolean>(allowAppointments === false);
  const [disabledMessage, setDisabledMessage] = useState<string>('This clinic is not accepting online appointments at this time.');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [patientName, setPatientName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookedAppt, setBookedAppt] = useState<{ id: string; tokenNumber?: number } | null>(null);
  const [error, setError] = useState('');

  // Load doctors on mount
  useEffect(() => {
    if (allowAppointments === false) {
      setAppointmentsDisabled(true);
      setLoadingDoctors(false);
      return;
    }
    apiFetch<{ doctors: Doctor[] }>(`/api/healthcare/doctors?storeId=${encodeURIComponent(storeId)}`)
      .then((res) => setDoctors(res.doctors ?? []))
      .catch(() => setDoctors([]))
      .finally(() => setLoadingDoctors(false));
  }, [storeId, allowAppointments]);

  // Load slots when doctor + date selected
  useEffect(() => {
    if (!selectedDate || appointmentsDisabled) return;
    setSlots([]);
    setSelectedSlot('');
    setLoadingSlots(true);
    const params = new URLSearchParams({ storeId, date: selectedDate });
    if (selectedDoctor) params.set('doctorId', selectedDoctor.id);
    apiFetch<{ slots: Array<{ time: string; available?: boolean } | string>; allowAppointments?: boolean; message?: string }>(`/api/healthcare/appointments/slots?${params}`)
      .then((res) => {
        if (res && res.allowAppointments === false) {
          setAppointmentsDisabled(true);
          if (res.message) setDisabledMessage(res.message);
          return;
        }
        if (!res || !res.slots) {
          setSlots([]);
          return;
        }
        const normalized: SlotItem[] = res.slots.map((s) => {
          if (typeof s === 'string') return { time: s, available: true };
          return { time: s.time, available: s.available !== false };
        });
        setSlots(normalized);
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [storeId, selectedDoctor, selectedDate, appointmentsDisabled]);

  const handleBook = useCallback(async () => {
    setError('');
    setSubmitting(true);
    try {
      const res = await apiFetch<{ appointment: { id: string } }>('/api/healthcare/appointments', {
        method: 'POST',
        json: {
          action: 'book',
          storeId,
          doctorId: selectedDoctor?.id,
          appointmentDate: selectedDate,
          timeSlot: selectedSlot,
          patientName: patientName.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });
      setBookedAppt({ id: res.appointment.id });
      setStep('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [storeId, selectedDoctor, selectedDate, selectedSlot, patientName, notes]);

  const handleCheckIn = useCallback(async (apptId: string) => {
    setError('');
    setSubmitting(true);
    try {
      const res = await apiFetch<{ tokenNumber: number }>('/api/healthcare/appointments', {
        method: 'POST',
        json: { action: 'check_in', storeId, appointmentId: apptId },
      });
      onCheckedIn?.(res.tokenNumber);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Check-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [storeId, onCheckedIn, onClose]);

  const dates = useMemo(() => next14Days(), []);

  // ---- Render steps -------------------------------------------------------

  const renderHeader = (title: string, subtitle?: string) => (
    <div className="flex items-center gap-3 mb-6">
      {step !== 'doctor' && step !== 'success' && (
        <button
          onClick={() => setStep(step === 'date' ? 'doctor' : step === 'slot' ? 'date' : step === 'confirm' ? 'slot' : 'doctor')}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all shrink-0 cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-black text-slate-900 truncate">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
      </div>
      <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all shrink-0 cursor-pointer">
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );

  // Appointments Disabled View
  if (appointmentsDisabled) {
    return (
      <div className="apptBooking">
        {renderHeader('Book Appointment', storeName)}
        <div className="flex flex-col items-center justify-center text-center py-6 sm:py-8 px-2 sm:px-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-sm">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-2">Appointments Not Allowed</h3>
          <p className="text-slate-600 text-xs sm:text-sm font-medium max-w-sm mb-6 leading-relaxed">
            {disabledMessage || "This clinic is not accepting online appointments at this time."}
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all cursor-pointer shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Select Doctor
  if (step === 'doctor') return (
    <div className="apptBooking">
      {renderHeader('Book Appointment', storeName)}
      {error && <p className="apptError">{error}</p>}
      {loadingDoctors ? (
        <div className="apptSkeleton"><span /><span /><span /></div>
      ) : (
        <>
          <p className="apptStepHint">Select a doctor (optional)</p>
          <div className="apptDoctorList">
            {/* No preference option */}
            <button
              className={`apptDoctorCard ${!selectedDoctor ? 'selected' : ''}`}
              onClick={() => { setSelectedDoctor(null); setStep('date'); }}
            >
              <div className="apptDoctorIcon"><User className="w-5 h-5" /></div>
              <div>
                <strong>Any Available Doctor</strong>
                <small>Assigned by clinic</small>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 ml-auto" />
            </button>
            {doctors.map((d) => (
              <button
                key={d.id}
                className={`apptDoctorCard ${selectedDoctor?.id === d.id ? 'selected' : ''}`}
                onClick={() => { setSelectedDoctor(d); setStep('date'); }}
              >
                <div className="apptDoctorIcon"><Stethoscope className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <strong>Dr. {d.name}</strong>
                  {d.specialization && <small>{d.specialization}</small>}
                  <div className="flex items-center gap-2 mt-1">
                    {d.consultationMinutes && <small className="text-slate-400">{d.consultationMinutes}m</small>}
                    <span style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10B981", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 800, border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                      ₹{d.consultationFee ?? 500} fee
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 ml-auto shrink-0" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // Step 2: Select Date
  if (step === 'date') return (
    <div className="apptBooking">
      {renderHeader('Select Date', selectedDoctor ? `Dr. ${selectedDoctor.name}` : 'Any doctor')}
      {error && <p className="apptError">{error}</p>}
      <p className="apptStepHint">Choose an appointment date</p>
      <div className="apptDateGrid">
        {dates.map((d) => {
          let dayName = d;
          let dayNum: string | number = '';
          let monthName = '';
          try {
            const parts = d.split('-').map(Number);
            const dayObj = new Date(parts[0], parts[1] - 1, parts[2]);
            dayName = dayObj.toLocaleDateString('en-IN', { weekday: 'short' });
            dayNum = dayObj.getDate();
            monthName = dayObj.toLocaleDateString('en-IN', { month: 'short' });
          } catch {
            dayName = d;
          }
          const isToday = d === todayIst();
          return (
            <button
              key={d}
              className={`apptDateCard ${selectedDate === d ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => { setSelectedDate(d); setStep('slot'); }}
            >
              <span className="apptDateDay">{dayName}</span>
              <span className="apptDateNum">{dayNum}</span>
              <span className="apptDateMonth">{monthName}</span>
              {isToday && <span className="apptTodayBadge">Today</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Step 3: Select Time Slot
  if (step === 'slot') return (
    <div className="apptBooking">
      {renderHeader('Select Time', formatDate(selectedDate))}
      {error && <p className="apptError">{error}</p>}
      {loadingSlots ? (
        <div className="apptSkeleton"><span /><span /><span /><span /></div>
      ) : slots.length === 0 ? (
        <div className="apptEmpty">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p>No available slots for this day.</p>
          <button onClick={() => setStep('date')} className="apptLink">Try another date</button>
        </div>
      ) : (
        <>
          <p className="apptStepHint">{slots.filter((s) => s.available).length} slots available</p>
          <div className="apptSlotGrid">
            {slots.map((slot) => (
              <button
                key={slot.time}
                disabled={!slot.available}
                className={`apptSlotCard ${selectedSlot === slot.time ? 'selected' : ''} ${!slot.available ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400' : ''}`}
                onClick={() => {
                  if (slot.available) {
                    setSelectedSlot(slot.time);
                    setStep('confirm');
                  }
                }}
              >
                <Clock className="w-3.5 h-3.5" />
                {slot.time}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // Step 4: Confirm Details
  if (step === 'confirm') return (
    <div className="apptBooking">
      {renderHeader('Confirm Appointment')}
      {error && <p className="apptError">{error}</p>}
      <div className="apptSummary">
        <div className="apptSummaryRow">
          <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{formatDate(selectedDate)} at {selectedSlot}</span>
        </div>
        <div className="apptSummaryRow">
          <Stethoscope className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{selectedDoctor ? `Dr. ${selectedDoctor.name}${selectedDoctor.specialization ? ` · ${selectedDoctor.specialization}` : ''}` : 'Any available doctor'}</span>
        </div>
        <div className="apptSummaryRow">
          <span style={{ color: "#059669", fontSize: "15px", fontWeight: 900, display: "inline-block", width: "16px", textAlign: "center" }}>₹</span>
          <span>Consultation Fee: <b style={{ color: "#059669" }}>₹{selectedDoctor?.consultationFee ?? 500}</b> (Pay at clinic)</span>
        </div>
        <div className="apptSummaryRow">
          <User className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{storeName}</span>
        </div>
      </div>

      <div className="apptForm">
        <label className="apptLabel">
          Patient name <span className="text-slate-500">(optional — leave blank to use your account name)</span>
        </label>
        <input
          type="text"
          className="apptInput"
          placeholder="e.g. Rahul Sharma"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          maxLength={80}
        />
        <label className="apptLabel" style={{ marginTop: 12 }}>
          Notes for doctor <span className="text-slate-500">(optional)</span>
        </label>
        <textarea
          className="apptInput apptTextarea"
          placeholder="e.g. Follow-up for last week's checkup, fever since 2 days..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={300}
          rows={3}
        />
      </div>

      <button
        className="apptBookBtn"
        onClick={handleBook}
        disabled={submitting}
      >
        {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        {submitting ? 'Booking...' : 'Confirm Appointment'}
      </button>
    </div>
  );

  // Step 5: Success
  if (step === 'success') return (
    <div className="apptBooking apptSuccess">
      <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
      <h3 className="text-2xl font-black text-slate-900 mb-2">Appointment Booked!</h3>
      <p className="text-slate-600 text-sm font-medium mb-1">{storeName}</p>
      <p className="text-emerald-600 font-bold text-lg mb-1">{formatDate(selectedDate)} · {selectedSlot}</p>
      {selectedDoctor && (
        <p className="text-slate-500 text-sm mb-6">Dr. {selectedDoctor.name}</p>
      )}
      <p className="text-slate-500 text-xs mb-8 max-w-xs text-center">
        Arrive at least 10 minutes early. Use the check-in button on the day of your appointment to join the live queue.
      </p>
      {error && <p className="apptError mb-4">{error}</p>}
      <div className="flex flex-col gap-3 w-full">
        {bookedAppt && (
          <button
            className="apptBookBtn"
            onClick={() => void handleCheckIn(bookedAppt.id)}
            disabled={submitting}
          >
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {submitting ? 'Checking in...' : 'Check In Now (Join Queue)'}
          </button>
        )}
        <button
          onClick={onClose}
          className="apptSecondaryBtn"
        >
          Done — I&apos;ll check in later
        </button>
      </div>
    </div>
  );

  return null;
}

// ---- Appointment Card (for displaying existing appointment) ---------------

interface AppointmentCardProps {
  appointment: Appointment;
  onCheckIn?: (apptId: string, storeId: string) => void;
  onCancel?: (apptId: string) => void;
}

export function AppointmentCard({ appointment: a, onCheckIn, onCancel }: AppointmentCardProps) {
  const today = todayIst();
  const isToday = a.appointmentDate === today;
  const canCheckIn = isToday && (a.status === 'booked' || a.status === 'confirmed') && !a.queueEntryId;
  const isActive = a.status === 'booked' || a.status === 'confirmed' || a.status === 'checked_in';
  const isCancelled = a.status === 'cancelled' || a.status === 'no_show';

  return (
    <div className={`apptCard ${isToday && isActive ? 'apptCardToday' : ''} ${isCancelled ? 'apptCardCancelled' : ''}`}>
      <div className="apptCardHeader">
        <div>
          <p className="apptCardStore">{a.storeName}</p>
          <p className="apptCardDate">
            {formatDate(a.appointmentDate)} · {a.timeSlot}
          </p>
          {a.doctorName && <p className="apptCardDoctor">Dr. {a.doctorName}{a.doctorSpecialization ? ` · ${a.doctorSpecialization}` : ''}</p>}
        </div>
        <span className={`apptStatusBadge ${a.status}`}>{a.status.replace(/_/g, ' ')}</span>
      </div>

      {a.queueEntryId && (
        <p className="apptCheckedIn">✓ Checked in — you&apos;re in the live queue</p>
      )}

      {isActive && !isCancelled && (
        <div className="apptCardActions">
          {canCheckIn && onCheckIn && (
            <button
              className="apptBookBtn apptCheckInBtn"
              onClick={() => onCheckIn(a.id, a.storeId)}
            >
              <CheckCircle2 className="w-4 h-4" />
              Check In &amp; Join Queue
            </button>
          )}
          {onCancel && !a.queueEntryId && (
            <button
              className="apptCancelBtn"
              onClick={() => onCancel(a.id)}
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
