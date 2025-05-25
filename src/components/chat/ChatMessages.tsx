"use client";

import { useEffect, useRef, useState } from 'react';
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Assuming global or imported types for Profile and Message
interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  full_name: string | null;
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles?: Profile | null; // Sender's profile
}

interface ChatMessagesProps {
  initialMessages: Message[];
  chatId: string;
  currentUserId: string;
  otherParticipant: Profile | null;
}

export default function ChatMessages({ initialMessages, chatId, currentUserId, otherParticipant }: ChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const supabase = createSupabaseBrowserClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel(`realtime-chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          
          setMessages((prevMessages) => {
            if (prevMessages.some(msg => msg.id === newMessage.id)) {
              return prevMessages;
            }
            
            const messageToAdd = { ...newMessage };

            if (messageToAdd.sender_id === currentUserId && (!messageToAdd.profiles || messageToAdd.profiles === null)) {
              messageToAdd.profiles = { id: currentUserId, username: "You", full_name: "You", avatar_url: null };
            }
            return [...prevMessages, messageToAdd];
          });
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`[Realtime] CHANNEL_ERROR for chat ${chatId}:`, err);
        } else if (status === 'TIMED_OUT') {
          console.warn(`[Realtime] Subscription TIMED_OUT for chat ${chatId}`);
        }
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel).catch(err => console.error("[Realtime] Error removing channel:", err));
      }
    };
  }, [chatId, supabase, currentUserId]);

  return (
    <div className="flex-grow space-y-4 p-4 bg-gray-50 w-full min-h-0 overflow-y-auto rounded-lg border">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-center text-gray-500">No messages yet. Be the first to send one!</p>
        </div>
      )}
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`flex flex-col ${msg.sender_id === currentUserId ? 'items-end' : 'items-start'}`}>
          <div 
            className={`max-w-[70%] rounded-lg px-4 py-2 text-sm 
                        ${msg.sender_id === currentUserId 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-900'}`}
          >
            <p className="font-semibold mb-0.5">
              {msg.sender_id === currentUserId 
                ? "You" 
                : msg.profiles?.full_name || msg.profiles?.username || otherParticipant?.full_name || otherParticipant?.username || "User"}
            </p>
            <p>{msg.content}</p>
            <p className="text-xs mt-1 opacity-70 text-right">
              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}