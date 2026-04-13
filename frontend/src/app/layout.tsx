import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Or standard font import if Inter is not available in default setup (Next 13+ standard)
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/toaster";

// If Inter fails, we will fallback to system fonts via CSS
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Accounting & Inventory",
  description: "Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 ml-64 flex flex-col min-h-0">
            <Header />
            <main className="flex-1 p-8 bg-slate-50 flex flex-col min-h-0 overflow-auto">
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
