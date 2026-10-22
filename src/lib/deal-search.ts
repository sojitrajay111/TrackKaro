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

// Personalised suggestions — same pools and order as the app (TrackKaro/src/lib/deal-suggestions.ts):
// gender/style picks first, then the user's top spending categories.
type Gender = "male" | "female" | "other" | "unspecified";
const POOLS: Record<"male" | "female" | "neutral", string[]> = {
  male: ["men formal shirts", "men jeans pants", "smartwatch for men", "wireless earbuds", "men running shoes", "men grooming trimmer"],
  female: ["makeup kit", "lipstick set", "women kurti", "handbags for women", "skincare serum", "women running shoes"],
  neutral: ["wireless earbuds", "smartphones", "power bank", "home appliances", "running shoes", "bluetooth headphones"],
};
const CATEGORY_QUERY: Record<string, string> = {
  Food: "snacks and groceries",
  Shopping: "fashion accessories",
  Groceries: "grocery essentials",
  Travel: "travel accessories",
  Health: "fitness band",
  Entertainment: "gaming accessories",
};

const poolFor = (g?: Gender) => (g === "male" ? POOLS.male : g === "female" ? POOLS.female : POOLS.neutral);

export function dealSuggestions(gender: Gender | undefined, topCategories: string[], limit = 6): string[] {
  const out: string[] = [];
  const push = (q: string) => !out.some((x) => x.toLowerCase() === q.toLowerCase()) && out.push(q);
  for (const q of poolFor(gender)) {
    if (out.length >= limit) break;
    push(q);
  }
  for (const c of topCategories.slice(0, 2)) {
    if (out.length >= limit) break;
    if (CATEGORY_QUERY[c]) push(CATEGORY_QUERY[c]);
  }
  return out.slice(0, limit);
}

export const defaultDealQuery = (gender?: Gender) => poolFor(gender)[0] ?? DEFAULT_DEAL_QUERY;
