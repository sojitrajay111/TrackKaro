"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Drawer } from "@/components/ui/drawer";
import { resolveDealProductImage } from "@/lib/deal-images";
import { useGetBudgetsQuery } from "@/store/api/budgetsApi";
import { useSetDealAlertMutation } from "@/store/api/dealsApi";
import { useGetTransactionsQuery } from "@/store/api/transactionsApi";
import type { CategoryName, Deal } from "@/store/types";

const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80";

/** Decode HTML entities marketplaces leave in titles (same as the app's cleanDealProductTitle). */
const cleanTitle = (raw: string) =>
  (raw || "").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

/** Which spending category a purchase would land in (same mapping as the app). */
function expenseCategoryFor(dealCategory?: string): CategoryName {
  const l = (dealCategory || "").toLowerCase();
  if (l.includes("food") || l.includes("dining") || l.includes("restaurant")) return "Food";
  if (l.includes("travel") || l.includes("flight") || l.includes("hotel")) return "Travel";
  if (l.includes("bill") || l.includes("recharge")) return "Bills";
  if (l.includes("entertainment") || l.includes("movie") || l.includes("ott")) return "Entertainment";
  if (l.includes("grocer") || l.includes("kirana")) return "Groceries";
  if (l.includes("health") || l.includes("medicine")) return "Health";
  return "Shopping";
}

function ago(iso?: string) {
  if (!iso) return null;
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(mins) || mins < 0) return null;
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  return h < 24 ? `${h} hr ago` : `${Math.round(h / 24)} days ago`;
}

/**
 * Product detail drawer for a live deal, like the app's DealDetailView: hero image, price,
 * where the price comes from, the breakdown, an affordability check against the user's real
 * budget and balance, and a price-drop alert. Every figure here is real data.
 */
export function DealDetailDrawer({ deal, onClose, onOpenDeal }: { deal: Deal | null; onClose: () => void; onOpenDeal: (deal: Deal) => void }) {
  // Keep the last deal visible while the drawer animates closed.
  const [shown, setShown] = useState<Deal | null>(deal);
  if (deal && deal !== shown) setShown(deal);
  const d = deal ?? shown;

  return (
    <Drawer
      open={Boolean(deal)}
      onClose={onClose}
      label={d ? cleanTitle(d.title) : "Deal"}
      footer={d && <Footer deal={d} onOpenDeal={onOpenDeal} />}
    >
      {d && <DealBody key={d.id} deal={d} />}
    </Drawer>
  );
}

