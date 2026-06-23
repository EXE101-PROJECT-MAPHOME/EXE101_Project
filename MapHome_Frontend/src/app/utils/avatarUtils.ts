import { API_BASE } from "@/app/utils/api";

/**
 * Utility to get the full image URL.
 * Handles relative paths from the backend and provides a default if no image is present.
 */
export const getImageUrl = (imagePath: string | undefined): string | null => {
  if (!imagePath) return null;
  
  if (imagePath.startsWith("http")) {
    return imagePath;
  }
  
  
  // Ensure we don't have double slashes if the path already starts with /
  const normalizedPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  
  return `${API_BASE}${normalizedPath}`;
};

/**
 * Utility to get the full avatar URL.
 * Handles relative paths from the backend and provides a default if no avatar is present.
 */
export const getAvatarUrl = (avatarPath: string | undefined): string | null => {
  if (!avatarPath) return null;
  
  if (avatarPath.startsWith("http")) {
    // If it's a Google photo URL, try to request a higher resolution (e.g., 256px instead of 96px)
    if (avatarPath.includes("googleusercontent.com")) {
      return avatarPath.replace(/=s\d+(-c)?/, "=s256-c");
    }
  }
  
  return getImageUrl(avatarPath);
};

/**
 * Gets initials from a full name for fallback display.
 */
export const getInitials = (fullName: string | undefined, username: string | undefined): string => {
  const name = fullName || username || "U";
  return name.charAt(0).toUpperCase();
};
