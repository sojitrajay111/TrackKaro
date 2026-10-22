import { filterDealsBySearchQuery } from "@/lib/deal-search-relevance";
import type { Deal, DealSearchResponse } from "@/store/types";

/**
 * Live deal search, mirroring the app (TrackKaro/src/lib/deal-search-cache.ts and
 * components/deals/DealsViewContent.tsx): results come from `GET /deals/search` — real
 * marketplace offers from the configured provider — never the legacy `GET /deals` rows.
 */

/** Same default and category queries the app uses. */
export const DEFAULT_DEAL_QUERY = "wireless earbuds";

export const DEAL_CATEGORIES = ["Electronics", "Fashion", "Home", "Beauty", "Travel", "Food"] as const;
export type DealCategory = (typeof DEAL_CATEGORIES)[number];

export const CATEGORY_DEAL_SEARCH: Record<DealCategory, string> = {
  Electronics: "wireless earbuds bluetooth headphones",
  Fashion: "men formal shirts cotton",
  Home: "home kitchen appliances decor",
  Beauty: "face wash moisturizer skincare",
  Travel: "travel backpack luggage bag",
  Food: "healthy snacks nuts dry fruits",
};

export const DEAL_SUGGESTIONS = ["wireless earbuds", "smartphones", "power bank", "home appliances", "running shoes", "bluetooth headphones"];

/** Provider links are affiliate redirects (linksredirect.com?url=…); show the store's own URL. */
export function unpackDirectDealUrl(rawUrl?: string): string {
  if (!rawUrl) return "";
  if (rawUrl.includes("linksredirect.com")) {
    try {
      const match = rawUrl.match(/[?&]url=([^&]+)/);
      if (match?.[1]) {
        const decoded = decodeURIComponent(match[1]);
        if (decoded.startsWith("http")) return decoded;
      }
    } catch {
      // keep the raw URL
    }
  }
  return rawUrl;
}

export function mapSearchResponseToDeals(result: DealSearchResponse, searchQuery?: string): Deal[] {
  if (result.status !== "success" || !result.deals?.length) return [];
  const mapped: Deal[] = result.deals.map((md) => ({
    id: md.offerId,
    title: md.title,
    platform: md.platform,
    category: md.category,
    originalPrice: md.originalPrice,
    currentPrice: md.currentPrice,
    discountPercent: md.discountPercent,
    couponCode: md.couponCode,
    cashbackText: md.cashbackText,
    deliveryCharge: md.deliveryCharge,
    finalPrice: md.finalPrice,
    savingsAmount: md.savingsAmount,
    expiryDate: "",
    bestReason: `Verified live deal from ${md.platform}`,
    rating: md.rating,
    imageUrl: md.imageUrl,
    tracked: md.alerted,
    targetPrice: md.targetPrice,
    dealUrl: unpackDirectDealUrl(md.dealUrl),
    sourceUrl: unpackDirectDealUrl(md.dealUrl),
    sourceType: md.sourceType,
    sourceEngine: result.engine,
    priceVerified: md.priceVerified,
    urlVerified: md.urlVerified,
    dealScore: md.dealScore,
    // When the backend last saw this price at the store (shown as "Price checked … ago").
    verifiedAt: md.observedAt,
  }));
  const q = searchQuery?.trim();
  return q ? filterDealsBySearchQuery(mapped, q) : mapped;
}
