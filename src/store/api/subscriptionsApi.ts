import type { Subscription } from '@/store/types';
import { apiSlice } from './apiSlice';

export const subscriptionsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSubscriptions: builder.query<Subscription[], void>({
      query: () => '/subscriptions',
      providesTags: (result) =>
        result
          ? [...result.map((s) => ({ type: 'Subscriptions' as const, id: s.id })), { type: 'Subscriptions' as const, id: 'LIST' }]
          : [{ type: 'Subscriptions' as const, id: 'LIST' }],
    }),

    addSubscription: builder.mutation<Subscription, Omit<Subscription, 'id' | 'annualCost'>>({
      query: (body) => ({ url: '/subscriptions', method: 'POST', body }),
      // A newly added redundant subscription changes the derived savings figures too.
      invalidatesTags: [{ type: 'Subscriptions', id: 'LIST' }, { type: 'Subscriptions', id: 'STATS' }, 'Savings'],
    }),

    updateSubscription: builder.mutation<
      Subscription,
      { id: string; patch: Partial<Omit<Subscription, 'id' | 'annualCost'>> }
    >({
      query: ({ id, patch }) => ({ url: `/subscriptions/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Subscriptions', id },
        { type: 'Subscriptions', id: 'LIST' },
        { type: 'Subscriptions', id: 'STATS' },
        'Savings',
      ],
    }),

    deleteSubscription: builder.mutation<void, string>({
      query: (id) => ({ url: `/subscriptions/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Subscriptions', id }, { type: 'Subscriptions', id: 'LIST' }, 'Savings'],
    }),

    getSubscriptionStats: builder.query<{ monthlyChangePercent: number | null }, void>({
      query: () => '/subscriptions/stats',
      providesTags: [{ type: 'Subscriptions', id: 'STATS' }],
    }),
  }),
});

export const {
  useGetSubscriptionsQuery,
  useAddSubscriptionMutation,
  useUpdateSubscriptionMutation,
  useDeleteSubscriptionMutation,
  useGetSubscriptionStatsQuery,
} = subscriptionsApi;
