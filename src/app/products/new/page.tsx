import { CreateProductForm } from "@/components/products/CreateProductForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NewProductPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please login to create a product listing.");
    return; // Important to return after redirect
  }

  // Fetch user's profile to check their role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Error fetching profile for product listing page:", profileError);
    // Redirect to an error page or homepage with a generic error message
    redirect("/?message=Could not verify user role. Please try again.");
    return;
  }

  if (!profile || profile.role !== 'farmer') {
    redirect("/?message=Only farmers can list new products.");
    return;
  }

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-green-700">List New Produce</h1>
      <CreateProductForm userId={user.id} />
    </div>
  );
} 