function Footer({ deal, onOpenDeal }: { deal: Deal; onOpenDeal: (deal: Deal) => void }) {
  const [shared, setShared] = useState(false);
  const url = deal.dealUrl || deal.sourceUrl || "";
  const share = async () => {
    const text = `Check out this deal on TrackKaro: ${cleanTitle(deal.title)} for ${inr(deal.finalPrice)} on ${deal.platform}!`;
    try {
      if (navigator.share) await navigator.share({ title: cleanTitle(deal.title), text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // share sheet dismissed
    }
  };
  return (
    <>
      <button
        type="button"
        onClick={share}
        className="inline-flex h-11 items-center gap-2 rounded-[14px] border border-border bg-surface px-[18px] text-[16px] font-bold text-foreground transition hover:bg-surface-muted"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {shared ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <path d="M12 3v12M7 8l5-5 5 5M5 14v5h14v-5" />}
        </svg>
        {shared ? "Link copied" : "Share"}
      </button>
      <button
        type="button"
        onClick={() => onOpenDeal(deal)}
        disabled={!url}
        className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[14px] bg-[var(--primary)] px-[18px] text-[16px] font-bold text-[var(--on-primary)] shadow-xs transition hover:bg-[var(--primary-strong)] disabled:opacity-50"
      >
        View on {deal.platform}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7 17 17 7M9 7h8v8" />
        </svg>
      </button>
    </>
  );
}

function DealBody({ deal }: { deal: Deal }) {
  const [src, setSrc] = useState(() => resolveDealProductImage(deal.title, deal.category, deal.imageUrl));
  const { data: transactions = [] } = useGetTransactionsQuery();
  const { data: budgets = [] } = useGetBudgetsQuery();

  const price = deal.finalPrice || deal.currentPrice;
  const discount = Math.max(0, deal.originalPrice - deal.currentPrice);
  const otherOff = Math.max(0, deal.currentPrice + (deal.deliveryCharge || 0) - price);
  const checked = useMemo(() => ago(deal.verifiedAt), [deal.verifiedAt]);

  // Affordability from the user's real data: this month's spend in the category, its budget, balance.
  const money = useMemo(() => {
    const cat = expenseCategoryFor(deal.category);
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    let spent = 0;
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.type === "income") income += t.amount;
      else {
        expense += t.amount;
        if (t.category === cat && t.date?.startsWith(ym)) spent += t.amount;
      }
    }
    const limit = budgets.find((b) => b.category === cat)?.limit;
    const left = limit != null ? limit - spent : null;
    const balance = income - expense;
    let wait = false;
    let reason: string;
    if (deal.purchaseCheck) {
      wait = deal.purchaseCheck.status === "WAIT";
      reason = deal.purchaseCheck.reason;
    } else if (left != null && price > left) {
      wait = true;
      reason = left > 0 ? `This is more than the ${inr(left)} left in your ${cat} budget this month.` : `Your ${cat} budget for this month is already used up.`;
    } else if (price > balance) {
      wait = true;
      reason = "This costs more than your current balance.";
    } else {
      reason = left != null ? `Fits in your ${cat} budget — ${inr(left - price)} would still be left this month.` : `You have no ${cat} budget set; this is ${Math.round((price / Math.max(balance, 1)) * 100)}% of your balance.`;
    }
    return { cat, spent, limit, left, balance, wait, reason };
  }, [transactions, budgets, deal, price]);

  return (
    <>
      {/* Hero image */}
      <div className="relative -mt-1 overflow-hidden rounded-[18px] border border-border bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element -- deal images come from many merchant CDNs */}
        <img
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => src !== FALLBACK_IMAGE && setSrc(FALLBACK_IMAGE)}
          className="mx-auto aspect-[4/3] w-full object-contain p-6"
        />
        {deal.discountPercent > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--primary)] px-2.5 py-1 text-[13px] font-extrabold text-[var(--on-primary)] shadow-xs">
            {deal.discountPercent}% OFF
          </span>
        )}
      </div>

      {/* Title */}
      <div className="pr-10">
        <p className="text-[14px] font-[650] text-foreground-muted">
          {deal.category} · {deal.platform}
        </p>
        <h2 className="mt-0.5 text-[22px] font-extrabold leading-snug tracking-[-0.025em] text-foreground">{cleanTitle(deal.title)}</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {deal.priceVerified && (
            <span className="pill pill--good">
              <i />
              Verified price
            </span>
          )}
          {deal.urlVerified && (
            <span className="pill pill--good">
              <i />
              Official listing
            </span>
          )}
          {deal.rating ? (
            <span className="pill pill--faint">
              <i />★ {deal.rating.toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Price */}
      <div className="d-big">
        <small>Deal price</small>
        <b className="num">{inr(price)}</b>
        <small>
          {deal.originalPrice > price ? (
            <>
              <span className="line-through">{inr(deal.originalPrice)}</span> ·{" "}
              <span className="font-bold text-[var(--good)]">You save {inr(deal.savingsAmount || deal.originalPrice - price)}</span>
            </>
          ) : (
            "Current price"
          )}
        </small>
      </div>

      {/* Trust tiles (only what we actually know) */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", text: checked ? `Price checked ${checked}` : "Live price" },
          { icon: "M12 3 5 6v6c0 4 3 7.5 7 9 4-1.5 7-5 7-9V6zM9 12l2 2 4-4", text: `Listing from ${deal.platform}` },
          { icon: "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z", text: deal.deliveryCharge > 0 ? `${inr(deal.deliveryCharge)} delivery` : "Free delivery" },
        ].map((t) => (
          <div key={t.text} className="grid min-w-0 justify-items-center gap-1.5 rounded-[14px] border border-border bg-[var(--surface-2)] px-2 py-3 text-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={t.icon} />
            </svg>
            <span className="text-[13px] font-semibold leading-tight text-foreground-muted">{t.text}</span>
          </div>
        ))}
      </div>

      {/* Price breakdown */}
      <section>
        <h3 className="mb-1 text-[17px] font-extrabold tracking-[-0.015em] text-foreground">Price breakdown</h3>
        <div className="d-rows">
          <div className="d-row">
            <span>List price</span>
            <span className="num">{inr(deal.originalPrice)}</span>
          </div>
          {discount > 0 && (
            <div className="d-row">
              <span>Discount</span>
              <span className="num text-[var(--good)]">−{inr(discount)}</span>
            </div>
          )}
          <div className="d-row">
            <span>Delivery</span>
            <span className="num">{deal.deliveryCharge > 0 ? `+${inr(deal.deliveryCharge)}` : "Free"}</span>
          </div>
          {otherOff > 0 && (
            <div className="d-row">
              <span>{deal.couponCode ? `Coupon ${deal.couponCode}` : "Other offers"}</span>
              <span className="num text-[var(--good)]">−{inr(otherOff)}</span>
            </div>
          )}
          {deal.cashbackText && (
            <div className="d-row">
              <span>Cashback</span>
              <span>{deal.cashbackText}</span>
            </div>
          )}
          <div className="d-row">
            <span className="!font-extrabold !text-foreground">You pay</span>
            <span className="num text-[17px] !font-extrabold">{inr(price)}</span>
          </div>
        </div>
      </section>

      {/* Affordability check */}
      <section className="rounded-[18px] border border-border bg-[var(--surface-2)] p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[17px] font-extrabold tracking-[-0.015em] text-foreground">Can you afford it?</h3>
          <span className={`pill ${money.wait ? "pill--bad" : "pill--good"}`}>
            <i />
            {money.wait ? "Wait" : "Safe to buy"}
          </span>
        </div>
        <p className="mt-1.5 text-[15px] leading-relaxed text-foreground-muted">{money.reason}</p>
        <div className="d-rows mt-2">
          <div className="d-row">
            <span>{money.cat} spent this month</span>
            <span className="num">{inr(money.spent)}</span>
          </div>
          <div className="d-row">
            <span>{money.cat} budget left</span>
            {money.left != null ? (
              <span className={`num ${money.left - price < 0 ? "text-[var(--bad)]" : "text-[var(--good)]"}`}>{inr(Math.max(0, money.left))}</span>
            ) : (
              <Link href="/dashboard/spending" className="text-[var(--primary)] underline-offset-2 hover:underline">
                Set a budget
              </Link>
            )}
          </div>
          <div className="d-row">
            <span>Your balance</span>
            <span className="num">{inr(money.balance)}</span>
          </div>
        </div>
      </section>

      {deal.sourceEngine === "provider" && <PriceAlert deal={deal} />}
    </>
  );
}

