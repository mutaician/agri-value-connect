"use client";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, UserCircle2 } from "lucide-react";

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
      <div className="flex items-center gap-2 sm:gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/chats" className="flex items-center">
            <MessageSquare size={16} className="mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Chats</span>
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/profile" className="flex items-center">
            <UserCircle2 size={16} className="mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Profile</span>
          </Link>
        </Button>
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