import type { ReactNode } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { AuthGuard } from "@/components/dashboard/auth-guard";
import { WelcomeTour } from "@/components/dashboard/welcome-tour";
import { OfflineSync } from "@/components/dashboard/offline-sync";
import { DesktopNotifications } from "@/components/dashboard/desktop-notifications";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="relative h-screen text-foreground flex antialiased bg-background overflow-hidden">
        {/* Liquid Glass Sidebar (desktop) - 100% static in place */}
        <DashboardSidebar />

        {/* Main Content Area - scrolls independently while sidebar and header remain static */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-all">
          <DashboardHeader />
          <main className="tk-main flex-1 w-full min-w-0 px-4 sm:px-8 pt-2 pb-4 overflow-y-auto overflow-x-hidden relative z-10">
            {children}
          </main>
        </div>
        <WelcomeTour />
        <OfflineSync />
        <DesktopNotifications />
      </div>
    </AuthGuard>
  );
}
