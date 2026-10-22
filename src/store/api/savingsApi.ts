import type { SavingsMetrics } from '@/store/types';
import { apiSlice } from './apiSlice';

export const savingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSavingsMetrics: builder.query<SavingsMetrics, void>({
      query: () => '/savings/metrics',
      providesTags: ['Savings'],
    }),
  }),
});

export const { useGetSavingsMetricsQuery } = savingsApi;
