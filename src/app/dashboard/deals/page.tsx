"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetDealsQuery } from "@/store/api/dealsApi";
import type { Deal } from "@/store/types";

export default function DealsPage() {
  const { data: deals = [], isLoading } = useGetDealsQuery();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  const categories = ["All", "Electronics", "Fashion", "Groceries", "Food & Dining", "Travel"];

  const filteredDeals = deals.filter((deal) => {
    if (selectedCategory === "All") return true;
    return deal.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  const fmt = (n: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header Row (Matching Coterie Styling & Outfit Font) */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="font-display font-normal text-[26px] sm:text-[32px] lg:text-[38px] tracking-[-0.02em] text-foreground leading-tight mb-1.5">
            Smart Deals & Savings
          </h1>
          <p className="text-xs sm:text-sm font-medium text-foreground-muted">
            AI-verified live deals, coupon discounts, and smart purchase check verdicts.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
                  active
                    ? "bg-[#0E1F16] text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-xs"
                    : "border border-border bg-surface text-foreground-sub hover:text-foreground hover:bg-surface-muted"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Deals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-6 rounded-[28px] bg-surface/90 border border-border/80 card-shadow space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-1/3" />
            </div>
          ))}
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="rounded-[28px] bg-surface/90 border border-border/80 card-shadow p-12 text-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto text-2xl font-bold">
            🏷️
          </div>
          <h3 className="font-display font-medium text-lg text-foreground">
            No Deals in this Category
          </h3>
          <p className="text-xs text-foreground-muted max-w-sm mx-auto">
            Switch to All or check back shortly as our automated web scanners refresh discounts every 15 minutes.
          </p>
          <button
            type="button"
            onClick={() => setSelectedCategory("All")}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary text-white px-5 py-2 text-xs font-bold shadow-xs hover:bg-primary-strong transition"
          >
            Show All Deals
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeals.map((deal) => {
            const isSafe = deal.purchaseCheck?.status !== "WAIT";

            return (
              <div
                key={deal.id}
                className="p-6 rounded-[28px] bg-surface/90 border border-border/80 card-shadow hover:border-primary/40 transition flex flex-col justify-between gap-5 group"
              >
                <div className="space-y-3">
                  {/* Platform & AI Verdict */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-surface-muted border border-border px-3 py-1 text-[11px] font-bold text-foreground">
                      {deal.platform}
                    </span>

                    {/* AI Purchase Verdict Badge */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        isSafe
                          ? "bg-emerald-500/15 text-[#059669] dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      <span>{isSafe ? "✓ SAFE TO BUY" : "⏳ WAIT"}</span>
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-medium text-base sm:text-lg text-foreground leading-snug group-hover:text-primary transition line-clamp-2">
                    {deal.title}
                  </h3>

                  {/* Pricing Row */}
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-display font-semibold text-2xl text-foreground">
                      {fmt(deal.finalPrice || deal.currentPrice)}
                    </span>
                    {deal.originalPrice > deal.currentPrice && (
                      <span className="text-xs text-foreground-muted line-through font-mono">
                        {fmt(deal.originalPrice)}
                      </span>
                    )}
                    {deal.discountPercent > 0 && (
                      <span className="text-xs font-bold text-[#059669] dark:text-emerald-400">
                        {deal.discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* Reason Verdict */}
                  {deal.purchaseCheck?.reason && (
                    <p className="text-[11px] text-foreground-muted italic line-clamp-2">
                      &ldquo;{deal.purchaseCheck.reason}&rdquo;
                    </p>
                  )}
                </div>

                {/* Bottom Actions: Coupon & Grab Deal */}
                <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                  {deal.couponCode ? (
                    <button
                      type="button"
                      onClick={() => handleCopyCoupon(deal.couponCode!)}
                      className="rounded-full px-3 py-1.5 text-xs font-mono font-bold bg-surface-muted hover:bg-border transition text-foreground flex items-center gap-1"
                    >
                      <span>✂️</span>
                      <span>{copiedCoupon === deal.couponCode ? "Copied!" : deal.couponCode}</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-foreground-muted">No coupon required</span>
                  )}

                  {deal.dealUrl ? (
                    <a
                      href={deal.dealUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full px-4 py-1.5 text-xs font-bold bg-primary hover:bg-primary-strong text-white transition shadow-xs inline-flex items-center gap-1"
                    >
                      <span>Grab Deal</span>
                      <span>↗</span>
                    </a>
                  ) : (
                    <span className="rounded-full px-4 py-1.5 text-xs font-bold bg-[#0E1F16] text-white">
                      Verified
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
