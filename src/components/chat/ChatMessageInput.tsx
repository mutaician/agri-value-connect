"use client";

import { useState, useTransition, useRef } from 'react';
// import { createSupabaseBrowserClient } from "@/lib/supabase/client"; // No longer needed for direct insert
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal } from "lucide-react";
import { toast } from "sonner";
import { sendMessage } from '@/actions/chatActions'; // Import the server action

interface ChatMessageInputProps {
  chatId: string;
  // currentUserId: string; // Still needed for optimistic updates if we add them, or for UI logic
  // Callback for optimistic update (optional)
  onMessageSent?: (optimisticMessage: {
    id: string;
    chat_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    profiles?: { id: string; username: string | null; full_name: string | null; avatar_url?: string | null } | null;
  }) => void;
}

export default function ChatMessageInput({ chatId }: ChatMessageInputProps) {
  const [messageContent, setMessageContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null); // For resetting the form

  const handleSendMessage = async () => {
    const content = messageContent.trim();
    if (content === "") return;

    // Optimistic update (optional - can be passed via onMessageSent)
    // If implementing, generate a temporary ID and structure for the message
    // const tempId = `temp-${Date.now()}`;
    // if (onMessageSent && currentUserId) { // Added currentUserId check here if it were to be used
    //   onMessageSent({
    //     id: tempId,
    //     chat_id: chatId,
    //     sender_id: currentUserId, // currentUserId would be used here
    //     content: content,
    //     created_at: new Date().toISOString(),
    //     profiles: { id: currentUserId, username: 'You', full_name: 'You' } // Mock profile for optimistic UI
    //   });
    // }

    setMessageContent(""); // Clear input immediately

    startTransition(async () => {
      const result = await sendMessage(chatId, content);

      if (!result.success || result.error) {
        toast.error(result.error || "Error sending message.");
        setMessageContent(content); // Restore message on error
        // If using optimistic updates, would need to remove the temp message here
      } else {
        // Message sent successfully. Realtime should pick it up.
        // If optimistic update was done via onMessageSent, the actual message from result.message 
        // (with permanent ID and server timestamp) could be used to replace the temp one.
        if (formRef.current) {
            formRef.current.reset(); // Ensures textarea is fully cleared if controlled state alone is not enough
        }
        setMessageContent(""); // Ensure state is also clear
      }
    });
  };

  return (
    <form
      ref={formRef}
      onSubmit={(e: React.FormEvent<HTMLFormElement>) => { 
        e.preventDefault(); 
        handleSendMessage(); 
      }}
      className="flex items-center space-x-2 pt-4 border-t"
    >
      <Textarea
        name="message"
        placeholder="Type your message..."
        value={messageContent} // Controlled component
        onChange={(e) => setMessageContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
          }
        }}
        rows={1}
        className="flex-grow resize-none min-h-[40px] max-h-[120px] overflow-y-auto p-2 border rounded-md"
        disabled={isPending}
        autoFocus
      />
      <Button 
        type="submit" 
        size="icon" 
        className="flex-shrink-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-10 h-10"
        disabled={isPending || messageContent.trim() === ""}
        aria-label="Send message"
      >
        <SendHorizonal className="h-5 w-5" />
      </Button>
    </form>
  );
} 