"use client";

import {
  AlertCircle,
  AlertTriangle,
  Ban,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  MessageCircle,
  PhoneCall,
  Sparkles,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { fetchCalendar } from "@/lib/api";
import {
  DAY_NAMES_ID,
  MONTH_NAMES_ID,
  useRealtimeTodayWIB,
} from "@/lib/dates";
import { normalizeWhatsAppNumber } from "@/lib/phone-number";
import type { BoardBooking, BoardInventory } from "@/lib/types";

type BoardWithBookings = BoardInventory & { bookings?: BoardBooking[] };

interface RentalDatePickerProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  selectedEndDate?: string;
  onSelectEndDate?: (date: string) => void;
  startTime: string;
  onStartTimeChange: (time: string) => void;
  endTime: string;
  onEndTimeChange: (time: string) => void;
  minDate?: string;
  productName?: string;
}

type DayStatus = "available" | "soft_locked" | "booked" | "past";

interface DaySlot {
  dayNum: number;
  dateStr: string;
  isCurrentMonth: boolean;
  status: DayStatus;
  isSunday: boolean;
  isToday: boolean;
  lockRemaining?: string | undefined;
  availableStock?: number;
}

const TIME_PRESETS = [
  { label: "Pagi", range: "08:00 - 12:00", start: "08:00", end: "12:00" },
  { label: "Siang", range: "11:00 - 15:00", start: "11:00", end: "15:00" },
  { label: "Sore", range: "14:00 - 18:00", start: "14:00", end: "18:00" },
  { label: "Seharian", range: "09:00 - 18:00", start: "09:00", end: "18:00" },
];

