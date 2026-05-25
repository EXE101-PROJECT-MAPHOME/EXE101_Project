/**
 * Format a date to dd/mm/yyyy format
 * @param date - Date object or date string
 * @returns Formatted date string in dd/mm/yyyy format
 */
export const formatDateToDDMMYYYY = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return "";
  }

  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();

  return `${day}/${month}/${year}`;
};

/**
 * Format a date to Vietnamese locale with dd/mm/yyyy format
 * @param date - Date object or date string
 * @param includeWeekday - Whether to include weekday (default: false)
 * @returns Formatted date string
 */
export const formatDateVietnamese = (
  date: Date | string,
  includeWeekday: boolean = false,
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return "";
  }

  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  const baseFormat = `${day}/${month}/${year}`;

  if (includeWeekday) {
    const weekday = new Intl.DateTimeFormat("vi-VN", {
      weekday: "long",
    }).format(dateObj);
    return `${weekday}, ${baseFormat}`;
  }

  return baseFormat;
};

/**
 * Get the text for remaining days until expiry
 * @param expiryDate - Date object or date string
 * @returns Text representing remaining days (e.g., "(Còn 3 ngày)")
 */
export const getDaysLeftText = (expiryDate: Date | string | undefined | null): string => {
  if (!expiryDate) return "";
  const dateObj = typeof expiryDate === "string" ? new Date(expiryDate) : expiryDate;
  if (isNaN(dateObj.getTime())) return "";

  const now = new Date();
  const timeDiff = dateObj.getTime() - now.getTime();
  const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  if (days < 0) return "(Đã hết hạn)";
  if (days === 0) return "(Hết hạn hôm nay)";
  return `(Còn ${days} ngày)`;
};
