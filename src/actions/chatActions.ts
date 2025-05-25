"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Define a more specific type for a message
export interface MessageType {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string; // Assuming ISO string format
  // Add other fields like profiles if they are part of the message object structure
  // profiles?: { username: string; avatar_url?: string | null } | null;
}

interface SendMessageResult {
  success: boolean;
  error?: string;
  message?: MessageType; 
}

export async function sendMessage(
  chatId: string,
  content: string
): Promise<SendMessageResult> {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Error sending message: User not authenticated", authError);
    return { success: false, error: "User not authenticated" };
  }

  if (!chatId || !content.trim()) {
    return { success: false, error: "Chat ID and content are required." };
  }

  // Optional: Verify user is a participant of the chat before allowing them to send a message
  // This adds an extra layer of security on the server-side.
  const { data: chat, error: chatFetchError } = await supabase
    .from("chats")
    .select("participant_one_id, participant_two_id")
    .eq("id", chatId)
    .single(); 

  if (chatFetchError || !chat) {
    console.error(`Error sending message: Chat not found or error fetching chat ${chatId}`, chatFetchError);
    return { success: false, error: "Chat not found or error verifying participation." };
  }

  if (user.id !== chat.participant_one_id && user.id !== chat.participant_two_id) {
    console.warn(`User ${user.id} attempted to send message to chat ${chatId} they are not part of.`);
    return { success: false, error: "You are not a participant of this chat." };
  }

  const newMessage = {
    chat_id: chatId,
    sender_id: user.id,
    content: content.trim(),
  };

  const { data: insertedMessage, error: insertError } = await supabase
    .from("messages")
    .insert(newMessage)
    .select()
    .single();

  if (insertError) {
    console.error(`Error sending message to chat ${chatId}:`, insertError);
    return { success: false, error: insertError.message };
  }

  // After successfully inserting the message, update the chat's last_message_preview and updated_at
  const previewContent = content.trim().substring(0, 75); // Keep preview reasonably short
  const { error: updateChatError } = await supabase
    .from("chats")
    .update({
      last_message_preview: previewContent,
      updated_at: new Date().toISOString(),
    })
    .eq("id", chatId);

  if (updateChatError) {
    // Log this error, but don't necessarily fail the whole operation if message insert succeeded
    console.error(`Error updating chat ${chatId} metadata:`, updateChatError);
  }

  // Revalidate the path to ensure the sender sees the new message.
  // Realtime will hopefully update other clients.
  revalidatePath(`/chat/${chatId}`);
  revalidatePath(`/chats`); // Also revalidate the chats list page

  return { success: true, message: insertedMessage };
} 