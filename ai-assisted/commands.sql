-- SCHEMA DEFINITION

-- Create the 'profiles' table
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  username text UNIQUE NOT NULL,
  full_name text NULL,
  avatar_url text NULL,
  role text NOT NULL DEFAULT 'buyer'::text CHECK (role IN ('farmer', 'buyer')),
  location_text text NULL,
  contact_info jsonb NULL,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Optional: Comment on the table and columns for clarity
COMMENT ON TABLE public.profiles IS 'Stores public user profile information, extending auth.users.';
COMMENT ON COLUMN public.profiles.id IS 'References the user ID from auth.users table.';
COMMENT ON COLUMN public.profiles.role IS 'User role, e.g., farmer or buyer.';

-- Enable Row Level Security (RLS) for the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add new columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN buyer_type text NULL CHECK (buyer_type IN ('individual', 'vendor', 'restaurant'));
COMMENT ON COLUMN public.profiles.buyer_type IS 'Type of buyer, e.g., individual, vendor, restaurant. Applicable if role is buyer.';

ALTER TABLE public.profiles
ADD COLUMN typical_crops_grown text[] NULL;
COMMENT ON COLUMN public.profiles.typical_crops_grown IS 'Array of typical crops grown by the farmer. Applicable if role is farmer.';

ALTER TABLE public.profiles
ADD COLUMN bio TEXT NULL;
COMMENT ON COLUMN public.profiles.bio IS 'A short description or biography for the user profile.';

-- Create the 'products' table
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NULL,
  crop_type text NOT NULL,
  quantity numeric NOT NULL,
  quantity_unit text NOT NULL,
  price_per_unit numeric NOT NULL,
  currency text NOT NULL DEFAULT 'KES'::text,
  image_urls text[] NULL,
  location_text text NULL,
  available_from date NULL,
  expires_at date NULL,
  status text NOT NULL DEFAULT 'available'::text CHECK (status IN ('available', 'sold', 'expired', 'delisted')),
  current_discount numeric NULL DEFAULT 0,
  discount_logic_meta jsonb NULL,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT price_positive CHECK (price_per_unit >= 0),
  CONSTRAINT quantity_positive CHECK (quantity > 0)
);

-- Optional: Comment on the table and columns
COMMENT ON TABLE public.products IS 'Stores product listings created by farmers.';
COMMENT ON COLUMN public.products.farmer_id IS 'References the farmer''s ID from the profiles table.';
COMMENT ON COLUMN public.products.image_urls IS 'Array of URLs for product images in Supabase Storage.';
COMMENT ON COLUMN public.products.expires_at IS 'Date when the product is likely to perish or listing expires.';
COMMENT ON COLUMN public.products.status IS 'Lifecycle status of the product listing.';

-- Enable Row Level Security (RLS) for the products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create the 'chats' table
CREATE TABLE public.chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  product_id uuid NULL REFERENCES public.products(id) ON DELETE SET NULL,
  participant_one_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE NO ACTION,
  participant_two_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE NO ACTION,
  last_message_preview text NULL,
  CONSTRAINT chats_pkey PRIMARY KEY (id),
  CONSTRAINT participants_different CHECK (participant_one_id <> participant_two_id)
);

-- Add unique constraint for chat participants and product
ALTER TABLE public.chats
ADD CONSTRAINT unique_chat_participants_product
UNIQUE (product_id, participant_one_id, participant_two_id);

-- Optional: Comment on the table and columns
COMMENT ON TABLE public.chats IS 'Stores conversation threads between users.';
COMMENT ON COLUMN public.chats.product_id IS 'Optional link to a product the chat is about.';
COMMENT ON COLUMN public.chats.updated_at IS 'Timestamp of the last activity or message in the chat.';
COMMENT ON COLUMN public.chats.participant_one_id IS 'ID of the first participant in the chat.';
COMMENT ON COLUMN public.chats.participant_two_id IS 'ID of the second participant in the chat.';

-- Enable Row Level Security (RLS) for the chats table
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Create the 'messages' table
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  media_url text NULL,
  read_at timestamp with time zone NULL,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT content_not_empty CHECK (char_length(content) > 0 OR media_url IS NOT NULL) -- Ensure message has content or media
);

-- Optional: Comment on the table and columns
COMMENT ON TABLE public.messages IS 'Stores individual messages within a chat.';
COMMENT ON COLUMN public.messages.chat_id IS 'References the chat this message belongs to.';
COMMENT ON COLUMN public.messages.sender_id IS 'References the profile of the user who sent the message.';
COMMENT ON COLUMN public.messages.media_url IS 'Optional URL for media attached to the message.';
COMMENT ON COLUMN public.messages.read_at IS 'Timestamp when the message was read by the recipient(s).';

