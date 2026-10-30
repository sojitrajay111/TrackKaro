import type { CategoryName, ExpenseGroup, GroupExpense, GroupInvitePreview, PendingGroupConfirmation, Transaction } from '@/store/types';
import { isOfflineId } from '@/lib/offline-queue';
import { apiSlice } from './apiSlice';

type ConfirmGroupExpenseRequest = { groupId: string; expenseId: string; category: CategoryName };

type CreateGroupRequest = {
  name: string;
  category: ExpenseGroup['category'];
  members: { name: string; phone?: string }[];
};

export type JoinGroupRequest = {
  inviteCode: string;
  memberId?: string;
  memberName?: string;
};

type AddGroupExpenseRequest = Omit<GroupExpense, 'id' | 'groupId'> & { groupId: string };

type RecordSettlementRequest = {
  groupId: string;
  fromMember: string;
  toMember: string;
  amount: number;
  notes?: string;
};

export type GroupBalances = {
  groupId: string;
  totalGroupSpendMinor: number;
  members: { name: string; netMinor: number }[];
  settlements: { from: string; to: string; amountMinor: number }[];
  /** true: fewest payments ("Simplify debts" on); false: pairwise debts. */
  simplified?: boolean;
};

type UpdateGroupRequest = {
  groupId: string;
  name?: string;
  category?: ExpenseGroup['category'];
  members?: { name: string; phone?: string }[];
  simplifyDebts?: boolean;
};

/**
 * Saved offline (the queue answers with an `offline-…` id): show it in the group straight away,
 * since the refetch can't run until the connection is back. Balances update when it syncs.
 */
async function showIfOffline(
  groupId: string,
  queryFulfilled: Promise<{ data: GroupExpense }>,
  dispatch: (action: unknown) => unknown,
) {
  try {
    const { data } = await queryFulfilled;
    if (!isOfflineId(data?.id)) return;
    dispatch(
      groupsApi.util.updateQueryData('getGroups', undefined, (groups) => {
        const group = groups.find((g) => g.id === groupId);
        if (group) group.expenses = [{ ...data, groupId } as GroupExpense, ...(group.expenses ?? [])];
      }),
    );
  } catch {
    // the form shows the error
  }
}

