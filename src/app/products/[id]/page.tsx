import { createSupabaseServerClient } from "@/lib/supabase/server";
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Product } from '@/app/page'; // Assuming Product interface is in src/app/page.tsx
import { format, parseISO } from 'date-fns';
import { MapPin, CalendarDays, Tag, ShoppingCart, UserCircle } from 'lucide-react';
import { calculateDiscountedPrice, DiscountDetails } from "@/lib/utils"; // Added import
import { ContactFarmerButton } from "@/components/chat/ContactFarmerButton"; // Import the new button

// It might be better to move the Product interface to a dedicated types file (e.g., @/types/index.ts)
// For now, we'll re-use or re-declare if necessary.
// Ensure the Product interface here matches or extends the one in src/app/page.tsx if needed.

async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      profiles (
        username,
        full_name,
        avatar_url,
        role,
        buyer_type 
      )
    `)
    .eq('id', id)
    .eq('status', 'available') // Or handle other statuses as needed
    .single();

  if (error) {
    console.error('Error fetching product by ID:', error);
    // If it's a PostgREST error like "PGRST116" (JSON object requested, multiple (or no) rows returned),
    // it means no product was found or multiple, which .single() should handle by returning null for 0 rows.
    // For other errors, you might want to log them differently or throw.
    return null;
  }

  if (!data) {
    return null;
  }

  return data as Product;
}

export default async function ProductPage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  // Await the Promise to get the actual values
  const resolvedParams = await params;
  
  const supabase = await createSupabaseServerClient(); // Removed cookies() argument
  
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const product = await getProductById(resolvedParams.id);

  if (!product) {
    notFound(); // Triggers the not-found.js page or a default 404
  }

  const discount: DiscountDetails = calculateDiscountedPrice(product.price_per_unit, product.expires_at);

  const imageUrl = product.image_urls && product.image_urls.length > 0
    ? product.image_urls[0]
    : '/placeholder-image.png';

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="relative w-full h-64 sm:h-80 md:h-96">
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            style={{ objectFit: 'cover' }}
            priority // Prioritize loading main product image
          />
        </div>

        <div className="p-6 md:p-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-green-800 mb-4">
            {product.title}
          </h1>

          <div className="mb-6 text-gray-700 text-lg leading-relaxed">
            {product.description || 'No description available.'}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-green-700 mb-3">Product Details</h2>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <Tag className="w-5 h-5 mr-3 text-green-600 flex-shrink-0" />
                  <span><strong>Crop Type:</strong> {product.crop_type}</span>
                </li>
                <li className="flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-3 text-green-600 flex-shrink-0" />
                  <span><strong>Available:</strong> {product.quantity} {product.quantity_unit}{product.quantity !== 1 ? 's' : ''}</span>
                </li>
                {discount.hasDiscount ? (
                  <> 
                    <li className="flex items-baseline">
                      <span className="font-bold text-xl mr-2 text-red-600">KES</span>
                      <span className="text-3xl font-bold text-red-600">
                        {new Intl.NumberFormat('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(discount.discountedPrice)}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">/{product.quantity_unit}</span>
                      <span className="ml-3 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                        {Math.round(discount.discountPercentage * 100)}% OFF
                      </span>
                    </li>
                    <li className="flex items-baseline text-sm text-gray-500">
                      <span className="mr-2">Original:</span>
                      <span className="line-through">
                        KES {new Intl.NumberFormat('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(discount.originalPrice)}
                      </span>
                    </li>
                  </>
                ) : (
                  <li className="flex items-baseline">
                    <span className="font-bold text-xl mr-2 text-green-600">KES</span>
                    <span className="text-3xl font-bold text-gray-800">
                      {new Intl.NumberFormat('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(product.price_per_unit)}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">/{product.quantity_unit}</span>
                  </li>
                )}
                <li className="flex items-center">
                  <MapPin className="w-5 h-5 mr-3 text-green-600 flex-shrink-0" />
                  <span><strong>Location:</strong> {product.location_text}</span>
                </li>
                <li className="flex items-center">
                  <CalendarDays className="w-5 h-5 mr-3 text-green-600 flex-shrink-0" />
                  <span><strong>Available From:</strong> {format(parseISO(product.available_from), 'PPP')}</span>
                </li>
                <li className="flex items-center">
                  <CalendarDays className="w-5 h-5 mr-3 text-red-500 flex-shrink-0" />
                  <span><strong>Expires At:</strong> {format(parseISO(product.expires_at), 'PPP')}</span>
                </li>
              </ul>
            </div>

            {product.profiles && (
              <div>
                <h2 className="text-xl font-semibold text-green-700 mb-3">Farmer Information</h2>
                <div className="flex items-center bg-gray-50 p-4 rounded-lg">
                  <Image
                    src={product.profiles.avatar_url || '/default-avatar.png'}
                    alt={product.profiles.full_name || product.profiles.username || 'Farmer'}
                    width={64}
                    height={64}
                    className="rounded-full mr-4 border-2 border-green-200"
                  />
                  <div>
                    <p className="text-lg font-semibold text-gray-800">
                      {product.profiles.full_name || product.profiles.username || 'N/A'}
                    </p>
                    {product.profiles.username && (
                        <p className="text-sm text-gray-500 flex items-center">
                            <UserCircle className="w-4 h-4 mr-1 text-green-600"/> @{product.profiles.username}
                        </p>
                    )}
                    {/* Could add more farmer details here if available/relevant */}
                  </div>
                </div>
                
                {currentUser && product.farmer_id !== currentUser.id && (
                  <div className="mt-4">
                    <ContactFarmerButton 
                      productId={product.id} 
                      farmerId={product.farmer_id} 
                      currentUserId={currentUser.id} 
                    />
                  </div>
                )}
                {currentUser && product.farmer_id === currentUser.id && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <p className="text-sm text-blue-700">This is your product listing.</p>
                  </div>
                )}
                {!currentUser && (
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-700 mb-2">Want to contact this farmer about their products?</p>
                    <div className="flex justify-center">
                      <a 
                        href={`/login?redirect=/products/${product.id}`}
                        className="inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md text-sm transition-colors"
                      >
                        Log in to chat with the farmer
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Placeholder for Dynamic Discounting - Phase 4 - Replaced by inline logic above */}
          {/* 
          {typeof product.current_discount === 'number' && product.current_discount > 0 && (
            <div className="mt-6 p-4 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800">
              <p><strong>Special Offer!</strong> This product has a discount of {product.current_discount}% applied.</p>
            </div>
          )}
          */}

        </div>
      </div>
    </div>
  );
} 