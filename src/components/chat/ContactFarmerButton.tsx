"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { getOrCreateChat } from "@/app/actions/chatActions"; // Server Action
import { toast } from "sonner";

interface ContactFarmerButtonProps {
  productId: string;
  farmerId: string;
  currentUserId?: string; // Optional: to re-affirm user is not the farmer, though action also checks
}

export function ContactFarmerButton({ productId, farmerId, currentUserId }: ContactFarmerButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Double check: UI should ideally prevent rendering this if currentUserId === farmerId
  if (currentUserId && currentUserId === farmerId) {
    return null; 
  }

  const handleContactFarmer = () => {
    startTransition(async () => {
      try {
        const result = await getOrCreateChat(productId, farmerId);
        
        if (result.error) {
          toast.error(result.error);
        } else if (result.chatId) {
          router.push(`/chat/${result.chatId}`);
        } else {
          // Should not happen if error is null and chatId is null
          toast.error("An unexpected error occurred while trying to start the chat.");
        }
      } catch (e: any) {
        console.error("ContactFarmerButton: Error in getOrCreateChat call:", e);
        toast.error(e.message || "An unexpected error occurred.");
      }
    });
  };

  return (
    <Button 
      onClick={handleContactFarmer} 
      disabled={isPending}
      className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-150 ease-in-out"
    >
      {isPending ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Starting Chat...
        </>
      ) : (
        <>
          <MessageSquare className="w-5 h-5 mr-2" /> Contact Farmer
        </>
      )}
    </Button>
  );
} 