//frontend/lib/date-format.ts
import { format } from 'date-fns';

/**
 * Formats a date string (likely from an API in UTC) into a localized date string.
 * Example: "Sep 20, 2025"
 * @param dateInput - The ISO date string or Date object.
 */
export function formatDate(dateInput?: string | Date): string {
  if (!dateInput) return "N/A";

  try {
    // THE FIX: Ensure the date string is treated as UTC by appending 'Z' if it's missing.
    const dateString = typeof dateInput === 'string' && !dateInput.endsWith('Z') 
      ? `${dateInput}Z` 
      : dateInput;
      
    const date = new Date(dateString);
    return format(date, 'PPP'); // 'PPP' is a token for a long-form date like "Sep 20th, 2025"
  } catch (error) {
    console.error("Invalid date input for formatDate:", dateInput);
    return "Invalid Date";
  }
}

/**
 * Formats a date string (likely from an API in UTC) into a localized time string.
 * Example: "11:00 AM"
 * @param dateInput - The ISO date string or Date object.
 */
export function formatTime(dateInput?: string | Date): string {
    if (!dateInput) return "";

    try {
        // THE FIX: Ensure the date string is treated as UTC.
        const dateString = typeof dateInput === 'string' && !dateInput.endsWith('Z') 
          ? `${dateInput}Z` 
          : dateInput;

        const date = new Date(dateString);
        return format(date, 'p'); // 'p' is a token for a localized time like "11:00 AM"
    } catch (error) {
        console.error("Invalid date input for formatTime:", dateInput);
        return "Invalid Time";
    }
}

/**
 * Formats a date string (likely from an API in UTC) into a full, localized date and time string.
 * THIS IS THE MOST IMPORTANT FIX.
 * Example: "09/20/2025 11:00 AM"
 * @param dateInput - The ISO date string or Date object.
 */
export function formatDateTime(dateInput?: string | Date): string {
    if (!dateInput) return "N/A";
    
    try {
        // THE FIX: Ensure the date string is treated as UTC by appending 'Z' if it's missing.
        // This tells the Date constructor to parse it as UTC and convert it to the browser's local time.
        const dateString = typeof dateInput === 'string' && !dateInput.endsWith('Z') 
          ? `${dateInput}Z` 
          : dateInput;

        const date = new Date(dateString);
        // 'MM/dd/yyyy p' combines date and time formats.
        return format(date, 'MM/dd/yyyy p'); 
    } catch (error) {
        console.error("Invalid date input for formatDateTime:", dateInput);
        return "Invalid DateTime";
    }
}