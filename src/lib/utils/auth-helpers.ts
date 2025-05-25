import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Checks if user is logged in and refreshes session if needed
 * Use this helper in client components when you need to verify auth state
 */
export async function ensureAuth() {
  const supabase = createSupabaseBrowserClient();
  
  // First check session
  const { data: { session } } = await supabase.auth.getSession();
  
  // If no session or expired, try to refresh
  if (!session || (session.expires_at && session.expires_at * 1000 < Date.now())) {
    // Try to refresh the session
    const { data: refreshData } = await supabase.auth.refreshSession();
    return !!refreshData.session;
  }
  
  return !!session;
}