export function RentalDatePicker({
  selectedDate,
  onSelectDate,
  selectedEndDate,
  onSelectEndDate,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  minDate,
  productName = "Papan Ucapan Akrilik",
}: Readonly<RentalDatePickerProps>) {
  // Real-time WIB (Asia/Jakarta) date hook
  const today = useRealtimeTodayWIB();
  const todayStr = today.dateStr;

  // Track modal alert for today's selection
  const [todayAlertOpen, setTodayAlertOpen] = useState(false);

  // Month navigation state
  const [currentYear, setCurrentYear] = useState(() => {
    if (selectedDate) {
      const part = selectedDate.split("-")[0];
      if (part) {
        const parsed = parseInt(part, 10);
        if (!Number.isNaN(parsed)) return parsed;
      }
    }
    return today.year;
  });

  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate) {
      const part = selectedDate.split("-")[1];
      if (part) {
        const parsed = parseInt(part, 10);
        if (!Number.isNaN(parsed)) return parsed - 1;
      }
    }
    return today.month;
  });

  // Keep month view in sync if selected date changes externally
  useEffect(() => {
    if (selectedDate) {
      const [yStr, mStr] = selectedDate.split("-");
      if (yStr && mStr) {
        const y = parseInt(yStr, 10);
        const m = parseInt(mStr, 10) - 1;
        if (!Number.isNaN(y) && !Number.isNaN(m)) {
          setCurrentYear(y);
          setCurrentMonth(m);
        }
      }
    }
  }, [selectedDate]);

  const [boardsData, setBoardsData] = useState<BoardWithBookings[]>([]);

  // Month string for API: "YYYY-MM"
  const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

  // Fetch real calendar data from backend
  useEffect(() => {
    let isCancelled = false;
    fetchCalendar(monthKey)
      .then((data) => {
        if (!isCancelled && Array.isArray(data)) {
          setBoardsData(data as unknown as BoardWithBookings[]);
        }
      })
      .catch(() => {
        setBoardsData([]);
      });

    return () => {
      isCancelled = true;
    };
  }, [monthKey]);

  // Prevent navigating before the current real-time month
  const isPastMonthBoundary =
    currentYear < today.year ||
    (currentYear === today.year && currentMonth <= today.month);

  const handlePrevMonth = () => {
    if (isPastMonthBoundary) return;
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // WhatsApp link generator for same-day inquiry
  const rawWaNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6289517880077";
  const waNumber = normalizeWhatsAppNumber(rawWaNumber);
  const todayWaMessage = `Halo Florist LICHARY, saya ingin memesan sewa "${productName}" untuk HARI INI (${today.formatted}). Apakah slot masih tersedia dan bisa dikirim hari ini?`;
  const todayWaUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(todayWaMessage)}`;

  // Build calendar matrix (guaranteed accurate day of week alignment)
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 1 = Mon ...
    const totalDaysInMonth = new Date(
      currentYear,
      currentMonth + 1,
      0,
    ).getDate();
    const totalDaysInPrevMonth = new Date(
      currentYear,
      currentMonth,
      0,
    ).getDate();

    const slots: DaySlot[] = [];

    // Leading days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = totalDaysInPrevMonth - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(
        dayNum,
      ).padStart(2, "0")}`;
      slots.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
        status: "past",
        isSunday: slots.length % 7 === 0,
        isToday: false,
      });
    }

    // Days in current month
    const totalActiveBoards = boardsData.filter((b) => b.isActive).length || 5;

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
        2,
        "0",
      )}-${String(day).padStart(2, "0")}`;

      const effectiveMinDate = minDate || todayStr;
      const isPast = dateStr < effectiveMinDate;
      const isToday = dateStr === todayStr;
      const isSunday = (firstDayOfWeek + day - 1) % 7 === 0;

      let status: DayStatus = "available";
      let lockRemaining: string | undefined = undefined;

      let bookedCount = 0;
      let softLockedCount = 0;

      if (isPast) {
        status = "past";
      } else {
        // Check real bookings from backend
        if (boardsData && boardsData.length > 0) {
          const slotDate = new Date(`${dateStr}T00:00:00Z`);
          for (const board of boardsData) {
            if (!board.isActive) continue;
            for (const b of board.bookings ?? []) {
              const start = new Date(b.bookingStart);
              const end = new Date(b.bookingEnd);
              if (slotDate >= start && slotDate <= end) {
                if (b.status === "CONFIRMED") bookedCount++;
                if (b.status === "SOFT_LOCKED") softLockedCount++;
              }
            }
          }
        }

        const availableUnits = Math.max(
          0,
          totalActiveBoards - bookedCount - softLockedCount,
        );
        if (bookedCount >= totalActiveBoards || availableUnits === 0) {
          status = "booked";
        } else if (bookedCount + softLockedCount >= totalActiveBoards) {
          status = "soft_locked";
          lockRemaining = "TERKUNCI 1J 45M";
        }
      }

      const availableUnits = Math.max(
        0,
        totalActiveBoards - bookedCount - softLockedCount,
      );

      // Crucial: ALWAYS push every day so calendar layout never skips or shifts
      slots.push({
        dayNum: day,
        dateStr,
        isCurrentMonth: true,
        status,
        isSunday,
        isToday,
        lockRemaining,
        availableStock: isPast ? 0 : availableUnits,
      });
    }

    // Trailing days from next month to complete the row of 7
    const remainingInGrid = (7 - (slots.length % 7)) % 7;
    for (let nextDay = 1; nextDay <= remainingInGrid; nextDay++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(
        nextDay,
      ).padStart(2, "0")}`;
      slots.push({
        dayNum: nextDay,
        dateStr,
        isCurrentMonth: false,
        status: "past",
        isSunday: slots.length % 7 === 0,
        isToday: false,
      });
    }

    return slots;
  }, [currentYear, currentMonth, boardsData, todayStr, minDate]);

  // Selected date formatted in Indonesian: e.g. "24 November 2026 (Selasa)"
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return null;
    const parts = selectedDate.split("-");
    const p0 = parts[0];
    const p1 = parts[1];
    const p2 = parts[2];
    if (parts.length !== 3 || !p0 || !p1 || !p2) return null;
    const y = parseInt(p0, 10);
    const m = parseInt(p1, 10) - 1;
    const d = parseInt(p2, 10);
    const dateObj = new Date(y, m, d);
    const dayOfWeek = DAY_NAMES_ID[dateObj.getDay()] || "";
    const monthName = MONTH_NAMES_ID[m] || "";
    return `${d} ${monthName} ${y} (${dayOfWeek})`;
  }, [selectedDate]);

  const isSelectedToday = selectedDate === todayStr;

  const handleSelectDay = (slot: DaySlot) => {
    // 1. Never allow selecting past dates or booked dates
    if (
      !slot.isCurrentMonth ||
      slot.status === "booked" ||
      slot.status === "past" ||
      slot.dateStr < todayStr
    ) {
      return;
    }

    // 2. If user chooses TODAY: Alert to contact store first
    if (slot.dateStr === todayStr) {
      setTodayAlertOpen(true);
      return;
    }

    // 3. Normal future date selection
    onSelectDate(slot.dateStr);
    if (onSelectEndDate) {
      onSelectEndDate(slot.dateStr);
    }
  };

  const handleConfirmSelectToday = () => {
    onSelectDate(todayStr);
    if (onSelectEndDate) {
      onSelectEndDate(todayStr);
    }
    setTodayAlertOpen(false);
  };

  return (
    <div className="rental-calendar-container" id="rental-calendar-widget">
      {/* ─── Top Header ─── */}
      <div className="calendar-top-header">
        <div className="calendar-header-titles">
          <div className="calendar-header-icon-wrap">
            <CalendarDays size={22} className="calendar-header-icon" />
          </div>
          <div>
            <h3 className="calendar-main-title">Pilih Tanggal Acara</h3>
            <p className="calendar-sub-title">
              Periksa ketersediaan kuota papan akrilik untuk jadwal sewa Anda.
            </p>
          </div>
        </div>

        {/* Month Selector Pill */}
        <div className="calendar-month-navigator">
          <button
            type="button"
            className="month-nav-btn"
            onClick={handlePrevMonth}
            disabled={isPastMonthBoundary}
            aria-label="Bulan Sebelumnya"
            style={{
              opacity: isPastMonthBoundary ? 0.35 : 1,
              cursor: isPastMonthBoundary ? "not-allowed" : "pointer",
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="month-nav-label">
            {MONTH_NAMES_ID[currentMonth]} {currentYear}
          </span>
          <button
            type="button"
            className="month-nav-btn"
            onClick={handleNextMonth}
            aria-label="Bulan Berikutnya"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ─── Status Legend ─── */}
      <div className="calendar-status-legend">
        <div className="legend-item">
          <span className="legend-dot dot-available" />
          <span className="legend-label">Tersedia (Bisa Sewa)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-today" />
          <span className="legend-label">Hari Ini (Kontak Toko)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-softlocked" />
          <span className="legend-label">Soft-Locked (2 Jam)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-booked" />
          <span className="legend-label">Penuh (Booked)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-selected" />
          <span className="legend-label">Pilihan Anda</span>
        </div>
      </div>

      {/* ─── Day Names (MIN .. SAB) ─── */}
      <div className="calendar-daynames-grid">
        <div className="dayname-cell sunday">MIN</div>
        <div className="dayname-cell">SEN</div>
        <div className="dayname-cell">SEL</div>
        <div className="dayname-cell">RAB</div>
        <div className="dayname-cell">KAM</div>
        <div className="dayname-cell">JUM</div>
        <div className="dayname-cell">SAB</div>
      </div>

      {/* ─── Interactive Days Matrix ─── */}
      <div className="calendar-matrix-grid">
        {calendarDays.map((slot, idx) => {
          // Out-of-month padding days
          if (!slot.isCurrentMonth) {
            return (
              <div
                key={`pad-${idx}`}
                className="calendar-day-slot out-of-month"
                aria-hidden="true"
              >
                <span className="slot-day-number faded">{slot.dayNum}</span>
              </div>
            );
          }

          const isStartDate =
            slot.isCurrentMonth && slot.dateStr === selectedDate;
          const isEndDate =
            slot.isCurrentMonth &&
            Boolean(selectedEndDate && slot.dateStr === selectedEndDate);
          const isSelected = isStartDate || isEndDate;
          const isInRange = Boolean(
            selectedDate &&
              selectedEndDate &&
              slot.dateStr > selectedDate &&
              slot.dateStr < selectedEndDate,
          );

          // 1. Selected State
          if (isSelected) {
            return (
              <button
                key={slot.dateStr}
                type="button"
                className="calendar-day-slot is-selected"
                onClick={() => handleSelectDay(slot)}
                aria-label={`Pilihan Anda: ${slot.dayNum}`}
              >
                <span className="slot-day-number selected-text">
                  {slot.dayNum}
                </span>
                <span className="slot-status-pill selected-pill">
                  {isStartDate && selectedEndDate
                    ? "Mulai"
                    : isEndDate
                      ? "Selesai"
                      : "Terpilih"}
                </span>
              </button>
            );
          }

          // 2. Past State (CANNOT BE SELECTED)
          if (slot.status === "past") {
            return (
              <div
                key={slot.dateStr}
                className="calendar-day-slot is-past"
                title="Tanggal telah lewat (tidak dapat dipilih)"
                aria-disabled="true"
              >
                <span className="slot-day-number past-num">{slot.dayNum}</span>
                <span className="slot-past-label">Lewat</span>
              </div>
            );
          }

          // 3. Today State (Requires Contacting Store First)
          if (slot.isToday) {
            return (
              <button
                key={slot.dateStr}
                type="button"
                className={`calendar-day-slot is-today ${isInRange ? "is-in-range" : ""}`}
                onClick={() => handleSelectDay(slot)}
                title="Hari Ini (Pemesanan memerlukan konfirmasi WhatsApp toko)"
                aria-label={`Pilih tanggal ${slot.dayNum} (Hari Ini): Hubungi toko terlebih dahulu`}
              >
                <div className="slot-number-row">
                  <span className="slot-day-number today-num">
                    {slot.dayNum}
                  </span>
                  <span className="slot-today-dot" title="Hari Ini" />
                </div>
                <span className="slot-status-pill today-pill">Kontak Toko</span>
              </button>
            );
          }

          // 4. Booked State (Full)
          if (slot.status === "booked") {
            return (
              <div
                key={slot.dateStr}
                className="calendar-day-slot is-booked"
                title="Penuh / Sudah Dipesan Semua Unit"
                aria-disabled="true"
              >
                <div className="slot-number-row">
                  <span className="slot-day-number booked-num">
                    {slot.dayNum}
                  </span>
                  <Ban size={12} className="slot-ban-icon" />
                </div>
                <span className="slot-status-pill booked-pill">PENUH</span>
              </div>
            );
          }

          // 5. Soft-Locked State (Temporary hold)
          if (slot.status === "soft_locked") {
            return (
              <button
                key={slot.dateStr}
                type="button"
                className="calendar-day-slot is-softlocked"
                onClick={() => handleSelectDay(slot)}
                title="Slot sedang di-hold checkout pelanggan lain."
              >
                <div className="slot-number-row">
                  <span className="slot-day-number softlocked-num">
                    {slot.dayNum}
                  </span>
                  <Clock size={12} className="slot-clock-icon" />
                </div>
                <span className="slot-status-pill softlocked-pill">
                  {slot.lockRemaining || "TERKUNCI"}
                </span>
              </button>
            );
          }

          // 6. Available Future Date
          const stock = slot.availableStock ?? 1;
          return (
            <button
              key={slot.dateStr}
              type="button"
              className={`calendar-day-slot is-available ${
                isInRange ? "is-in-range" : ""
              }`}
              onClick={() => handleSelectDay(slot)}
              aria-label={`Pilih tanggal ${slot.dayNum}: Tersedia ${stock} unit`}
            >
              <span
                className={`slot-day-number ${
                  slot.isSunday ? "sunday-num" : "weekday-num"
                }`}
              >
                {slot.dayNum}
              </span>
              {stock === 1 ? (
                <span className="slot-stock-badge low-stock">Sisa 1</span>
              ) : (
                <span className="slot-stock-badge in-stock">Sisa {stock}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Selected Date Callout Banner ─── */}
      <div className="calendar-summary-banner">
        <div className="summary-banner-left">
          <div className="summary-info-icon-wrap">
            <Info size={18} className="summary-info-icon" />
          </div>
          <div className="summary-texts">
            <h4 className="summary-selected-heading">
              {formattedSelectedDate ? (
                <>
                  Tanggal Terpilih:{" "}
                  <span className="highlight-date">
                    {formattedSelectedDate}
                  </span>
                </>
              ) : (
                <span className="no-selection">
                  Silakan klik salah satu tanggal bertanda &quot;Tersedia&quot;
                  di atas
                </span>
              )}
            </h4>
            <p className="summary-description">
              Unit papan dibatasi agar kualitas bunga dan jadwal antar tetap
              presisi. Tanggal dengan label &apos;Booked&apos; telah
              dikonfirmasi dan tidak dapat disewa. Tanggal yang sudah lewat tidak
              dapat dipilih.
            </p>
          </div>
        </div>

        <div className="summary-banner-right">
          {formattedSelectedDate ? (
            <div className={`ready-badge ${isSelectedToday ? "today-badge-flag" : ""}`}>
              <Check size={14} className="ready-icon" />
              <span>{isSelectedToday ? "Hari Ini (Perlu Konfirmasi)" : "Siap Dipesan"}</span>
            </div>
          ) : (
            <div className="empty-badge">Pilih Tanggal</div>
          )}
        </div>
      </div>

      {/* ─── Alert Notice When Today is Selected ─── */}
      {isSelectedToday && (
        <div className="calendar-today-warning-callout">
          <div className="callout-content">
            <div className="callout-icon-wrap">
              <AlertTriangle size={18} className="callout-icon" />
            </div>
            <div>
              <strong>Pemesanan Hari Ini Memerlukan Konfirmasi Toko</strong>
              <p>
                Untuk sewa jadwal hari ini ({today.formatted}), pastikan Anda
                sudah menghubungi florist kami via WhatsApp untuk memastikan
                kesiapan bunga dan kurir express.
              </p>
            </div>
          </div>
          <a
            href={todayWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="callout-wa-link"
          >
            <MessageCircle size={15} /> Hubungi Florist WhatsApp
          </a>
        </div>
      )}

      {/* ─── Time & Logistics Section ─── */}
      <div className="rental-logistics-section">
        <div className="logistics-header">
          <Clock size={16} className="logistics-header-icon" />
          <h4 className="logistics-title">
            Waktu Pemasangan &amp; Pembongkaran di Lokasi Acara
          </h4>
        </div>

        {/* Quick Presets */}
        <div className="time-presets-row">
          <span className="presets-caption">Pilihan Cepat:</span>
          {TIME_PRESETS.map((p) => {
            const isCurrent = startTime === p.start && endTime === p.end;
            return (
              <button
                key={p.label}
                type="button"
                className={`preset-chip ${isCurrent ? "active" : ""}`}
                onClick={() => {
                  onStartTimeChange(p.start);
                  onEndTimeChange(p.end);
                }}
              >
                <strong>{p.label}</strong> ({p.range})
              </button>
            );
          })}
        </div>

        {/* Custom Time Pickers */}
        <div className="custom-times-grid">
          <div className="time-input-group">
            <label htmlFor="rental-start-time">
              <span>Jam Pasang / Standby di Lokasi:</span>
            </label>
            <input
              id="rental-start-time"
              type="time"
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              className="time-field"
            />
          </div>

          <div className="time-input-group">
            <label htmlFor="rental-end-time">
              <span>Jam Selesai Acara / Penarikan (Maks 18:00):</span>
            </label>
            <input
              id="rental-end-time"
              type="time"
              max="18:00"
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              className="time-field"
            />
          </div>
        </div>

        <div className="logistics-note">
          <Sparkles size={14} className="logistics-note-icon" />
          <span>
            <strong>Layanan All-in:</strong> Sewa papan akrilik / ucapan sudah
            termasuk pengantaran ke venue, standing kokoh, pemasangan rapi,
            serta penjemputan kembali unit setelah acara selesai.
          </span>
        </div>
      </div>

      {/* ─── Modal Alert: Konfirmasi Pesan Hari Ini ─── */}
      {todayAlertOpen && (
        <div
          className="calendar-modal-backdrop"
          onClick={() => setTodayAlertOpen(false)}
        >
          <div
            className="calendar-alert-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="today-alert-title"
          >
            <button
              type="button"
              className="alert-dialog-close-btn"
              onClick={() => setTodayAlertOpen(false)}
              aria-label="Tutup"
            >
              <X size={18} />
            </button>

            <div className="alert-dialog-icon-wrap">
              <PhoneCall size={28} className="alert-dialog-icon" />
            </div>

            <h4 id="today-alert-title" className="alert-dialog-title">
              Pemesanan Hari Ini ({today.formatted})
            </h4>

            <p className="alert-dialog-desc">
              Untuk pesanan sewa papan dengan jadwal <strong>HARI INI (Same-Day)</strong>,
              Anda harus <strong>menghubungi toko terlebih dahulu</strong> melalui
              WhatsApp guna memastikan ketersediaan unit dan jadwal pengiriman express.
            </p>

            <div className="alert-dialog-actions">
              <a
                href={todayWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="alert-dialog-btn-wa"
                onClick={() => {
                  handleConfirmSelectToday();
                }}
              >
                <MessageCircle size={18} /> Hubungi WhatsApp Toko
              </a>

              <button
                type="button"
                className="alert-dialog-btn-secondary"
                onClick={handleConfirmSelectToday}
              >
                Tetap Pilih Hari Ini (Sudah Konfirmasi)
              </button>

              <button
                type="button"
                className="alert-dialog-btn-cancel"
                onClick={() => setTodayAlertOpen(false)}
              >
                Pilih Tanggal Lain
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
