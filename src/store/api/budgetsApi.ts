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
      // Show the new limit straight away; roll back if the save fails. The server copy
      // replaces it once the request settles (invalidatesTags refetches the list).
      async onQueryStarted({ category, limit }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          budgetsApi.util.updateQueryData("getBudgets", undefined, (draft) => {
            const existing = draft.find((b) => b.category === category);
            if (existing) existing.limit = limit;
            else draft.push({ category, limit });
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: ["Budgets"],
    }),
  }),
});

export const { useGetBudgetsQuery, useSetBudgetMutation } = budgetsApi;
