"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { CalendarIcon, UploadCloud } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/app/page";
import Image from "next/image";

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// Zod schema for validation
const productFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }).optional().or(z.literal('')),
  crop_type: z.string().min(2, { message: "Crop type must be specified." }),
  quantity: z.coerce.number().positive({ message: "Quantity must be a positive number." }),
  quantity_unit: z.enum(["kg", "tonne", "crate", "bunch", "piece", "sack", "tray", "head"], {
    required_error: "Quantity unit is required."
  }),
  price_per_unit: z.coerce.number().positive({ message: "Price must be a positive number." }),
  currency: z.string(),
  product_image: z
    .instanceof(File)
    .optional()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE_BYTES, `Max image size is ${MAX_FILE_SIZE_MB}MB.`)
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
  location_text: z.string().min(3, { message: "Location must be specified." }),
  available_from: z.date({ required_error: "Available from date is required." }),
  expires_at: z.date({ required_error: "Expiry date is required." }),
  status: z.enum(["available", "sold", "expired"]).optional(),
}).refine((data) => !data.expires_at || !data.available_from || data.expires_at > data.available_from, {
  message: "Expiry date must be after the available from date.",
  path: ["expires_at"],
})
.refine((data) => {
  if (data.status === "available" && data.expires_at) {
    const expiryDate = new Date(data.expires_at);
    expiryDate.setHours(0,0,0,0); // Normalize to start of day for comparison
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    return expiryDate >= today;
  }
  return true;
}, {
  message: "If status is 'available', the expiry date must be today or a future date.",
  path: ["expires_at"], 
});

interface CreateProductFormProps {
  userId: string;
  productToEdit?: Product | null;
  isEditMode?: boolean;
}

type ProductFormValues = z.infer<typeof productFormSchema>;

