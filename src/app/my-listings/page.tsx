import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Product } from "@/app/page"; // Re-use Product interface
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit3, AlertTriangle } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { DeleteProductButton } from "@/components/products/DeleteProductButton";
import { calculateDiscountedPrice, DiscountDetails } from "@/lib/utils";

async function getMyListings(userId: string): Promise<Product[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, profiles (username, full_name, avatar_url)") // Keep profiles join for consistency, though not strictly needed if only showing own listings
    .eq("farmer_id", userId);
    // Removed .order here, will sort manually after fetching

  if (error) {
    console.error("Error fetching user listings:", error);
    return [];
  }
  
  // Sort products: active ones first (by creation date), then delisted ones (by creation date)
  const sortedData = (data as Product[]).sort((a, b) => {
    if (a.status === 'delisted' && b.status !== 'delisted') return 1; // b comes first
    if (a.status !== 'delisted' && b.status === 'delisted') return -1; // a comes first
    // If both are delisted or both are not, sort by creation date (newest first)
    // Assuming created_at is a valid ISO string or parsable date
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return sortedData;
}

// Simplified card for My Listings page
function MyProductCard({ product }: { product: Product }) {
  const isDelisted = product.status === 'delisted';
  const imageUrl = product.image_urls && product.image_urls.length > 0
    ? product.image_urls[0]
    : '/placeholder-image.png';
  
  const discount: DiscountDetails = calculateDiscountedPrice(product.price_per_unit, product.expires_at);

  return (
    <div className={`bg-white shadow-lg rounded-lg overflow-hidden flex flex-col sm:flex-row ${isDelisted ? 'opacity-60 grayscale' : ''}`}>
      <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0">
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 640px) 100vw, 200px"
        />
      </div>
      <div className="p-4 sm:p-6 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-green-700 mb-1">{product.title}</h3>
          <p className="text-sm text-gray-500 mb-1">Crop: {product.crop_type}</p>
          
          {discount.hasDiscount ? (
            <div className="mb-1">
              <p className="text-sm text-gray-500">
                Price: <span className="text-red-600 font-semibold">{new Intl.NumberFormat('en-KE', { style: 'currency', currency: product.currency || 'KES' }).format(discount.discountedPrice)}</span> ({Math.round(discount.discountPercentage * 100)}% off)
              </p>
              <p className="text-xs text-gray-400 line-through">
                Original: {new Intl.NumberFormat('en-KE', { style: 'currency', currency: product.currency || 'KES' }).format(discount.originalPrice)} / {product.quantity_unit}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-1">Price: {product.price_per_unit} {product.currency}/{product.quantity_unit}</p>
          )}

          <p className="text-sm text-gray-500 mb-2">
            Status: <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${isDelisted ? 'bg-gray-200 text-gray-700' : product.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{product.status}</span>
          </p>
          <p className="text-xs text-gray-400 mb-3">Expires: {formatDistanceToNow(parseISO(product.expires_at), { addSuffix: true })}</p>
        </div>
        <div className="mt-3 sm:mt-0 flex flex-col sm:flex-row sm:items-center gap-2">
          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto" disabled={isDelisted}>
            <Link href={`/products/edit/${product.id}`} className={`flex items-center justify-center ${isDelisted ? 'pointer-events-none' : '' }`}>
              <Edit3 className="w-4 h-4 mr-2" /> Edit
            </Link>
          </Button>
          <DeleteProductButton productId={product.id} productTitle={product.title} />
        </div>
      </div>
    </div>
  );
}

export default async function MyListingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Middleware should catch this, but defensive check
    redirect("/login?message=You must be logged in to view your listings.");
  }

  // Fetch user's profile to check role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("Error fetching profile for my listings:", profileError);
    // Redirect or show error, e.g. if profile doesn't exist for some reason
    redirect("/?message=Could not find your profile information.");
  }

  if (profile.role !== 'farmer') {
    redirect("/?message=Only farmers can manage listings. Access denied.");
  }

  const listings = await getMyListings(user.id);

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-green-800 mb-4 sm:mb-0">
          My Product Listings
        </h1>
        <Button asChild>
          <Link href="/products/new" className="flex items-center">
            <PlusCircle className="w-5 h-5 mr-2" /> Add New Listing
          </Link>
        </Button>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-10 px-6 bg-white rounded-lg shadow-md">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Listings Yet!</h2>
          <p className="text-gray-500 mb-6">You haven&apos;t added any products to the marketplace. Click the button above to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {listings.map((listing) => (
            <MyProductCard key={listing.id} product={listing} />
          ))}
        </div>
      )}
    </div>
  );
} 