"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DealDetailDrawer } from "@/components/deals/deal-detail";
import { resolveDealProductImage } from "@/lib/deal-images";
import {
  CATEGORY_DEAL_SEARCH,
  DEAL_CATEGORIES,
  DEAL_SUGGESTIONS,
  DEFAULT_DEAL_QUERY,
  mapSearchResponseToDeals,
  type DealCategory,
} from "@/lib/deal-search";
import { useRecordDealClickMutation, useSearchDealsQuery } from "@/store/api/dealsApi";
import type { Deal } from "@/store/types";

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

/** Used if a product image fails to load (same fallback the app uses). */
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80";

/**
 * Real marketplace deals from `GET /deals/search` (the backend's deal provider), like the app's
 * Deals tab — not the legacy `GET /deals` rows. "Grab deal" goes through the click endpoint,
 * which returns the working affiliate link.
 */
export default function DealsPage() {
  const [input, setInput] = useState(DEFAULT_DEAL_QUERY);
  const [query, setQuery] = useState(DEFAULT_DEAL_QUERY);
  const [category, setCategory] = useState<DealCategory | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [selected, setSelected] = useState<Deal | null>(null);

  const { data, isFetching, isError, refetch } = useSearchDealsQuery(query);
  const deals = useMemo(() => (data ? mapSearchResponseToDeals(data, query) : []), [data, query]);
  const [recordDealClick] = useRecordDealClickMutation();

  const search = (q: string, cat: DealCategory | null = null) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setInput(cat ? "" : trimmed);
    setCategory(cat);
    setQuery(trimmed);
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    search(input);
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  // Open the store's own product page (dealUrl is already unpacked from the affiliate wrapper)
  // and record the click in the background. The Cuelinks redirect the click endpoint returns
  // currently lands on cuelinks.com/broken-links for every store (channel not recognised), so it
  // isn't used until that account is fixed.
  const openDeal = (deal: Deal) => {
    const url = deal.dealUrl || deal.sourceUrl;
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
    if (deal.sourceEngine === "provider") recordDealClick(deal.id).catch(() => {});
  };

  const platforms = [...new Set(deals.map((d) => d.platform))].slice(0, 3);
  const unavailable = data && data.status !== "success";
  const label = category ?? `“${query}”`;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <header className="flex flex-col gap-4">
        <div>
          <p className="text-[14px] font-semibold text-foreground-muted">Studio · Deals</p>
          <h1 className="mt-0.5 text-[clamp(1.875rem,2.5vw,2.375rem)] font-extrabold leading-[1.08] tracking-[-0.04em] text-foreground">Smart deals</h1>
          <p className="mt-1.5 text-[16px] font-medium text-foreground-muted">
            Live prices{platforms.length ? ` from ${platforms.join(", ")}` : " from real stores"}, checked by TrackKaro before you buy.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search deals</span>
            <svg className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-foreground-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search a product — e.g. iPhone 16, running shoes, air fryer"
              className="h-11 w-full rounded-[14px] border border-border bg-surface pl-10 pr-3.5 text-[15px] text-foreground shadow-xs outline-none transition placeholder:text-foreground-muted focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_16%,transparent)]"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[14px] bg-[var(--primary)] px-[18px] text-[16px] font-bold text-[var(--on-primary)] shadow-xs transition hover:bg-[var(--primary-strong)]"
          >
            Find deals
          </button>
        </form>

        {/* Categories + quick suggestions (same searches the app runs) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar" role="group" aria-label="Browse">
          {DEAL_CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => search(CATEGORY_DEAL_SEARCH[cat], cat)}
                aria-pressed={active}
                className={`inline-flex h-[34px] shrink-0 items-center rounded-full px-3.5 text-[14px] font-bold transition ${
                  active ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs" : "border border-border bg-surface text-foreground-muted hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            );
          })}
          <span className="mx-1 h-5 w-px shrink-0 bg-[var(--line-2)]" aria-hidden="true" />
          {DEAL_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => search(s)}
              aria-pressed={!category && query === s}
              className={`inline-flex h-[34px] shrink-0 items-center rounded-full px-3 text-[14px] font-semibold transition ${
                !category && query === s ? "bg-[var(--primary-soft)] text-foreground" : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </header>

      {/* Results */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[15px] font-semibold text-foreground-muted">
          {isFetching ? (
            <>Finding live deals for {label}…</>
          ) : (
            <>
              <strong className="font-extrabold text-foreground">{deals.length}</strong> live deal{deals.length === 1 ? "" : "s"} for {label}
            </>
          )}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-border bg-surface px-3 text-[14px] font-bold text-foreground transition hover:bg-surface-muted disabled:opacity-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={isFetching ? "animate-spin" : ""} aria-hidden="true">
            <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" />
          </svg>
          Refresh
        </button>
      </div>

      {isFetching && deals.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="overflow-hidden rounded-[22px] border border-border bg-surface">
              <Skeleton className="h-[220px] rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-7 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : isError || unavailable || deals.length === 0 ? (
        <div className="space-y-3 rounded-[22px] border border-border bg-surface p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[16px] bg-[var(--primary-soft)] text-2xl">🏷️</div>
          <h3 className="text-[17px] font-extrabold text-foreground">{isError ? "Couldn’t reach the deal service" : "No live deals found"}</h3>
          <p className="mx-auto max-w-md text-[15px] text-foreground-muted">
            {isError
              ? "Check your connection and try again."
              : data?.message || "Stores didn’t return a verified offer for this search. Try a more specific product name."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 inline-flex h-11 items-center rounded-[14px] bg-[var(--primary)] px-[18px] text-[16px] font-bold text-[var(--on-primary)] shadow-xs transition hover:bg-[var(--primary-strong)]"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${isFetching ? "opacity-60" : ""}`}>
          {deals.map((deal, i) => (
            <DealCard key={deal.id} deal={deal} index={i} copied={copiedCoupon === deal.couponCode} onCopy={handleCopyCoupon} onOpen={openDeal} onSelect={setSelected} />
          ))}
        </div>
      )}

      <DealDetailDrawer deal={selected} onClose={() => setSelected(null)} onOpenDeal={openDeal} />
    </div>
  );
}