-- Enable Row Level Security (RLS) for the messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- FUNCTIONS AND TRIGGERS

-- Function to create a new profile entry for a new auth.users record
-- This is the updated version of the function, including buyer_type and typical_crops_grown
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    avatar_url,
    role,
    buyer_type,          -- New field
    typical_crops_grown  -- New field
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer')::text,
    CASE -- Only set buyer_type if role is 'buyer'
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'buyer')::text = 'buyer'
      THEN NEW.raw_user_meta_data->>'buyer_type'
      ELSE NULL
    END,
    CASE -- Only set typical_crops_grown if role is 'farmer'
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'buyer')::text = 'farmer'
      THEN string_to_array(NEW.raw_user_meta_data->>'typical_crops_grown_csv', ',')::text[] -- Expecting CSV string from metadata
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to call the function after a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Profiles Table RLS Policies
CREATE POLICY "Allow public read access to profiles"
ON public.profiles
FOR SELECT
USING (true);

CREATE POLICY "Allow users to insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);

-- Products Table RLS Policies
CREATE POLICY "Allow public read access to available products"
ON public.products
FOR SELECT
USING (status = 'available'::text);

-- New policy to allow farmers to view all their own products (even if not 'available')
CREATE POLICY "Allow farmers to view all their own products"
ON public.products
FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'farmer'::text
  ) AND
  auth.uid() = farmer_id
);

CREATE POLICY "Allow farmers to insert their own products"
ON public.products
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'farmer'::text
  ) AND
  auth.uid() = farmer_id
);

CREATE POLICY "Allow farmers to update their own products"
ON public.products
FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'farmer'::text
  ) AND
  auth.uid() = farmer_id
)
WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "Allow farmers to delete their own products"
ON public.products
FOR DELETE
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'farmer'::text
  ) AND
  auth.uid() = farmer_id
);

-- Chats Table RLS Policies
CREATE POLICY "Allow participants to view their own chats"
ON public.chats
FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  (auth.uid() = participant_one_id OR auth.uid() = participant_two_id)
);

CREATE POLICY "Allow authenticated users to insert chats they participate in"
ON public.chats
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  (auth.uid() = participant_one_id OR auth.uid() = participant_two_id)
);

CREATE POLICY "Allow participants to update their own chats"
ON public.chats
FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  (auth.uid() = participant_one_id OR auth.uid() = participant_two_id)
)
WITH CHECK (
  auth.role() = 'authenticated' AND
  (auth.uid() = participant_one_id OR auth.uid() = participant_two_id)
);

CREATE POLICY "Allow participants to delete their own chats"
ON public.chats
FOR DELETE
USING (
  auth.role() = 'authenticated' AND
  (auth.uid() = participant_one_id OR auth.uid() = participant_two_id)
);

-- Messages Table RLS Policies
CREATE POLICY "Allow chat participants to view messages"
ON public.messages
FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1
    FROM public.chats
    WHERE id = messages.chat_id AND (auth.uid() = chats.participant_one_id OR auth.uid() = chats.participant_two_id)
  )
);

CREATE POLICY "Allow participants to insert messages as themselves"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1
    FROM public.chats
    WHERE id = messages.chat_id AND (auth.uid() = chats.participant_one_id OR auth.uid() = chats.participant_two_id)
  )
);

CREATE POLICY "Allow senders to update their own messages"
ON public.messages
FOR UPDATE
USING (auth.role() = 'authenticated' AND auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Allow senders to delete their own messages"
ON public.messages
FOR DELETE
USING (auth.role() = 'authenticated' AND auth.uid() = sender_id);


-- STORAGE POLICIES for 'product-images' bucket

CREATE POLICY "Allow public read access to product images"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Allow farmers to upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'farmer'::text
  )
);

-- The ALTER POLICY for upload is applied after the CREATE POLICY for the same
-- because the original input contains both.
ALTER POLICY "Allow farmers to upload product images"
ON storage.objects
WITH CHECK (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated' AND
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid() AND role = 'farmer'::text
    ) AND
    (storage.foldername(name))[1] = (select auth.uid()::text)
);

CREATE POLICY "Allow farmers to update their own product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated' AND
  owner = auth.uid() AND
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'farmer'::text
  )
)
WITH CHECK (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated' AND
  owner = auth.uid() AND
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'farmer'::text
  )
);

CREATE POLICY "Allow farmers to delete their own product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated' AND
  owner = auth.uid() AND
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'farmer'::text
  )
);