export function CreateProductForm({ userId, productToEdit, isEditMode = false }: CreateProductFormProps) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: "",
      description: "",
      crop_type: "",
      quantity: 0,
      quantity_unit: "kg",
      price_per_unit: 0,
      currency: "KES",
      product_image: undefined,
      location_text: "",
      available_from: new Date(),
      expires_at: new Date(new Date().setDate(new Date().getDate() + 7)),
      status: "available",
    },
  });

  useEffect(() => {
    if (isEditMode && productToEdit) {
      // Correctly access the base ZodObject's shape after multiple .refine calls
      // @ts-ignore // Accessing internal Zod properties
      const quantityUnitEnumSchema = productFormSchema._def.schema._def.schema.shape.quantity_unit;
      const validQuantityUnits = quantityUnitEnumSchema._def.values as string[];
      
      const incomingQuantityUnit = productToEdit.quantity_unit?.toLowerCase();
      const editQuantityUnit = incomingQuantityUnit && validQuantityUnits.includes(incomingQuantityUnit) 
        ? incomingQuantityUnit as ProductFormValues['quantity_unit'] 
        : 'kg';

      const validStatuses = ["available", "sold", "expired"];
      const incomingStatus = productToEdit.status?.toLowerCase();
      const currentStatus = incomingStatus && validStatuses.includes(incomingStatus)
        ? incomingStatus as ProductFormValues['status']
        : 'available';

      form.reset({
        title: productToEdit.title || "",
        description: productToEdit.description || "",
        crop_type: productToEdit.crop_type || "",
        quantity: productToEdit.quantity || 0,
        quantity_unit: editQuantityUnit,
        price_per_unit: productToEdit.price_per_unit || 0,
        currency: productToEdit.currency || "KES",
        product_image: undefined,
        location_text: productToEdit.location_text || "",
        available_from: productToEdit.available_from ? parseISO(productToEdit.available_from) : new Date(),
        expires_at: productToEdit.expires_at ? parseISO(productToEdit.expires_at) : new Date(new Date().setDate(new Date().getDate() + 7)),
        status: currentStatus,
      });

      if (productToEdit.image_urls && productToEdit.image_urls.length > 0) {
        setCurrentImageUrl(productToEdit.image_urls[0]);
        setFileName(productToEdit.image_urls[0].split('/').pop() || "Current image");
      }
    } else {
      form.reset({
        title: "",
        description: "",
        crop_type: "",
        quantity: 0,
        quantity_unit: "kg",
        price_per_unit: 0,
        currency: "KES",
        product_image: undefined,
        location_text: "",
        available_from: new Date(),
        expires_at: new Date(new Date().setDate(new Date().getDate() + 7)),
        status: "available",
      });
      setCurrentImageUrl(null);
      setFileName(null);
    }
  }, [isEditMode, productToEdit, form.reset]);

  const onSubmit: SubmitHandler<ProductFormValues> = async (values) => {
    setLoading(true);
    setError(null);

    if (!isEditMode && !values.product_image) {
      setError("Product image is required when creating a new listing.");
      setLoading(false);
      return;
    }

    try {
      // Get current user directly in the submit handler for definitive ID
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setError("User session not found. Please log in again.");
        setLoading(false);
        return;
      }
      const currentAuthUid = currentUser.id;

      let imageUrl = currentImageUrl; 
      let uploadedFileName: string | null = null;

      if (values.product_image) {
        const file = values.product_image;
        const fileExtension = file.name.split('.').pop();
        // Ensure uploadedFileName uses the definitive currentAuthUid
        uploadedFileName = `${currentAuthUid}/${Date.now()}.${fileExtension}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(uploadedFileName, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error("Supabase storage upload error:", uploadError);
          setError(`Image upload failed: ${uploadError.message}`);
          setLoading(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(uploadedFileName);

        if (!publicUrlData || !publicUrlData.publicUrl) {
          setError("Failed to get public URL for the new image.");
          setLoading(false);
          return;
        }
        imageUrl = publicUrlData.publicUrl;

        if (isEditMode && productToEdit && productToEdit.image_urls && productToEdit.image_urls.length > 0) {
          const oldImageFileName = productToEdit.image_urls[0].split('product-images/').pop();
          if (oldImageFileName) {
            await supabase.storage.from("product-images").remove([oldImageFileName]);
          }
        }
      } else if (!isEditMode) {
        setError("Product image is required for new listings.");
        setLoading(false);
        return;
      }

      const productData = {
        // Ensure productData uses the definitive currentAuthUid if it's a new product, 
        // or sticks to productToEdit.farmer_id if truly only non-farmer_id fields can change for an existing product.
        // However, RLS WITH CHECK (auth.uid() = farmer_id) implies farmer_id in the *updated row* must be auth.uid().
        // So, sending currentAuthUid as farmer_id is correct for the RLS check.
        farmer_id: currentAuthUid, // Use the definitive current user ID
        title: values.title,
        description: values.description,
        crop_type: values.crop_type,
        quantity: values.quantity,
        quantity_unit: values.quantity_unit,
        price_per_unit: values.price_per_unit,
        currency: values.currency,
        image_urls: imageUrl ? [imageUrl] : [],
        location_text: values.location_text,
        available_from: values.available_from.toISOString(),
        expires_at: values.expires_at.toISOString(),
        status: values.status || "available",
      };

      if (isEditMode && productToEdit) {
        console.log("Attempting to update product ID:", productToEdit.id);
        console.log("Product data for update:", JSON.stringify(productData, null, 2));
        console.log("Current auth UID from submit handler:", currentAuthUid);
        console.log("Original farmer_id from productToEdit:", productToEdit.farmer_id);

        const { error: updateError } = await supabase
          .from("products")
          .update(productData)
          .eq("id", productToEdit.id);
          // RLS policy for UPDATE: USING (auth.uid() = farmer_id) WITH CHECK (auth.uid() = farmer_id)

        if (updateError) {
          console.error("Supabase update error:", updateError);
          setError(`Failed to update product: ${updateError.message} (Code: ${updateError.code})`);
        } else {
          alert("Product updated successfully!");
          router.push("/my-listings");
          router.refresh();
        }
      } else {
        // Insert new product (farmer_id is already set to currentAuthUid in productData)
        const { error: insertError } = await supabase.from("products").insert([productData]);

        if (insertError) {
          console.error("Supabase insert error:", insertError);
          setError(`Failed to create product: ${insertError.message} (Code: ${insertError.code})`);
          if (uploadedFileName) {
            await supabase.storage.from("product-images").remove([uploadedFileName]);
          }
        } else {
          alert("Product listed successfully!");
          router.push("/my-listings");
          router.refresh();
        }
      }
    } catch (e: any) {
      console.error("Form submission error:", e);
      setError("An unexpected error occurred: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      {isEditMode && currentImageUrl && (
        <div className="mb-4">
          <FormLabel>Current Image</FormLabel>
          <div className="mt-2 relative w-full max-w-xs h-48 rounded-md overflow-hidden border">
            <Image src={currentImageUrl} alt="Current product image" fill style={{ objectFit: 'cover' }} />
          </div>
        </div>
      )}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Fresh Red Tomatoes" {...field} />
              </FormControl>
              <FormDescription>
                A catchy and descriptive title for your produce.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide more details about your produce, e.g., farming practices, variety, quality."
                  className="resize-y min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="crop_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Crop Type</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Tomato, Maize, Sukuma Wiki" {...field} />
              </FormControl>
               <FormDescription>
                Specify the type of crop (e.g., Tomato, Kale, Mango).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity Available</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 100" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="quantity_unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity Unit</FormLabel>
                <Select key={field.value} onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="kg">Kilogram (kg)</SelectItem>
                    <SelectItem value="tonne">Tonne (t)</SelectItem>
                    <SelectItem value="crate">Crate</SelectItem>
                    <SelectItem value="bunch">Bunch</SelectItem>
                    <SelectItem value="piece">Piece</SelectItem>
                    <SelectItem value="sack">Sack</SelectItem>
                    <SelectItem value="tray">Tray</SelectItem>
                    <SelectItem value="head">Head</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="price_per_unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price per Unit (in KES)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 50" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
            control={form.control}
            name="currency"
            render={({ field }) => <Input type="hidden" {...field} />}
        />

        <FormField
          control={form.control}
          name="product_image"
          render={({ field: { onChange, value, ...rest } }) => (
            <FormItem>
              <FormLabel>{isEditMode ? "Change Product Image (Optional)" : "Product Image"}</FormLabel>
              <FormControl>
                <label
                  htmlFor="product_image_upload"
                  className={cn(
                    "flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-md cursor-pointer",
                    "border-gray-300 hover:border-green-500 dark:border-gray-600 dark:hover:border-green-500",
                    "bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors",
                    form.formState.errors.product_image && "border-red-500"
                  )}
                >
                  <input
                    id="product_image_upload"
                    type="file"
                    className="hidden"
                    accept={ACCEPTED_IMAGE_TYPES.join(",")}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onChange(file);
                        setFileName(file.name);
                        if (isEditMode) setCurrentImageUrl(null);
                      } else {
                        onChange(undefined);
                        setFileName(null);
                      }
                    }}
                    {...rest}
                  />
                  <div className="text-center">
                    <UploadCloud className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    {fileName ? (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Selected: <span className="font-semibold">{fileName}</span>
                      </p>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Max file size: {MAX_FILE_SIZE_MB}MB. Types: JPG, PNG, WEBP
                        </p>
                      </>
                    )}
                  </div>
                </label>
              </FormControl>
              <FormDescription>
                {isEditMode ? "Upload a new image if you want to replace the current one." : "High-quality images attract more buyers."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location_text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Nakuru Town, Bahati Sub-county" {...field} />
              </FormControl>
              <FormDescription>
                Where is the produce located?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="available_from"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Available From</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="expires_at"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Expires At</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0,0,0,0)) ||
                        (form.getValues("available_from") && date < form.getValues("available_from"))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {isEditMode && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Status</FormLabel>
                <Select key={field.value} onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Update the status of your product listing.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {error && (
          <p className="text-sm font-medium text-destructive bg-red-100 p-3 rounded-md">
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? (isEditMode ? "Updating..." : "Listing...") : (isEditMode ? "Update Product" : "List Product")}
        </Button>
      </form>
    </Form>
  );
} 