import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MessageSquare, PackageSearch, UserCircle2 } from "lucide-react";
import { formatDistanceToNow, parseISO } from 'date-fns';

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

interface ChatListItem {
  id: string;
  created_at: string;
  updated_at: string | null;
  product_id: string | null;
  participant_one_id: string;
  participant_two_id: string;
  last_message_preview: string | null;
  otherParticipant: Profile | null;
  product?: ProductInfo | null;
}

async function getUserChats(userId: string): Promise<ChatListItem[]> {
  const supabase = await createSupabaseServerClient();

  // Fetch chats where the current user is a participant
  const { data: chats, error: chatsError } = await supabase
    .from("chats")
    .select(`
      id,
      created_at,
      updated_at,
      product_id,
      participant_one_id,
      participant_two_id,
      last_message_preview,
      products (id, title, image_urls) 
    `)
    .or(`participant_one_id.eq.${userId},participant_two_id.eq.${userId}`)
    .order("updated_at", { ascending: false, nullsFirst: false }); // Show most recent chats first

  if (chatsError) {
    console.error("Error fetching user chats:", chatsError);
    return [];
  }

  if (!chats) {
    return [];
  }

  // For each chat, determine the other participant and fetch their profile
  const enrichedChats = await Promise.all(
    chats.map(async (chat) => {
      const otherParticipantId = chat.participant_one_id === userId 
        ? chat.participant_two_id 
        : chat.participant_one_id;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, full_name")
        .eq("id", otherParticipantId)
        .single();

      if (profileError) {
        console.error(`Error fetching profile for participant ${otherParticipantId} in chat ${chat.id}:`, profileError);
      }
      
      return {
        ...chat,
        otherParticipant: profile || null,
        product: chat.products as ProductInfo || null, // Supabase returns joined table as object
      } as ChatListItem;
    })
  );

  return enrichedChats;
}

export default async function ChatsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?message=Please log in to view your chats.");
  }

  const chats = await getUserChats(user.id);

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Your Chats</h1>
        {/* Optional: Link to start new chat or browse products if needed */}
      </div>

      {chats.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No chats yet.</h2>
          <p className="text-gray-500 mb-6">Start a conversation by contacting a farmer on a product listing.</p>
          <Link href="/" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            <PackageSearch size={18} className="mr-2" />
            Browse Products
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {chats.map((chat) => {
            const otherUserDisplayName = chat.otherParticipant?.full_name || chat.otherParticipant?.username || "User";
            const otherUserAvatar = chat.otherParticipant?.avatar_url || '/default-avatar.png';
            const productImageUrl = chat.product?.image_urls?.[0] || null;

            return (
              <li key={chat.id} className="bg-white shadow-md rounded-lg hover:shadow-lg transition-shadow duration-200">
                <Link href={`/chat/${chat.id}`} className="block p-4 sm:p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 pt-1">
                      <Image
                        src={otherUserAvatar}
                        alt={otherUserDisplayName}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="text-lg font-semibold text-green-700 truncate" title={otherUserDisplayName}>
                          {otherUserDisplayName}
                        </h3>
                        {chat.updated_at && (
                          <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {formatDistanceToNow(parseISO(chat.updated_at), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                      {chat.product && (
                        <p className="text-sm text-gray-500 truncate mb-1.5" title={chat.product.title}>
                          Regarding: <span className="font-medium">{chat.product.title}</span>
                        </p>
                      )}
                      <p className="text-sm text-gray-600 truncate" title={chat.last_message_preview || 'No messages yet'}>
                        {chat.last_message_preview || <span className="italic text-gray-400">No messages yet...</span>}
                      </p>
                    </div>
                    {productImageUrl && (
                      <div className="flex-shrink-0 ml-4 hidden sm:block">
                         <Image
                            src={productImageUrl}
                            alt={chat.product?.title || 'Product image'}
                            width={64}
                            height={64}
                            className="rounded-md object-cover"
                          />
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
} 