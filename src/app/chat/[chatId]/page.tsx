import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatMessageInput from "@/components/chat/ChatMessageInput";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  full_name: string | null;
}

interface ProductInfo {
  id: string;
  title: string;
  image_urls: string[] | null;
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles?: Profile | null;
}

interface ChatDetails {
  id: string;
  product_id: string | null;
  participant_one_id: string;
  participant_two_id: string;
  otherParticipant: Profile | null;
  messages: Message[];
  product?: ProductInfo | null;
}

async function getChatDetails(chatId: string, currentUserId: string): Promise<ChatDetails | null> {
  const supabase = await createSupabaseServerClient();

  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .select(`
      id,
      product_id,
      participant_one_id,
      participant_two_id,
      products (id, title, image_urls)
    `)
    .eq("id", chatId)
    .maybeSingle();

  if (chatError || !chat) {
    console.error(`Error fetching chat ${chatId}:`, chatError);
    return null;
  }

  const p1Id = chat.participant_one_id;
  const p2Id = chat.participant_two_id;

  if (p1Id !== currentUserId && p2Id !== currentUserId) {
    console.warn(`User ${currentUserId} tried to access chat ${chatId} they are not part of.`);
    return null;
  }

  const otherParticipantId = p1Id === currentUserId ? p2Id : p1Id;

  const { data: otherParticipantProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, full_name")
    .eq("id", otherParticipantId)
    .single();
  
  if (profileError) {
    console.error(`Error fetching profile for participant ${otherParticipantId}:`, profileError);
    // Potentially return partial data or null depending on how critical this is
  }

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("*, profiles (id, username, avatar_url, full_name)")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (messagesError) {
    console.error(`Error fetching messages for chat ${chatId}:`, messagesError);
    // Return what we have, or null, depending on requirements
    const productData = Array.isArray(chat.products) ? chat.products[0] : chat.products;
    return {
        id: chat.id,
        product_id: chat.product_id,
        participant_one_id: chat.participant_one_id,
        participant_two_id: chat.participant_two_id,
        otherParticipant: otherParticipantProfile || null, // Use fetched profile, or null if error
        messages: [], // Empty messages due to error
        product: productData ? productData as ProductInfo : null
    } as ChatDetails;
  }
  
  const finalProductData = Array.isArray(chat.products) ? chat.products[0] : chat.products;
  return {
    id: chat.id,
    product_id: chat.product_id,
    participant_one_id: chat.participant_one_id,
    participant_two_id: chat.participant_two_id,
    otherParticipant: otherParticipantProfile || null, // Use fetched profile
    messages: (messages as Message[]) || [],
    product: finalProductData ? finalProductData as ProductInfo : null,
  };
}

export default async function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const supabaseForUser = await createSupabaseServerClient();
  const { data: { user: currentUser }, error: authError } = await supabaseForUser.auth.getUser();

  if (authError || !currentUser) {
    redirect("/login?message=Please log in to view chats.");
    return; // Return undefined, as redirect throws an error and stops execution
  }

  const { chatId } = await params;
  const chatDetails = await getChatDetails(chatId, currentUser.id);

  if (!chatDetails) {
    notFound(); // This will throw an error and stop execution
    return; // Added for explicitnes, though not strictly needed after notFound()
  }
  
  const productImageUrl = chatDetails.product?.image_urls?.[0] || '/placeholder-image.png';

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header Section - Made sticky below the main app header */}
      <div className="sticky top-[3.5rem] z-30 bg-white shadow-sm p-3 border-b">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href={chatDetails.product ? `/products/${chatDetails.product.id}` : "/chats"} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft size={20} />
            </Link>
            {chatDetails.otherParticipant?.avatar_url && (
              <Image
                src={chatDetails.otherParticipant.avatar_url}
                alt={chatDetails.otherParticipant.full_name || chatDetails.otherParticipant.username || "User"}
                width={40}
                height={40}
                className="rounded-full"
              />
            )}
            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                {chatDetails.otherParticipant?.full_name || chatDetails.otherParticipant?.username || "User"}
              </h1>
              {chatDetails.product && (
                 <p className="text-xs text-gray-500">
                  Regarding: <Link href={`/products/${chatDetails.product.id}`} className="hover:underline text-green-600">{chatDetails.product.title}</Link>
                </p>
              )}
            </div>
          </div>
          {chatDetails.product && (
             <Link href={`/products/${chatDetails.product.id}`} className="flex items-center space-x-2 text-sm text-green-700 hover:underline">
                {chatDetails.product.image_urls && chatDetails.product.image_urls.length > 0 && (
                     <Image src={productImageUrl} alt={chatDetails.product.title} width={32} height={32} className="rounded object-cover"/>
                )}
                <span>View Product</span>
             </Link>
          )}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-grow overflow-y-auto container mx-auto max-w-4xl w-full">
        <ChatMessages 
          initialMessages={chatDetails.messages}
          chatId={chatDetails.id}
          currentUserId={currentUser.id}
          otherParticipant={chatDetails.otherParticipant}
        />
      </div>
      
      {/* Message Input Area */}
      <div className="bg-white p-3 sm:p-4 border-t">
        <div className="container mx-auto max-w-4xl">
          <ChatMessageInput 
            chatId={chatDetails.id}
          />
        </div>
      </div>
    </div>
  );
} 