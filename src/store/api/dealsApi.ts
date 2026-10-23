import type { Deal, DealSearchResponse } from '@/store/types';
import { apiSlice } from './apiSlice';

export const dealsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDeals: builder.query<Deal[], void>({
      query: () => '/deals',
      providesTags: (result) =>
        result
          ? [...result.map((d) => ({ type: 'Deals' as const, id: d.id })), { type: 'Deals' as const, id: 'LIST' }]
          : [{ type: 'Deals' as const, id: 'LIST' }],
    }),

    toggleDealTrack: builder.mutation<Deal, { id: string; targetPrice?: number }>({
      query: ({ id, targetPrice }) => ({ url: `/deals/${id}/track`, method: 'PATCH', body: { targetPrice } }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Deals', id }, { type: 'Deals', id: 'LIST' }, 'Savings'],
    }),

    simulateDealDrop: builder.mutation<Deal, { id: string; targetPrice?: number }>({
      query: ({ id, targetPrice }) => ({ url: `/deals/${id}/simulate-drop`, method: 'POST', body: { targetPrice } }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Deals', id },
        { type: 'Deals', id: 'LIST' },
        'Notifications',
        'Savings',
      ],
    }),

    // Provider-neutral equivalent of toggleDealTrack/simulateDealDrop, for deals whose `id` is a
    // MerchantOffer id (i.e. `deal.sourceEngine === 'provider'`) rather than a legacy `Deal` id —
    // calling the legacy routes with an offer id 404s (see SetPriceAlertSheet.tsx).
    setDealAlert: builder.mutation<
      { id: string; enabled: boolean; targetPrice?: number },
      { offerId: string; enabled: boolean; targetPrice?: number }
    >({
      query: ({ offerId, enabled, targetPrice }) => ({
        url: `/deals/offers/${offerId}/alert`,
        method: 'PATCH',
        body: { enabled, targetPrice },
      }),
      invalidatesTags: (_result, _error, { offerId }) => [{ type: 'Deals', id: offerId }, 'Savings'],
    }),

    // Records a click-through on a provider-mode merchant offer and returns where to actually
    // send the user — a real affiliate link once a provider resolves one, else the plain deal
    // URL. Only valid for `sourceEngine === 'provider'` deals (see DealDetailView.tsx etc.).
    recordDealClick: builder.mutation<{ redirectUrl: string; isAffiliateResolved: boolean }, string>({
      query: (offerId) => ({ url: `/deals/offers/${offerId}/click`, method: 'POST' }),
    }),

    // The endpoint's response is the new provider-neutral envelope (see store/types.ts —
    // DealSearchResponse), not a bare Deal[]. A 'provider'-mode success doesn't land in the
    // legacy `Deal` collection `GET /deals` reads from, so this still invalidates 'Deals' for
    // the 'legacy' engine's sake (which does persist there) — a 'provider'-mode search with no
    // configured provider simply won't have anything new for that refetch to pick up yet.
    searchRealDeals: builder.mutation<DealSearchResponse, string | void>({
      query: (q) => ({ url: `/deals/search${q ? `?q=${encodeURIComponent(q)}` : ''}` }),
    }),

    // Same endpoint as a cached query, for the website's Deals page: each search term is kept
    // for the backend's offer-cache window (~6h), so going back to a term is instant.
    // Cached per search term (and page): page 1 for the first screen, later pages on scroll.
    searchDeals: builder.query<DealSearchResponse, string | { q: string; page?: number }>({
      query: (arg) => {
        const { q, page = 1 } = typeof arg === "string" ? { q: arg } : arg;
        return `/deals/search?q=${encodeURIComponent(q)}${page > 1 ? `&page=${page}` : ""}`;
      },
      keepUnusedDataFor: 6 * 60 * 60,
    }),
  }),
});

export const {
  useGetDealsQuery,
  useToggleDealTrackMutation,
  useSimulateDealDropMutation,
  useSetDealAlertMutation,
  useRecordDealClickMutation,
  useSearchRealDealsMutation,
  useSearchDealsQuery,
  useLazySearchDealsQuery,
} = dealsApi;
