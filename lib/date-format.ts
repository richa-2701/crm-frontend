//frontend/lib/date-format.ts
import { format } from 'date-fns';

/**
 * Formats a date string (likely from an API in UTC) into a localized date string.
 * Example: "Sep 5, 2025"
 * @param dateInput - The ISO date string or Date object.
 */
export function formatDate(dateInput?: string | Date): string {
  if (!dateInput) return "N/A";

  try {
    // The `new Date()` constructor correctly parses the ISO string from UTC 
    // into a Date object representing the user's local timezone.
    const date = new Date(dateInput);
    return format(date, 'PPP'); // 'PPP' is a token for a long-form date like "Sep 5th, 2025"
  } catch (error) {
    console.error("Invalid date input for formatDate:", dateInput);
    return "Invalid Date";
  }
}

/**
 * Formats a date string (likely from an API in UTC) into a localized time string.
 * Example: "11:08 PM"
 * @param dateInput - The ISO date string or Date object.
 */
export function formatTime(dateInput?: string | Date): string {
    if (!dateInput) return "";

    try {
        const date = new Date(dateInput);
        return format(date, 'p'); // 'p' is a token for a localized time like "11:08 PM"
    } catch (error) {
        console.error("Invalid date input for formatTime:", dateInput);
        return "Invalid Time";
    }
}

/**
 * Formats a date string (likely from an API in UTC) into a full, localized date and time string.
 * This is the function that will fix your main issue.
 * Example: "09/05/2025 11:08 PM"
 * @param dateInput - The ISO date string or Date object.
 */
export function formatDateTime(dateInput?: string | Date): string {
    if (!dateInput) return "N/A";
    
    try {
        const date = new Date(dateInput);
        // 'MM/dd/yyyy p' combines date and time formats.
        return format(date, 'MM/dd/yyyy p'); 
    } catch (error) {
        console.error("Invalid date input for formatDateTime:", dateInput);
        return "Invalid DateTime";
    }
}