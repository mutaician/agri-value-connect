import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Product } from "@/app/page"; // Assuming Product interface is in src/app/page.tsx
import { CreateProductForm } from "@/components/products/CreateProductForm";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

// Function to get product details, including non-available ones for editing by owner
async function getProductForEdit(id: string): Promise<Product | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('products')
    .select('*, profiles (id, role)') // Select only necessary profile fields for auth check
    .eq('id', id)
    .single();

  if (error) {
    console.error("Error fetching product for edit:", error);
    return null;
  }
  return data as Product;
}

export default async function EditProductPage({ params: receivedParams }: { params: { id: string } }) {
  const params = await receivedParams; // Await params as per Next.js dynamic API guidance
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=You need to be logged in to edit products.");
  }

  const product = await getProductForEdit(params.id);

  if (!product) {
    notFound(); // Product with this ID doesn't exist
  }

  // Authorization: Check if the logged-in user is the farmer who owns this product
  if (product.farmer_id !== user.id) {
    redirect("/my-listings?message=You are not authorized to edit this product.");
  }
  
  // Double check farmer role from profiles table, though ownership is primary here
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== 'farmer') {
     redirect("/?message=Only farmers can edit listings. Access denied.");
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-center text-green-800 mb-8">
        Edit Product Listing
      </h1>
      <CreateProductForm 
        userId={user.id} 
        productToEdit={product} 
        isEditMode={true} 
      />
    </div>
  );
} 