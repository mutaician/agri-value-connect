"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/app/actions/productActions"; // Server Action
import { toast } from "sonner";

interface DeleteProductButtonProps {
  productId: string;
  productTitle: string;
}

export function DeleteProductButton({ productId, productTitle }: DeleteProductButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (result.success) {
        toast.success(result.message || "Product delisted successfully!");
        setIsOpen(false); // Close dialog on success
      } else {
        toast.error(result.message || "Failed to delist product.");
      }
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="w-full sm:w-auto flex items-center justify-center">
          <Trash2 className="w-4 h-4 mr-2" /> Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delist this product?</AlertDialogTitle>
          <AlertDialogDescription>
            Product: <strong>{productTitle}</strong>
            <br />
            This action will mark the product as 'delisted' and remove it from public view. Associated images will also be deleted. This action cannot be easily undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
            {isPending ? "Delisting..." : "Yes, Delist Product"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 