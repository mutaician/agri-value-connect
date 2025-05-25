"use client";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

interface AuthButtonClientProps {
  isUserLoggedIn: boolean;
  userEmail?: string | null;
}

export function AuthButtonClient({ isUserLoggedIn, userEmail }: AuthButtonClientProps) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login"); // Redirect to login after sign out
    router.refresh(); // Ensure UI updates across the app
  };

  if (isUserLoggedIn) {
    return (
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/chats" className="flex items-center">
            <MessageSquare size={16} className="mr-2" />
            Chats
          </Link>
        </Button>
        <span className="text-sm text-gray-700">{userEmail}</span>
        <Button onClick={handleSignOut} variant="outline" size="sm">
          Logout
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href="/login">Login</Link>
      </Button>
      <Button asChild variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
        <Link href="/signup">Sign Up</Link>
      </Button>
    </div>
  );
} 