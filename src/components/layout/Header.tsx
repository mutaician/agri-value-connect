import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { AuthButtonClient } from "@/components/auth/AuthButtonClient";

export async function Header() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center h-16 max-w-screen-2xl">
        <Link href="/" className="mr-6 font-bold text-lg text-green-700 hover:text-green-800">
          AgriValue Connect
        </Link>
        <nav className="flex items-center flex-1 gap-6 text-sm font-medium">
          {/* Add other nav links here if needed, e.g.: */}
          {/* <Link href="/products" className="text-muted-foreground transition-colors hover:text-foreground">Products</Link> */}
          {/* <Link href="/my-listings" className="text-muted-foreground transition-colors hover:text-foreground">My Listings</Link> */}
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