import type { ReactNode } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { AuthGuard } from "@/components/dashboard/auth-guard";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen text-foreground flex flex-col antialiased">
        <DashboardHeader />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-1 sm:pt-2 pb-12">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
