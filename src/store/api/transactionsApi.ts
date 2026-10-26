import { apiSlice } from "./apiSlice";
import type { Transaction } from "@/store/types";
import { isOfflineId } from "@/lib/offline-queue";

interface PaginatedTransactions {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
}

/** Backend max page size (@Max(500)) and a safety cap of 20k transactions. */
const PAGE_SIZE = 500;
const MAX_PAGES = 40;

export const transactionsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Every transaction, not just the newest page: totals (balance, runway, reports, counts) are
    // built from this list, so it pages through /transactions until it has them all.
    getTransactions: builder.query<Transaction[], void>({
      async queryFn(_arg, _api, _extra, baseQuery) {
        const all: Transaction[] = [];
        for (let page = 1; page <= MAX_PAGES; page++) {
          const res = await baseQuery(`/transactions?limit=${PAGE_SIZE}&page=${page}`);
          if (res.error) return { error: res.error };
          const data = res.data as PaginatedTransactions | Transaction[];
          if (Array.isArray(data)) return { data };
          all.push(...(data?.items ?? []));
          if (!data?.items?.length || all.length >= (data.total ?? 0)) break;
        }
        return { data: all };
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
      // Saved offline: show it in the list now (the refetch can't run until we're back online).
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (isOfflineId(data?.id)) {
            dispatch(transactionsApi.util.updateQueryData("getTransactions", undefined, (list) => void list.unshift(data)));
          }
        } catch {
          // the form shows the error
        }
      },
      invalidatesTags: [{ type: "Transactions", id: "LIST" }, "Budgets"],
    }),

    updateTransaction: builder.mutation<Transaction, { id: string; data: Partial<Omit<Transaction, "id">> }>({
      query: ({ id, data }) => ({
        url: `/transactions/${id}`,
        method: "PATCH",
        body: data,
      }),
      // Optimistic: the edit shows at once (and stays visible while offline); undone on failure.
      async onQueryStarted({ id, data }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          transactionsApi.util.updateQueryData("getTransactions", undefined, (list) => {
            const tx = list.find((t) => t.id === id);
            if (tx) Object.assign(tx, data);
          })
        );
        queryFulfilled.catch(patch.undo);
      },
      invalidatesTags: [{ type: "Transactions", id: "LIST" }, "Budgets"],
    }),

    deleteTransaction: builder.mutation<void, string>({
      query: (id) => ({
        url: `/transactions/${id}`,
        method: "DELETE",
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          transactionsApi.util.updateQueryData("getTransactions", undefined, (list) => list.filter((t) => t.id !== id))
        );
        queryFulfilled.catch(patch.undo);
      },
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

