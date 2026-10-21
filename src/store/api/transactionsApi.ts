import { apiSlice } from "./apiSlice";
import type { Transaction } from "@/store/types";

interface PaginatedTransactions {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export const transactionsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTransactions: builder.query<Transaction[], void>({
      query: () => "/transactions?limit=200",
      transformResponse: (response: PaginatedTransactions | Transaction[]) => {
        if (Array.isArray(response)) return response;
        return response?.items || [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((tx) => ({ type: "Transactions" as const, id: tx.id })),
              { type: "Transactions" as const, id: "LIST" },
            ]
          : [{ type: "Transactions" as const, id: "LIST" }],
    }),

    addTransaction: builder.mutation<Transaction, Omit<Transaction, "id">>({
      query: (body) => ({
        url: "/transactions",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Transactions", id: "LIST" }, "Budgets"],
    }),

    updateTransaction: builder.mutation<Transaction, { id: string; data: Partial<Omit<Transaction, "id">> }>({
      query: ({ id, data }) => ({
        url: `/transactions/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: [{ type: "Transactions", id: "LIST" }, "Budgets"],
    }),

    deleteTransaction: builder.mutation<void, string>({
      query: (id) => ({
        url: `/transactions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Transactions", id: "LIST" }, "Budgets"],
    }),
  }),
});

export const {
  useGetTransactionsQuery,
  useAddTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} = transactionsApi;

