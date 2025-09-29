// frontend/lib/date-format.ts
import { format } from 'date-fns';

/**
 * Formats a date string (from API in UTC) into a localized date string.
 * Example: "Sep 20, 2025"
 * @param dateInput - The ISO date string or Date object.
 */
export function formatDate(dateInput?: string | Date): string {
  if (!dateInput) return "N/A";

  try {
    // --- TIMEZONE FIX ---
    // The Date constructor in browsers correctly parses full ISO 8601 strings
    // (like "2025-09-27T08:20:00") as UTC and converts them to local time.
    // This code is now robust.
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) throw new Error("Invalid date value");
    return format(date, 'PPP'); // e.g., "Sep 27th, 2025"
  } catch (error) {
    console.error("Invalid date input for formatDate:", dateInput, error);
    return "Invalid Date";
  }
}

/**
 * Formats a date string (from API in UTC) into a localized time string.
 * Example: "1:50 PM"
 * @param dateInput - The ISO date string or Date object.
 */
export function formatTime(dateInput?: string | Date): string {
    if (!dateInput) return "";

    try {
        // --- TIMEZONE FIX ---
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) throw new Error("Invalid date value");
        return format(date, 'p'); // e.g., "1:50 PM"
    } catch (error) {
        console.error("Invalid date input for formatTime:", dateInput, error);
        return "Invalid Time";
    }
}

/**
 * Formats a date string (from API in UTC) into a full, localized date and time string.
 * Example: "09/27/2025, 1:50 PM"
 * @param dateInput - The ISO date string or Date object.
 */
export function formatDateTime(dateInput?: string | Date): string {
    if (!dateInput) return "N/A";
    
    try {
        // --- TIMEZONE FIX ---
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) throw new Error("Invalid date value");
        return format(date, 'PPpp'); // e.g., "Sep 27, 2025, 1:50:00 PM"
    } catch (error) {
        console.error("Invalid date input for formatDateTime:", dateInput, error);
        return "Invalid DateTime";
    }
}