function DealCard({
  deal,
  index,
  copied,
  onCopy,
  onOpen,
  onSelect,
}: {
  deal: Deal;
  index: number;
  copied: boolean;
  onCopy: (code: string) => void;
  onOpen: (deal: Deal) => void;
  onSelect: (deal: Deal) => void;
}) {
  // The store's own product photo when there is one (Amazon/Flipkart CDN), else a matching photo.
  const [src, setSrc] = useState(() => resolveDealProductImage(deal.title, deal.category, deal.imageUrl));
  const [loaded, setLoaded] = useState(false);
  const price = deal.finalPrice || deal.currentPrice;
  const hasLink = Boolean(deal.dealUrl || deal.sourceUrl);

  return (
    <article
      className="tk-pop group flex flex-col overflow-hidden rounded-[22px] border border-border bg-surface shadow-xs transition hover:-translate-y-0.5 hover:border-[var(--line-2)] hover:shadow-[var(--shadow-pop)]"
      style={{ animationDelay: `${Math.min(index, 8) * 0.04}s` }}
    >
      {/* Product image: white stage so store photos (white backgrounds) sit cleanly */}
      <button type="button" onClick={() => onSelect(deal)} className="relative block aspect-[4/3] cursor-pointer overflow-hidden bg-white" aria-label={`Details: ${deal.title}`}>
        {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
        {/* eslint-disable-next-line @next/next/no-img-element -- deal images come from many merchant CDNs */}
        <img
          src={src}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          // Cached images can finish before React attaches onLoad; catch those too.
          ref={(el) => {
            if (el?.complete && el.naturalWidth > 0 && !loaded) setLoaded(true);
          }}
          onLoad={() => setLoaded(true)}
          onError={() => (src === FALLBACK_IMAGE ? setLoaded(true) : setSrc(FALLBACK_IMAGE))}
          className={`h-full w-full object-contain p-4 transition duration-500 group-hover:scale-[1.05] ${loaded ? "opacity-100" : "opacity-0"}`}
        />
        {deal.discountPercent > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--primary)] px-2.5 py-1 text-[13px] font-extrabold text-[var(--on-primary)] shadow-xs">
            {deal.discountPercent}% OFF
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full border border-border bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] px-2.5 py-1 text-[13px] font-bold text-foreground shadow-xs backdrop-blur">
          {deal.platform}
        </span>
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          {deal.purchaseCheck ? (
            <span className={`pill ${deal.purchaseCheck.status === "WAIT" ? "pill--bad" : "pill--good"}`}>
              <i />
              {deal.purchaseCheck.status === "WAIT" ? "Wait for a better price" : "Safe to buy"}
            </span>
          ) : deal.priceVerified ? (
            <span className="pill pill--good">
              <i />
              Verified price
            </span>
          ) : null}
          {deal.rating ? (
            <span className="pill pill--faint">
              <i />★ {deal.rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        <h3 className="text-[16px] font-extrabold leading-snug tracking-[-0.015em] text-foreground">
          <button type="button" onClick={() => onSelect(deal)} className="line-clamp-2 text-left hover:text-[var(--primary)]" title="See details">
            {deal.title}
          </button>
        </h3>

        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className="text-[26px] font-extrabold leading-none tracking-[-0.03em] text-foreground num">{fmt(price)}</span>
          {deal.originalPrice > deal.currentPrice && <span className="text-[15px] font-semibold text-foreground-muted line-through num">{fmt(deal.originalPrice)}</span>}
          {deal.savingsAmount > 0 && <span className="text-[14px] font-bold text-[var(--good)] num">Save {fmt(deal.savingsAmount)}</span>}
        </div>

        {(deal.purchaseCheck?.reason || deal.cashbackText) && (
          <p className="line-clamp-2 text-[14px] leading-relaxed text-foreground-muted">{deal.purchaseCheck?.reason || deal.cashbackText}</p>
        )}

        {/* Coupon + grab */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3.5">
          {deal.couponCode ? (
            <button
              type="button"
              onClick={() => onCopy(deal.couponCode!)}
              title="Copy coupon code"
              className="inline-flex h-9 min-w-0 items-center gap-1.5 rounded-[10px] border border-dashed border-[var(--line-2)] bg-[var(--surface-2)] px-3 text-[13px] font-bold text-foreground transition hover:border-[var(--primary)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {copied ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <path d="M9 9h10v10H9zM5 15V5h10" />}
              </svg>
              <span className="mono truncate">{copied ? "Copied!" : deal.couponCode}</span>
            </button>
          ) : (
            <span className="text-[14px] text-foreground-muted">{deal.deliveryCharge > 0 ? `+ ${fmt(deal.deliveryCharge)} delivery` : "Free delivery"}</span>
          )}

          {hasLink ? (
            <button
              type="button"
              onClick={() => onOpen(deal)}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] bg-[var(--primary)] px-3.5 text-[14px] font-bold text-[var(--on-primary)] shadow-xs transition hover:bg-[var(--primary-strong)]"
            >
              Grab deal
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </button>
          ) : (
            <span className="pill pill--faint">
              <i />
              Link unavailable
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
