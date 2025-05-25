"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }).optional(),
  role: z.enum(["farmer", "buyer"], { required_error: "You must select a role." }),
  buyerType: z.enum(["individual", "vendor", "restaurant"]).optional(),
  typicalCropsGrownCsv: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don\'t match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === 'buyer' && !data.buyerType) {
    return false;
  }
  return true;
}, {
  message: "Please select your buyer type.",
  path: ["buyerType"],
});

// Define a type for the data passed in supabase.auth.signUp options
interface SignUpOptionsData {
  username: string;
  full_name?: string | null; // Match optional nature and potential null from form
  role: "farmer" | "buyer";
  buyer_type?: "individual" | "vendor" | "restaurant" | null;
  typical_crops_grown_csv?: string | null;
}

export function SignUpForm() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      username: "",
      fullName: "",
      role: "buyer",
      buyerType: undefined,
      typicalCropsGrownCsv: "",
    },
  });

  const currentRole = useWatch({ control: form.control, name: "role" });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setError(null);
    try {
      const optionsData: SignUpOptionsData = {
        username: values.username,
        full_name: values.fullName || null, // Ensure null if empty optional string
        role: values.role,
      };

      if (values.role === 'buyer' && values.buyerType) {
        optionsData.buyer_type = values.buyerType;
      } else if (values.role === 'buyer') {
        optionsData.buyer_type = null; // Explicitly null if buyer and no type selected
      }

      if (values.role === 'farmer' && values.typicalCropsGrownCsv) {
        optionsData.typical_crops_grown_csv = values.typicalCropsGrownCsv;
      } else if (values.role === 'farmer') {
        optionsData.typical_crops_grown_csv = null; // Explicitly null if farmer and no CSV
      }

      // Remove null/undefined properties to keep options clean if Supabase prefers that
      Object.keys(optionsData).forEach(key => {
        const k = key as keyof SignUpOptionsData;
        if (optionsData[k] === undefined || optionsData[k] === '') { // also check for empty string for optional text fields
          delete optionsData[k];
        }
      });

      const { error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: optionsData,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        alert("Signup successful! Please check your email to confirm your account.");
        router.push("/login");
      }
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unexpected error occurred during sign up.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="your_unique_username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute inset-y-0 right-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute inset-y-0 right-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>I am a...</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="buyer">Buyer (Looking for produce)</SelectItem>
                  <SelectItem value="farmer">Farmer (Selling produce)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {currentRole === 'buyer' && (
          <FormField
            control={form.control}
            name="buyerType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type of Buyer</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select buyer type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="vendor">Vendor/Reseller</SelectItem>
                    <SelectItem value="restaurant">Restaurant/Cafe</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {currentRole === 'farmer' && (
          <FormField
            control={form.control}
            name="typicalCropsGrownCsv"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Typical Crops Grown (comma-separated)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Tomatoes, Maize, Beans" {...field} />
                </FormControl>
                <FormDescription>
                  List the crops you usually grow, separated by commas.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        
        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
          {loading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>
    </Form>
  );
} 