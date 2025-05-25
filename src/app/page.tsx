import { createSupabaseServerClient } from "@/lib/supabase/server";
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Tag, MapPin, CalendarDays, Percent } from 'lucide-react';
import SearchAndSortControls from '@/components/products/SearchAndSortControls';
import { calculateDiscountedPrice, DiscountDetails } from "@/lib/utils";

export const dynamic = 'force-dynamic'; // Explicitly set dynamic rendering

// Define a type for our product data for better type safety
export interface Product {
  id: string;
  created_at: string;
  updated_at: string | null;
  farmer_id: string;
  title: string;
  description: string | null;
  crop_type: string;
  quantity: number;
  quantity_unit: string;
  price_per_unit: number;
  currency: string;
  image_urls: string[] | null;
  location_text: string;
  available_from: string; // ISO string date
  expires_at: string; // ISO string date
  status: string; // e.g., 'available', 'sold', 'expired'
  current_discount: number | null;
  // Add farmer details
  profiles?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

async function getProducts(searchTerm?: string, sortBy?: string): Promise<Product[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("products")
    .select(`
      *,
      profiles (username, full_name, avatar_url)
    `)
    .eq("status", "available");

  if (searchTerm) {
    query = query.or(`title.ilike.%${searchTerm}%,crop_type.ilike.%${searchTerm}%`);
  }

  // Default sort order if sortBy is not provided or invalid
  let columnToSort = "created_at";
  let ascending = false;

  if (sortBy) {
    const parts = sortBy.split('_');
    if (parts.length > 1) {
      const direction = parts.pop(); // 'asc' or 'desc'
      const potentialColumn = parts.join('_'); // e.g., 'price_per_unit', 'created_at'
      
      columnToSort = potentialColumn;

      if (direction === 'asc') {
        ascending = true;
      } else if (direction === 'desc') {
        ascending = false;
      } else {
        ascending = false; 
      }
    } 
  }

  query = query.order(columnToSort, { ascending });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }
  return data as Product[];
}

// Simple Product Card Component (can be moved to its own file later)
function ProductCard({ product }: { product: Product }) {
  const imageUrl = product.image_urls && product.image_urls.length > 0
    ? product.image_urls[0]
    : '/placeholder-image.png'; // Provide a fallback placeholder

  const discount: DiscountDetails = calculateDiscountedPrice(product.price_per_unit, product.expires_at);

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out flex flex-col">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative w-full h-48 sm:h-56">
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            style={{ objectFit: 'cover' }} // Ensures image covers the area
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={false} // Set to true for critical above-the-fold images
          />
          {discount.hasDiscount && discount.message && (
            <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
              {discount.message}
            </div>
          )}
        </div>
      </Link>
      <div className="p-4 sm:p-6 flex-grow flex flex-col">
        <h3 className="text-lg sm:text-xl font-semibold text-green-700 mb-2">
          <Link href={`/products/${product.id}`} className="hover:underline">
            {product.title}
          </Link>
        </h3>

        <div className="flex items-center text-sm text-gray-500 mb-1">
          <Tag className="w-4 h-4 mr-2 text-green-600" />
          <span>{product.crop_type}</span>
        </div>

        {discount.hasDiscount ? (
          <div className="mb-2">
            <p className="text-xl font-bold text-red-600">
              {new Intl.NumberFormat('en-KE', { style: 'currency', currency: product.currency || 'KES' }).format(discount.discountedPrice)}
              <span className="text-sm font-normal text-gray-500 ml-2">({Math.round(discount.discountPercentage * 100)}% off)</span>
            </p>
            <p className="text-sm text-gray-500 line-through">
              Original: {new Intl.NumberFormat('en-KE', { style: 'currency', currency: product.currency || 'KES' }).format(discount.originalPrice)}
            </p>
          </div>
        ) : (
          <p className="text-2xl font-bold text-gray-800 mb-2">
            {new Intl.NumberFormat('en-KE', { style: 'currency', currency: product.currency || 'KES' }).format(product.price_per_unit)}
            <span className="text-sm font-normal text-gray-500">/{product.quantity_unit}</span>
          </p>
        )}

        <p className="text-sm text-gray-600 mb-3 flex-grow">
          Available: {product.quantity} {product.quantity_unit}{product.quantity === 1 ? '' : 's'}
        </p>

        <div className="text-xs text-gray-500 space-y-1 mb-4">
            <div className="flex items-center">
                <MapPin className="w-3 h-3 mr-1.5 text-green-600 flex-shrink-0" />
                <span>{product.location_text}</span>
            </div>
            <div className="flex items-center">
                <CalendarDays className="w-3 h-3 mr-1.5 text-green-600 flex-shrink-0" />
                <span>Expires: {formatDistanceToNow(parseISO(product.expires_at), { addSuffix: true })}</span>
            </div>
        </div>

        {product.profiles && (
          <div className="flex items-center text-xs text-gray-500 pt-3 border-t border-gray-200 mt-auto">
            <Link href={`/profile/${product.farmer_id}`} className="flex items-center hover:underline">
              <Image
                src={product.profiles.avatar_url || '/default-avatar.png'} // Fallback avatar
                alt={product.profiles.full_name || product.profiles.username || 'Farmer'}
                width={24}
                height={24}
                className="rounded-full mr-2"
              />
              <span>{product.profiles.full_name || product.profiles.username || 'Farmer'}</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function HomePage({ 
  searchParams: receivedSearchParams // Renamed prop for clarity before awaiting
}: { 
  searchParams: { [key: string]: string | string[] | undefined }; // Type of the prop itself
}) {
  // As per Next.js docs, await the searchParams prop in Server Components
  const searchParams = await receivedSearchParams;

  const searchParamValue = searchParams.search;
  const searchTerm = typeof searchParamValue === 'string' ? searchParamValue : undefined;

  const sortByParamValue = searchParams.sortBy;
  const sortBy = typeof sortByParamValue === 'string' ? sortByParamValue : undefined;

  const products = await getProducts(searchTerm, sortBy);

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-center text-green-800 mb-6 sm:mb-10">
        Fresh Produce Marketplace
      </h1>

      <SearchAndSortControls />

      {products.length === 0 && (
        <p className="text-center text-gray-600 text-lg mt-6">
          {searchTerm ? `No products found matching "${searchTerm}".` : "No products currently available. Check back soon!"}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 mt-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}