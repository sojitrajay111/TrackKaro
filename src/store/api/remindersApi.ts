import type { BillReminder } from '@/store/types';
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
      invalidatesTags: (_result, _error, { id }) => [
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
  useDeleteReminderMutation,
  useGetReminderStatsQuery,
} = remindersApi;