export const groupsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGroups: builder.query<ExpenseGroup[], void>({
      query: () => '/groups',
      providesTags: (result) =>
        result
          ? [...result.map((g) => ({ type: 'Groups' as const, id: g.id })), { type: 'Groups' as const, id: 'LIST' }]
          : [{ type: 'Groups' as const, id: 'LIST' }],
    }),

    createGroup: builder.mutation<ExpenseGroup, CreateGroupRequest>({
      query: (body) => ({ url: '/groups', method: 'POST', body }),
      invalidatesTags: [{ type: 'Groups', id: 'LIST' }],
    }),

    updateGroup: builder.mutation<ExpenseGroup, UpdateGroupRequest>({
      query: ({ groupId, ...body }) => ({ url: `/groups/${groupId}`, method: 'PATCH', body }),
      // Balances depend on the "Simplify debts" setting, so refresh them too.
      invalidatesTags: (_result, _error, { groupId }) => [
        { type: 'Groups', id: groupId },
        { type: 'Groups', id: 'LIST' },
        { type: 'Groups', id: `${groupId}-balances` },
      ],
    }),

    deleteGroup: builder.mutation<void, string>({
      query: (id) => ({ url: `/groups/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Groups', id }, { type: 'Groups', id: 'LIST' }],
    }),

    addGroupExpense: builder.mutation<GroupExpense, AddGroupExpenseRequest>({
      query: ({ groupId, ...body }) => ({ url: `/groups/${groupId}/expenses`, method: 'POST', body }),
      onQueryStarted: ({ groupId }, { dispatch, queryFulfilled }) => showIfOffline(groupId, queryFulfilled, dispatch),
      invalidatesTags: (_result, _error, { groupId }) => [
        { type: 'Groups', id: groupId },
        { type: 'Groups', id: 'LIST' },
        { type: 'Groups', id: 'PENDING_CONFIRMATIONS' },
        'Notifications',
      ],
    }),

    updateGroupExpense: builder.mutation<
      GroupExpense,
      { groupId: string; expenseId: string; patch: Partial<Omit<GroupExpense, 'id' | 'groupId'>> }
    >({
      query: ({ groupId, expenseId, patch }) => ({
        url: `/groups/${groupId}/expenses/${expenseId}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_result, _error, { groupId }) => [
        { type: 'Groups', id: groupId },
        { type: 'Groups', id: 'LIST' },
        { type: 'Groups', id: 'PENDING_CONFIRMATIONS' },
        'Notifications',
      ],
    }),

    deleteGroupExpense: builder.mutation<void, { groupId: string; expenseId: string }>({
      query: ({ groupId, expenseId }) => ({
        url: `/groups/${groupId}/expenses/${expenseId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { groupId }) => [
        { type: 'Groups', id: groupId },
        { type: 'Groups', id: 'LIST' },
        { type: 'Groups', id: 'PENDING_CONFIRMATIONS' },
        'Notifications',
      ],
    }),

    recordGroupSettlement: builder.mutation<GroupExpense, RecordSettlementRequest>({
      query: ({ groupId, ...body }) => ({ url: `/groups/${groupId}/settlements`, method: 'POST', body }),
      onQueryStarted: ({ groupId }, { dispatch, queryFulfilled }) => showIfOffline(groupId, queryFulfilled, dispatch),
      invalidatesTags: (_result, _error, { groupId }) => [
        { type: 'Groups', id: groupId },
        { type: 'Groups', id: 'LIST' },
        { type: 'Groups', id: 'PENDING_CONFIRMATIONS' },
        'Notifications',
      ],
    }),

    getGroupBalances: builder.query<GroupBalances, string>({
      query: (groupId) => `/groups/${groupId}/balances`,
      providesTags: (_result, _error, groupId) => [{ type: 'Groups', id: `${groupId}-balances` }],
    }),

    previewInvite: builder.query<GroupInvitePreview, string>({
      query: (code) => `/groups/invite/${code}`,
    }),

    joinGroup: builder.mutation<ExpenseGroup, JoinGroupRequest>({
      query: (body) => ({ url: '/groups/join', method: 'POST', body }),
      invalidatesTags: [{ type: 'Groups', id: 'LIST' }, { type: 'Groups', id: 'PENDING_CONFIRMATIONS' }, 'Notifications'],
    }),

    getPendingGroupConfirmations: builder.query<PendingGroupConfirmation[], void>({
      query: () => '/groups/pending-confirmations',
      providesTags: [{ type: 'Groups', id: 'PENDING_CONFIRMATIONS' }],
    }),

    confirmGroupExpense: builder.mutation<Transaction, ConfirmGroupExpenseRequest>({
      query: ({ groupId, expenseId, category }) => ({
        url: `/groups/${groupId}/expenses/${expenseId}/confirm`,
        method: 'POST',
        body: { category },
      }),
      invalidatesTags: (_result, _error, { groupId }) => [
        { type: 'Groups', id: groupId },
        { type: 'Groups', id: 'LIST' },
        { type: 'Groups', id: 'PENDING_CONFIRMATIONS' },
        'Transactions',
        'Budgets',
      ],
    }),
  }),
});

export const {
  useGetGroupsQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useAddGroupExpenseMutation,
  useUpdateGroupExpenseMutation,
  useDeleteGroupExpenseMutation,
  useRecordGroupSettlementMutation,
  useGetGroupBalancesQuery,
  usePreviewInviteQuery,
  useLazyPreviewInviteQuery,
  useJoinGroupMutation,
  useGetPendingGroupConfirmationsQuery,
  useConfirmGroupExpenseMutation,
} = groupsApi;

