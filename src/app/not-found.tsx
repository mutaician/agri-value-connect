'use client';

import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import Link from "next/link";

function NotFoundContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-6xl font-bold text-gray-800 dark:text-gray-100">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mt-4">Page Not Found</h2>
      <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8">
        <Button asChild>
          <Link href="/">
            Return Home
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <h1 className="text-6xl font-bold text-gray-800 dark:text-gray-100">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mt-4">Page Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Loading...</p>
      </div>
    }>
      <NotFoundContent />
    </Suspense>
  );
}
