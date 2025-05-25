"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
// import { cookies } from "next/headers"; // Not explicitly needed if client handles cookies automatically

export async function deleteProduct(productId: string): Promise<{ success: boolean; message: string }> {
  // const cookieStore = cookies(); // Not explicitly needed
  const supabase = await createSupabaseServerClient(); // Removed cookieStore argument

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Delete product: User not authenticated", userError);
    return { success: false, message: "User not authenticated. Please log in." };
  }

  // First, fetch the product to verify ownership and get image URLs
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("farmer_id, image_urls")
    .eq("id", productId)
    .single();

  if (fetchError) {
    console.error(`Delete product: Error fetching product ${productId}:`, fetchError);
    return { success: false, message: `Error fetching product: ${fetchError.message}` };
  }

  if (!product) {
    return { success: false, message: "Product not found." };
  }

  if (product.farmer_id !== user.id) {
    console.warn(`Delete product: User ${user.id} attempted to delete product ${productId} owned by ${product.farmer_id}`);
    return { success: false, message: "You are not authorized to delete this product." };
  }

  // Update product status to "delisted" and clear image_urls
  const { error: updateError } = await supabase
    .from("products")
    .update({ 
      status: "delisted", 
      image_urls: [], // Clear image_urls array
      updated_at: new Date().toISOString() 
    })
    .eq("id", productId);

  if (updateError) {
    console.error(`Delete product: Error updating product ${productId} to delisted:`, updateError);
    return { success: false, message: `Failed to delist product: ${updateError.message}` };
  }

  // Optionally, attempt to delete images from storage
  if (product.image_urls && product.image_urls.length > 0) {
    const imageFileNames = product.image_urls.map((url: string) => { // Added type for url
      try {
        // Ensure we have a valid URL by checking if it's a fully qualified URL
        if (!url.startsWith('http')) {
          // If not a full URL, it might just be the path part
          const fileNameParts = url.split('/');
          // Extract just the file path after product-images
          const productImagesIndex = fileNameParts.indexOf('product-images');
          return productImagesIndex >= 0 ? 
            fileNameParts.slice(productImagesIndex + 1).join('/') : 
            url; // Fallback to the original string if pattern not matched
        }
        
        // For fully qualified URLs, parse them properly
        const pathParts = new URL(url).pathname.split('/');
        // Assuming URL format like .../storage/v1/object/public/product-images/farmer-id/image.jpg
        // We want "farmer-id/image.jpg"
        return pathParts.slice(pathParts.indexOf('product-images') + 1).join('/');
      } catch (e) {
        console.warn(`Could not parse image URL for deletion: ${url}`, e);
        return null;
      }
    }).filter((name: string | null) => name !== null) as string[]; // Added type for name

    if (imageFileNames.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("product-images")
        .remove(imageFileNames);
      
      if (storageError) {
        // Log this error but don't fail the whole operation, as the main goal (delisting) succeeded.
        console.error(`Delete product: Error deleting images for product ${productId} from storage:`, storageError);
        // We could return a partial success message here if needed.
      }
    }
  }

  revalidatePath("/my-listings");
  revalidatePath("/"); // Also revalidate homepage in case delisted products should disappear
  revalidatePath(`/products/${productId}`); // Revalidate single product page

  return { success: true, message: "Product successfully delisted." };
} 