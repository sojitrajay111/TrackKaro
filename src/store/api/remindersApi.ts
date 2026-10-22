import type { BillReminder } from '@/store/types';
import { applyPaid, applyUndo } from '@/lib/reminders';
import { apiSlice } from './apiSlice';

export const remindersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getReminders: builder.query<BillReminder[], void>({
      query: () => '/reminders',
      providesTags: (result) =>
        result
          ? [...result.map((r) => ({ type: 'Reminders' as const, id: r.id })), { type: 'Reminders' as const, id: 'LIST' }]
          : [{ type: 'Reminders' as const, id: 'LIST' }],
    }),

    addReminder: builder.mutation<BillReminder, Omit<BillReminder, 'id'>>({
      query: (body) => {
        // The backend's CreateReminderDto forbids 'status' (it automatically defaults to 'pending').
        // Strip 'status' from the payload to prevent 400 Bad Request ("property status should not exist").
        const cleanBody: Partial<BillReminder> = { ...body };
        delete cleanBody.status;
        return { url: '/reminders', method: 'POST', body: cleanBody };
      },
      invalidatesTags: [{ type: 'Reminders', id: 'LIST' }],
    }),

    updateReminder: builder.mutation<BillReminder, { id: string; patch: Partial<BillReminder> }>({
      query: ({ id, patch }) => ({ url: `/reminders/${id}`, method: 'PATCH', body: patch }),
      // Optimistic: apply the change to the cached list at once (paid toggle feels instant), undo on failure.
      // Marking a recurring bill paid rolls it to the next due date, exactly as the server will.
      async onQueryStarted({ id, patch }, { dispatch, queryFulfilled }) {
        const undo = dispatch(
          remindersApi.util.updateQueryData('getReminders', undefined, (draft) => {
            const i = draft.findIndex((x) => x.id === id);
            if (i < 0) return;
            const { status, ...fields } = patch;
            const next = { ...draft[i], ...fields };
            draft[i] = status === 'paid' && draft[i].status === 'pending' ? applyPaid(next) : status ? { ...next, status } : next;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          undo.undo();
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Reminders', id },
        { type: 'Reminders', id: 'LIST' },
        { type: 'Reminders', id: 'STATS' },
      ],
    }),

    /** Reverse the latest payment: a recurring bill returns to the period it settled. */
    undoReminderPayment: builder.mutation<BillReminder, string>({
      query: (id) => ({ url: `/reminders/${id}/undo-payment`, method: 'POST' }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const undo = dispatch(
          remindersApi.util.updateQueryData('getReminders', undefined, (draft) => {
            const i = draft.findIndex((x) => x.id === id);
            if (i >= 0) draft[i] = applyUndo(draft[i]);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          undo.undo();
        }
      },
      invalidatesTags: (_result, _error, id) => [
        { type: 'Reminders', id },
        { type: 'Reminders', id: 'LIST' },
        { type: 'Reminders', id: 'STATS' },
      ],
    }),

    deleteReminder: builder.mutation<void, string>({
      query: (id) => ({ url: `/reminders/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Reminders', id }, { type: 'Reminders', id: 'LIST' }],
    }),

    getReminderStats: builder.query<{ onTimeRate: number | null }, void>({
      query: () => '/reminders/stats',
      providesTags: [{ type: 'Reminders', id: 'STATS' }],
    }),
  }),
});

export const {
  useGetRemindersQuery,
  useAddReminderMutation,
  useUpdateReminderMutation,
  useUndoReminderPaymentMutation,
  useDeleteReminderMutation,
  useGetReminderStatsQuery,
} = remindersApi;
