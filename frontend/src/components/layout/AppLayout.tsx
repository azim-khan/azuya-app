'use client';

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user || pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 p-8 bg-slate-50 flex flex-col min-h-0 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
