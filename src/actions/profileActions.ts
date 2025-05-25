"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Schema for the data we expect to update the profile
// Should align with the form values and be a subset of what's in the profiles table.
const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(100).optional().nullable(),
  username: z.string().min(3).max(50).optional().nullable(),
  location_text: z.string().max(200).optional().nullable(),
  contact_info: z.string().max(100).optional().nullable(),
  buyer_type: z.string().max(100).optional().nullable(), // For buyers
  typical_crops_grown_csv: z.string().max(500).optional().nullable(), // For farmers, as CSV
  avatar_url: z.string().url().optional().nullable(), // If we add avatar uploads later
  bio: z.string().max(1000).optional().nullable(), // Add bio field, adjust max length as needed
});

export type UpdateProfileData = z.infer<typeof updateProfileSchema>;

interface UpdateProfileResult {
  success: boolean;
  error?: string;
  updatedProfile?: any; // Consider defining a proper type if needed
}

export async function updateProfile(
  userId: string,
  data: UpdateProfileData
): Promise<UpdateProfileResult> {
  const supabase = await createSupabaseServerClient();

  // Validate the input data against the schema
  const parsedData = updateProfileSchema.safeParse(data);
  if (!parsedData.success) {
    console.error("Invalid profile update data:", parsedData.error.flatten().fieldErrors);
    return { success: false, error: "Invalid data provided. " + Object.values(parsedData.error.flatten().fieldErrors).flat().join(", ") };
  }

  const { typical_crops_grown_csv, ...restOfData } = parsedData.data;
  
  let profileUpdateData: Partial<typeof restOfData & { typical_crops_grown?: string[], bio?: string|null }> = { ...restOfData };

  // Convert CSV string for typical_crops_grown to a string array if provided
  if (typeof typical_crops_grown_csv === 'string' && typical_crops_grown_csv.trim() !== "") {
    profileUpdateData.typical_crops_grown = typical_crops_grown_csv.split(',').map(s => s.trim()).filter(s => s !== "");
  } else if (typical_crops_grown_csv === null || typical_crops_grown_csv?.trim() === "") {
    // If explicitly set to empty or null, store as empty array or null based on DB preference (using empty array here)
    profileUpdateData.typical_crops_grown = [];
  }

  // Ensure we don't try to update with undefined values, only null or actual values.
  // Supabase client might handle this, but explicit cleaning is safer.
  Object.keys(profileUpdateData).forEach(key => {
    if (profileUpdateData[key as keyof typeof profileUpdateData] === undefined) {
      delete profileUpdateData[key as keyof typeof profileUpdateData];
    }
  });

  if (Object.keys(profileUpdateData).length === 0) {
    return { success: true, error: "No changes provided." }; // Or success:false if this is an error condition
  }
  
  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update(profileUpdateData)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error(`Error updating profile for user ${userId}:`, error);
    return { success: false, error: error.message };
  }

  revalidatePath("/profile"); // Revalidate the profile page to show updated info
  revalidatePath("/"); // Revalidate home if profile info is shown there
  // Potentially revalidate other paths where profile info (like name/avatar) might be displayed, e.g., /products/[id]

  return { success: true, updatedProfile };
} 