/** Price-drop alert on a live offer (PATCH /deals/offers/:id/alert), like the app's alert sheet. */
function PriceAlert({ deal }: { deal: Deal }) {
  const price = deal.finalPrice || deal.currentPrice;
  const [on, setOn] = useState(Boolean(deal.tracked));
  const [target, setTarget] = useState(String(deal.targetPrice ?? Math.round(price * 0.9)));
  const [msg, setMsg] = useState<string | null>(null);
  const [setAlert, { isLoading }] = useSetDealAlertMutation();

  const save = async (enabled: boolean) => {
    const value = Number(target);
    if (enabled && (!value || value <= 0 || value >= price)) {
      setMsg(`Set a target below the current ${inr(price)}.`);
      return;
    }
    try {
      await setAlert({ offerId: deal.id, enabled, targetPrice: enabled ? value : undefined }).unwrap();
      setOn(enabled);
      setMsg(enabled ? `We'll notify you when it drops to ${inr(value)}.` : "Alert turned off.");
    } catch {
      setMsg("Couldn't save the alert. Try again.");
    }
  };

  return (
    <section className="rounded-[18px] border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[17px] font-extrabold tracking-[-0.015em] text-foreground">Price drop alert</h3>
        {on && (
          <span className="pill pill--good">
            <i />
            On
          </span>
        )}
      </div>
      <p className="mt-1 text-[14px] text-foreground-muted">Get a notification when this drops to your price.</p>
      <div className="mt-3 flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Target price</span>
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-bold text-foreground-muted">₹</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="h-11 w-full rounded-[12px] border border-[var(--line-2)] bg-surface pl-8 pr-3 text-[15px] font-semibold text-foreground num outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_16%,transparent)]"
          />
        </label>
        <button
          type="button"
          onClick={() => save(true)}
          disabled={isLoading}
          className="inline-flex h-11 shrink-0 items-center rounded-[12px] bg-[var(--primary)] px-4 text-[15px] font-bold text-[var(--on-primary)] transition hover:bg-[var(--primary-strong)] disabled:opacity-50"
        >
          {on ? "Update" : "Set alert"}
        </button>
        {on && (
          <button
            type="button"
            onClick={() => save(false)}
            disabled={isLoading}
            className="inline-flex h-11 shrink-0 items-center rounded-[12px] border border-border bg-surface px-3.5 text-[15px] font-bold text-foreground transition hover:bg-surface-muted disabled:opacity-50"
          >
            Turn off
          </button>
        )}
      </div>
      {msg && <p className="mt-2 text-[14px] font-semibold text-foreground-muted">{msg}</p>}
    </section>
  );
}
