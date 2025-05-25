"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function DisplayMessage() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const [visibleMessage, setVisibleMessage] = useState<string | null>(null);

  useEffect(() => {
    if (message) {
      setVisibleMessage(message);
      // Optional: Clear the message from URL after a delay or on component unmount
      // This prevents it from showing again on refresh if not cleared by navigation
      // For simplicity, we'll let it persist until next navigation that changes params
    } else {
      setVisibleMessage(null);
    }
  }, [message]);

  if (!visibleMessage) {
    return null;
  }

  // Basic styling, can be enhanced with shadcn/ui Alert if available
  // Determine if it's an error or success message based on keywords (simple check)
  const isError = visibleMessage.toLowerCase().includes("error") || 
                  visibleMessage.toLowerCase().includes("failed") ||
                  visibleMessage.toLowerCase().includes("only farmers"); // Example for our specific message

  return (
    <div className="container mx-auto my-4">
      <div
        className={`p-4 rounded-md text-sm ${
          isError
            ? "bg-red-100 border border-red-400 text-red-700"
            : "bg-blue-100 border border-blue-400 text-blue-700"
        }`}
        role="alert"
      >
        {visibleMessage}
      </div>
    </div>
  );
} 