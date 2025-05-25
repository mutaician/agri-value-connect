"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
// revalidatePath and redirect are not used in this specific action currently.
// import { revalidatePath } from "next/cache";
// import { redirect } from "next/navigation";

/**
 * Gets an existing chat between a buyer and a farmer for a specific product,
 * or creates a new one if it doesn't exist.
 * 
 * @param productId The ID of the product being discussed.
 * @param farmerId The ID of the farmer (seller).
 * @returns The ID of the chat.
 * @throws If the user is not authenticated or if there's a database error.
 */
export async function getOrCreateChat(
  productId: string,
  farmerId: string // This is product.farmer_id
): Promise<{ chatId: string | null; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !currentUser) {
    console.error("getOrCreateChat: User not authenticated", authError);
    return { chatId: null, error: "User not authenticated. Please log in." };
  }

  const buyerId = currentUser.id; // The user initiating the contact

  if (buyerId === farmerId) {
    console.warn("getOrCreateChat: User attempted to create chat with themselves.");
    return { chatId: null, error: "Cannot create a chat with yourself." };
  }

  // Determine the canonical participant order for querying and unique constraints
  const p1 = buyerId < farmerId ? buyerId : farmerId;
  const p2 = buyerId < farmerId ? farmerId : buyerId;

  // Check if a chat already exists for this product between these two participants
  const { data: existingChat, error: fetchError } = await supabase
    .from("chats")
    .select("id")
    .eq("product_id", productId)
    .eq("participant_one_id", p1) // Use canonical order
    .eq("participant_two_id", p2) // Use canonical order
    .maybeSingle(); // Use maybeSingle to get one record or null, handles 0 or 1 row.

  if (fetchError) {
    console.error("getOrCreateChat: Error fetching existing chat:", fetchError);
    return { chatId: null, error: `Database error when fetching chat: ${fetchError.message}` };
  }

  if (existingChat) {
    return { chatId: existingChat.id, error: null };
  }

  // If no chat exists, create a new one, storing participants in canonical order.
  const { data: newChat, error: insertError } = await supabase
    .from("chats")
    .insert({
      product_id: productId,
      participant_one_id: p1, // Store in canonical order
      participant_two_id: p2, // Store in canonical order
      // created_at and updated_at have defaults in DB
    })
    .select("id")
    .single(); 

  if (insertError) {
    console.error("getOrCreateChat: Error creating new chat:", insertError);
    // Check for unique constraint violation if you have one (e.g., code '23505' for PostgreSQL)
    if (insertError.code === '23505') { // Unique violation
        // This theoretically shouldn't happen if the select logic above is correct and atomic,
        // but as a fallback, try to fetch again.
        console.warn("getOrCreateChat: Unique constraint violation on insert, attempting to re-fetch.");
        const { data: reFetchedChat, error: reFetchError } = await supabase
            .from("chats")
            .select("id")
            .eq("product_id", productId)
            .eq("participant_one_id", p1)
            .eq("participant_two_id", p2)
            .single();
        if (reFetchedChat && !reFetchError) {
            return { chatId: reFetchedChat.id, error: null };
        }
        return { chatId: null, error: `Could not create or retrieve chat: ${insertError.message}` };
    }
    return { chatId: null, error: `Could not create chat: ${insertError.message}` };
  }

  if (!newChat || !newChat.id) {
    console.error("getOrCreateChat: New chat created but ID is missing.");
    return { chatId: null, error: "Failed to retrieve chat ID after creation." };
  }
  
  return { chatId: newChat.id, error: null };
} 