import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { AuthButtonClient } from "@/components/auth/AuthButtonClient";
import { Button } from "@/components/ui/button";
import { List, PlusCircle } from "lucide-react";

export async function Header() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userRole: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile) {
      userRole = profile.role;
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center h-16 max-w-screen-2xl">
        <Link href="/" className="mr-auto font-bold text-lg text-green-700 hover:text-green-800">
          AgriValue Connect
        </Link>
        
        <nav className="flex items-center gap-2 sm:gap-4 text-sm font-medium mx-4">
          {/* General navigation links can go here if any in the future */}
          {userRole === 'farmer' && (
            <>
              <Link 
                href="/my-listings" 
                className="text-muted-foreground transition-colors hover:text-foreground flex items-center px-3 py-2 rounded-md hover:bg-accent"
              >
                <List className="w-4 h-4 mr-1 sm:mr-2" />
                My Listings
              </Link>
              <Link 
                href="/products/new" 
                className="text-muted-foreground transition-colors hover:text-foreground flex items-center px-3 py-2 rounded-md hover:bg-accent"
              >
                <PlusCircle className="w-4 h-4 mr-1 sm:mr-2" />
                Add Produce
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center justify-end flex-shrink-0 ml-auto">
          <AuthButtonClient 
            isUserLoggedIn={!!user}
            userEmail={user?.email}
          />
        </div>
      </div>
    </header>
  );
} 