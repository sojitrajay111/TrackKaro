import { apiSlice } from "./apiSlice";
import type { CategoryBudget, CategoryName } from "@/store/types";

export const budgetsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBudgets: builder.query<CategoryBudget[], void>({
      query: () => "/budgets",
      providesTags: ["Budgets"],
    }),

    setBudget: builder.mutation<CategoryBudget, { category: CategoryName; limit: number }>({
      query: ({ category, limit }) => ({
        url: `/budgets/${category}`,
        method: "PUT",
        body: { limit },
      }),
      invalidatesTags: ["Budgets"],
    }),
  }),
});

export const { useGetBudgetsQuery, useSetBudgetMutation } = budgetsApi;
