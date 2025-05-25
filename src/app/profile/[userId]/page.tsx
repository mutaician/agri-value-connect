import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { UserCircle2, MapPin, Briefcase } from "lucide-react";
import Link from "next/link";

// Matches the structure of your 'profiles' table + auth email
// This can be shared or imported if it becomes common
interface PublicUserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: 'farmer' | 'buyer' | null;
  location_text: string | null;
  // contact_info: string | null; // Usually not public unless explicitly set by user
  buyer_type: string | null;
  typical_crops_grown: string[] | null;
  bio: string | null;
  // email?: string | null; // Usually not public
}

async function getPublicUserProfile(userId: string): Promise<PublicUserProfile | null> {
  const supabase = await createSupabaseServerClient();
  
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    // Select only publicly viewable fields
    .select("id, username, full_name, avatar_url, role, location_text, buyer_type, typical_crops_grown, bio")
    .eq("id", userId)
    .single();

  if (profileError) {
    console.error(`Error fetching public profile for user ${userId}:`, profileError);
    return null;
  }
  
  return profile as PublicUserProfile;
}

export default async function UserProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = await params;
  const profile = await getPublicUserProfile(userId);

  if (!profile) {
    notFound(); // Or a more user-friendly "Profile not found" page
  }

  const avatarUrl = profile.avatar_url || '/default-avatar.png';

  // Check if the current user is viewing their own public profile
  // to potentially offer a link to their editable profile page.
  const supabase = await createSupabaseServerClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const isOwnPublicProfile = currentUser?.id === profile.id;

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start mb-6 sm:mb-8 pb-6 border-b border-gray-200">
          <div className="relative mb-4 sm:mb-0 sm:mr-6 flex-shrink-0">
            <Image
              src={avatarUrl}
              alt={profile.full_name || profile.username || "User Avatar"}
              width={128}
              height={128}
              className="rounded-full object-cover border-4 border-gray-200 shadow-sm"
            />
          </div>
          <div className="text-center sm:text-left flex-grow">
            <h1 className="text-3xl font-bold text-gray-800 mb-1">{profile.full_name || profile.username || "User"}</h1>
            {profile.username && <p className="text-md text-gray-500">@{profile.username}</p>}
            {/* Do not display email on public profiles unless intended */}
            {profile.role && (
              <span className={`mt-2 inline-block px-3 py-1 text-xs font-semibold rounded-full ${profile.role === 'farmer' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </span>
            )}
            {isOwnPublicProfile && (
                <Link href="/profile" className="mt-3 inline-block text-sm text-green-600 hover:text-green-700 underline">
                    View and Edit Your Profile
                </Link>
            )}
          </div>
        </div>

        {profile.bio && (
          <div className="mb-8 pb-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">About {profile.full_name || profile.username}</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{profile.bio}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Display location if available and considered public */}
          {profile.location_text && (
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-3">Location</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <p><MapPin size={14} className="inline mr-1 mb-0.5" /> {profile.location_text}</p>
              </div>
            </div>
          )}
          
          {profile.role === 'farmer' && profile.typical_crops_grown && profile.typical_crops_grown.length > 0 && (
            <div className={profile.location_text ? "md:col-span-1" : "md:col-span-2"}> {/* Adjust span if location is not shown*/}
              <h2 className="text-xl font-semibold text-gray-700 mb-3">Crops Typically Grown</h2>
              <div className="flex flex-wrap gap-2">
                {profile.typical_crops_grown.map(crop => (
                  <span key={crop} className="px-2.5 py-1 text-xs font-medium bg-lime-100 text-lime-800 rounded-full">
                    {crop}
                  </span>
                ))}
              </div>
            </div>
          )}
          {profile.role === 'buyer' && profile.buyer_type && (
             <div className={profile.location_text ? "md:col-span-1" : "md:col-span-2"}> {/* Adjust span if location is not shown*/}
              <h2 className="text-xl font-semibold text-gray-700 mb-3">Buyer Type</h2>
              <p className="text-sm text-gray-600"><Briefcase size={14} className="inline mr-1 mb-0.5" /> {profile.buyer_type}</p>
            </div>
          )}
        </div>
        
        {/* Consider adding a section to display this user's active product listings if they are a farmer */}
        {/* For example: <UserProductListings userId={profile.id} /> */}

      </div>
    </div>
  );
} 