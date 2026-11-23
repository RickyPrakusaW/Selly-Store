/**
 * Real-time Date utilities for LICHARY Florist
 * Standardized on Asia/Jakarta (WIB, UTC+7) timezone.
 */
"use client";

import { useEffect, useState } from "react";

export interface RealtimeToday {
  year: number;
  month: number; // 0-indexed: 0 = Januari, 11 = Desember
  day: number;
  dateStr: string; // YYYY-MM-DD
  formatted: string; // e.g. "24 November 2026"
  dayName: string; // e.g. "Selasa"
}

export const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

export const DAY_NAMES_ID = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

export function getRealtimeTodayWIB(): RealtimeToday {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA produces "YYYY-MM-DD" in Asia/Jakarta timezone
  const dateStr = formatter.format(now);
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = parseInt(yearStr || "2026", 10);
  const monthNum = parseInt(monthStr || "1", 10);
  const day = parseInt(dayStr || "1", 10);
  const month = monthNum - 1;

  const dateObj = new Date(year, month, day);
  const dayName = DAY_NAMES_ID[dateObj.getDay()] || "Senin";
  const monthName = MONTH_NAMES_ID[month] || "November";

  return {
    year,
    month,
    day,
    dateStr,
    formatted: `${day} ${monthName} ${year}`,
    dayName,
  };
}

/**
 * React hook that returns current date in WIB and automatically
 * updates if the day turns over while the page is open.
 */
export function useRealtimeTodayWIB(): RealtimeToday {
  const [today, setToday] = useState<RealtimeToday>(getRealtimeTodayWIB);

  useEffect(() => {
    const checkDate = () => {
      const current = getRealtimeTodayWIB();
      if (current.dateStr !== today.dateStr) {
        setToday(current);
      }
    };

    // Check every 15 seconds to ensure real-time accuracy across midnight
    const timer = setInterval(checkDate, 15000);
    return () => clearInterval(timer);
  }, [today.dateStr]);

  return today;
}
