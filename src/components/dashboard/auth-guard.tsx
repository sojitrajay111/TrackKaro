"use client";

import { useSyncExternalStore, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store";

const emptySubscribe = () => () => {};

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, accessToken } = useAppSelector((state) => state.auth);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    if (mounted) {
      const storedToken =
        typeof window !== "undefined" ? localStorage.getItem("trackkaro_access_token") : null;
      if (!isAuthenticated && !storedToken && !accessToken) {
        router.push("/auth/login");
      }
    }
  }, [mounted, isAuthenticated, accessToken, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
