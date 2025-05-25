import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import { MapPin, Briefcase } from "lucide-react";
// We will create EditProfileForm next
import EditProfileForm from "@/components/profile/EditProfileForm"; 

export const dynamic = 'force-dynamic'; // Ensure fresh data on each load

// Matches the structure of your 'profiles' table + auth email
export interface UserProfile {
  id: string;
  created_at: string;
  updated_at: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: 'farmer' | 'buyer' | null;
  location_text: string | null;
  contact_info: string | null;
  buyer_type: string | null; // e.g., 'individual', 'restaurant', 'exporter'
  typical_crops_grown: string[] | null; // For farmers
  bio: string | null; // Add bio field
  email?: string | null; // From auth.users
}

async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Error fetching auth user for profile:", authError);
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error(`Error fetching profile for user ${user.id}:`, profileError);
    // It's possible a profile doesn't exist if the trigger failed, though unlikely.
    // Return a basic profile structure with email and ID from auth user.
    return {
        id: user.id,
        email: user.email,
        created_at: user.created_at, // or a default if not available
        updated_at: user.updated_at || null, // or a default
        username: null, full_name: null, avatar_url: null, role: null, 
        location_text: null, contact_info: null, buyer_type: null, typical_crops_grown: null,
        bio: null // Ensure bio is in the default return
    } as UserProfile;
  }
  
  return { ...profile, email: user.email };
}

export default async function ProfilePage() {
  const profile = await getUserProfile();

  if (!profile) {
    redirect("/login?message=Please log in to view your profile.");
  }

  const avatarUrl = profile.avatar_url || '/default-avatar.png';

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
            {/* Placeholder for avatar upload icon if we add that later */}
            {/* <button className="absolute bottom-0 right-0 bg-gray-700 hover:bg-gray-800 text-white p-2 rounded-full shadow-md">
              <Edit3 size={16} />
            </button> */} 
          </div>
          <div className="text-center sm:text-left flex-grow">
            <h1 className="text-3xl font-bold text-gray-800 mb-1">{profile.full_name || profile.username || "Unnamed User"}</h1>
            {profile.username && <p className="text-md text-gray-500">@{profile.username}</p>}
            <p className="text-sm text-gray-500 mt-0.5">{profile.email}</p>
            {profile.role && (
              <span className={`mt-2 inline-block px-3 py-1 text-xs font-semibold rounded-full ${profile.role === 'farmer' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </span>
            )}
          </div>
        </div>

        {profile.bio && (
          <div className="mb-8 pb-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">About</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{profile.bio}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Contact Information</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium">Email:</span> {profile.email || "Not set"}</p>
              <p><span className="font-medium">Contact:</span> {profile.contact_info || "Not set"}</p>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Location</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p><MapPin size={14} className="inline mr-1 mb-0.5" /> {profile.location_text || "Not set"}</p>
            </div>
          </div>
          {profile.role === 'farmer' && profile.typical_crops_grown && profile.typical_crops_grown.length > 0 && (
            <div className="md:col-span-2">
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
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-3">Buyer Type</h2>
              <p className="text-sm text-gray-600"><Briefcase size={14} className="inline mr-1 mb-0.5" /> {profile.buyer_type}</p>
            </div>
          )}
        </div>
        
        {/* Edit Profile Form will be conditionally rendered here or via a modal */}
        <EditProfileForm userProfile={profile} />

      </div>
    </div>
  );
} 