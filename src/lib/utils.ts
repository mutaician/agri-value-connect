import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInDays, isPast, isToday } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface DiscountDetails {
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  hasDiscount: boolean;
  message?: string;
}

export function calculateDiscountedPrice(
  originalPrice: number,
  expiresAtISO: string
): DiscountDetails {
  if (typeof originalPrice !== 'number' || isNaN(originalPrice) || originalPrice <= 0) {
    return {
      originalPrice: originalPrice || 0,
      discountedPrice: originalPrice || 0,
      discountPercentage: 0,
      hasDiscount: false,
      message: "Invalid price",
    };
  }

  let expiresAtDate;
  try {
    expiresAtDate = new Date(expiresAtISO);
    if (isNaN(expiresAtDate.getTime())) {
      throw new Error("Invalid date string");
    }
  } catch (error) {
    console.error("Invalid expires_at date format:", expiresAtISO, error);
    return {
      originalPrice,
      discountedPrice: originalPrice,
      discountPercentage: 0,
      hasDiscount: false,
      message: "Invalid expiry date format",
    };
  }

  const now = new Date();
  let discountPercentage = 0;
  let message = "";

  if (isPast(expiresAtDate) && !isToday(expiresAtDate)) {
    discountPercentage = 0.50;
    message = "Expired";
  } else if (isToday(expiresAtDate)) {
    discountPercentage = 0.50;
    message = "Expires Today! 50% Off!";
  } else {
    const daysUntilExpiry = differenceInDays(expiresAtDate, now);

    if (daysUntilExpiry <= 2) {
      discountPercentage = 0.25;
      message = "Expires Soon! 25% Off!";
    } else if (daysUntilExpiry <= 7) {
      discountPercentage = 0.10;
      message = "10% Off!";
    } else {
      discountPercentage = 0;
    }
  }
  
  const discountedPrice = originalPrice * (1 - discountPercentage);

  return {
    originalPrice,
    discountedPrice: parseFloat(discountedPrice.toFixed(2)),
    discountPercentage,
    hasDiscount: discountPercentage > 0,
    message: discountPercentage > 0 ? message : undefined,
  };
}
