export function formatDate(dateInput: string | Date): string {
  if (!dateInput) return "N/A";

  try {
    const date = new Date(dateInput);
    // Get day, month, and year
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Invalid date input for formatDate:", dateInput);
    return "Invalid Date";
  }
}

export function formatTime(dateInput: string | Date): string {
    if (!dateInput) return "";

    try {
        const date = new Date(dateInput);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch (error) {
        console.error("Invalid date input for formatTime:", dateInput);
        return "Invalid Time";
    }
}

export function formatDateTime(dateInput: string | Date): string {
    if (!dateInput) return "N/A";
    
    const datePart = formatDate(dateInput);
    const timePart = formatTime(dateInput);

    if (datePart === "Invalid Date" || timePart === "Invalid Time") {
        return "Invalid DateTime";
    }

    return `${datePart} ${timePart}`;
}