"use client";

import { UserProfile } from "@/app/profile/page"; // Import the UserProfile type
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Import Select components
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form"; // Import Controller
import * as z from "zod";
import { useState } from "react";
import { useRouter } from 'next/navigation'; // For router.refresh()
import { updateProfile, UpdateProfileData } from "@/actions/profileActions"; // Import the server action

// Define Zod schema for profile editing (subset of UserProfile, only editable fields)
const profileFormSchema = z.object({
  full_name: z.string().min(2, { message: "Full name must be at least 2 characters." }).max(100).optional().nullable(),
  username: z.string().min(3, { message: "Username must be at least 3 characters." }).max(50).optional().nullable(),
  location_text: z.string().max(200).optional().nullable(),
  contact_info: z.string().max(100).optional().nullable(),
  buyer_type: z.string().max(100).optional().nullable(),
  typical_crops_grown_csv: z.string().max(500).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileFormProps {
  userProfile: UserProfile;
}

const BUYER_TYPES = ["individual", "vendor", "restaurant"] // Expanded list, adjust as needed

export default function EditProfileForm({ userProfile }: EditProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: userProfile.full_name || "",
      username: userProfile.username || "",
      location_text: userProfile.location_text || "",
      contact_info: userProfile.contact_info || "",
      buyer_type: userProfile.buyer_type || "",
      typical_crops_grown_csv: userProfile.typical_crops_grown?.join(", ") || "",
      bio: userProfile.bio || "",
    },
    mode: "onChange",
  });

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);
    setFormMessage(null);
    
    // Prepare only the changed data
    const changedData: Partial<UpdateProfileData> = {};
    Object.keys(data).forEach(key => {
      const formKey = key as keyof ProfileFormValues;
      const profileKey = key as keyof UserProfile;
      // Ensure we are comparing correctly, especially for arrays like typical_crops_grown
      let originalValue = userProfile[profileKey];
      if (formKey === 'typical_crops_grown_csv' && Array.isArray(userProfile.typical_crops_grown)) {
        originalValue = userProfile.typical_crops_grown.join(", ");
      }

      if (data[formKey] !== (originalValue ?? "")) { // Check against original or empty string for nulls
        changedData[formKey] = data[formKey] === "" ? null : data[formKey]; // Send null if empty string
      }
    });

    if (Object.keys(changedData).length === 0) {
        setFormMessage({ type: 'success', text: 'No changes detected.' });
        setIsLoading(false);
        setIsEditing(false); 
        return;
    }

    const result = await updateProfile(userProfile.id, changedData as UpdateProfileData);

    if (result.success) {
      setFormMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      router.refresh(); // Refresh Server Components on the page to show new data
    } else {
      setFormMessage({ type: 'error', text: result.error || 'Failed to update profile.' });
    }
    setIsLoading(false);
  }

  if (!isEditing) {
    return (
      <div className="mt-6 text-right">
        <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
      </div>
    );
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Edit Your Profile</h2>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="full_name">Full Name</Label>
          <Input id="full_name" {...form.register("full_name")} className="mt-1" />
          {form.formState.errors.full_name && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.full_name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="username">Username</Label>
          <Input id="username" {...form.register("username")} className="mt-1" />
          {form.formState.errors.username && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.username.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="location_text">Location (City/Area)</Label>
          <Input id="location_text" {...form.register("location_text")} className="mt-1" />
          {form.formState.errors.location_text && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.location_text.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="contact_info">Contact Info (Phone/Social)</Label>
          <Input id="contact_info" {...form.register("contact_info")} className="mt-1" />
          {form.formState.errors.contact_info && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.contact_info.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="bio">Bio / Description</Label>
          <Textarea 
            id="bio" 
            {...form.register("bio")} 
            className="mt-1" 
            rows={4}
            placeholder="Tell us a little about yourself or your farming/buying activities..."
          />
          {form.formState.errors.bio && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.bio.message}</p>
          )}
        </div>

        {/* Fields for Farmer */}
        {userProfile.role === 'farmer' && (
          <div>
            <Label htmlFor="typical_crops_grown_csv">Typical Crops Grown (comma-separated)</Label>
            <Textarea 
              id="typical_crops_grown_csv" 
              {...form.register("typical_crops_grown_csv")} 
              className="mt-1" 
              placeholder="e.g., Maize, Beans, Tomatoes"
            />
            {form.formState.errors.typical_crops_grown_csv && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.typical_crops_grown_csv.message}</p>
            )}
          </div>
        )}

        {/* Fields for Buyer */}
        {userProfile.role === 'buyer' && (
          <div>
            <Label htmlFor="buyer_type">Type of Buyer</Label>
            <Controller
              name="buyer_type"
              control={form.control}
              render={({ field }) => (
                <Select 
                  value={field.value || ""} 
                  onValueChange={(value) => field.onChange(value === "_clear_" ? null : value)} // Send null if special clear value selected
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your buyer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_clear_"><em>None (Clear Selection)</em></SelectItem> {/* Use a non-empty value */}
                    {BUYER_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.buyer_type && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.buyer_type.message}</p>
            )}
          </div>
        )}

        {formMessage && (
          <p className={`text-sm ${formMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {formMessage.text}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => {
                setIsEditing(false);
                form.reset({
                    full_name: userProfile.full_name || "",
                    username: userProfile.username || "",
                    location_text: userProfile.location_text || "",
                    contact_info: userProfile.contact_info || "",
                    buyer_type: userProfile.buyer_type || "",
                    typical_crops_grown_csv: userProfile.typical_crops_grown?.join(", ") || "",
                    bio: userProfile.bio || "",
                });
                setFormMessage(null);
            }} disabled={isLoading}>
                Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                {isLoading ? "Saving..." : "Save Changes"}
            </Button>
        </div>
      </form>
    </div>
  );
} 