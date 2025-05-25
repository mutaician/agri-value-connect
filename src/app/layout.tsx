import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { DisplayMessage } from "@/components/layout/DisplayMessage";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";
import { Toaster as Sonner } from "@/components/ui/sonner"
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "AgriValue Connect",
  description: "Connecting Farmers and Buyers for Perishable Goods",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <Suspense fallback={null}>
            <DisplayMessage />
          </Suspense>
          <main className="pt-14">
            {children}
          </main>
          <Sonner />
        </ThemeProvider>
      </body>
    </html>
  );
}
