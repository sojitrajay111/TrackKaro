import type { KhataEntry } from '@/store/types';
import { apiSlice } from './apiSlice';

export const khataApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getKhataEntries: builder.query<KhataEntry[], void>({
      query: () => '/khata',
      providesTags: (result) =>
        result
          ? [...result.map((k) => ({ type: 'Khata' as const, id: k.id })), { type: 'Khata' as const, id: 'LIST' }]
          : [{ type: 'Khata' as const, id: 'LIST' }],
    }),

    addKhataEntry: builder.mutation<KhataEntry, Omit<KhataEntry, 'id' | 'status'> & { status?: 'pending' | 'settled' }>({
      query: (body) => ({ url: '/khata', method: 'POST', body }),
      invalidatesTags: [{ type: 'Khata', id: 'LIST' }],
      async onQueryStarted(newKhata, { dispatch, queryFulfilled }) {
        const tempId = `temp-khata-${Date.now()}`;
        const tempEntry: KhataEntry = {
          id: tempId,
          personName: newKhata.personName,
          phone: newKhata.phone,
          amount: newKhata.amount,
          type: newKhata.type,
          date: newKhata.date,
          dueDate: newKhata.dueDate,
          notes: newKhata.notes,
          status: newKhata.status || 'pending',
        };
        const patchResult = dispatch(
          khataApi.util.updateQueryData('getKhataEntries', undefined, (draft) => {
            draft.unshift(tempEntry);
          })
        );
        try {
          const { data: created } = await queryFulfilled;
          dispatch(
            khataApi.util.updateQueryData('getKhataEntries', undefined, (draft) => {
              const idx = draft.findIndex((k) => k.id === tempId);
              if (idx !== -1) {
                draft[idx] = created;
              } else if (!draft.some((k) => k.id === created.id)) {
                draft.unshift(created);
              }
            })
          );
        } catch {
          patchResult.undo();
        }
      },
    }),

    // Edit an entry (PATCH /khata/:id). Optimistic so the ledger updates at once.
    updateKhataEntry: builder.mutation<KhataEntry, { id: string; patch: Partial<Omit<KhataEntry, 'id'>> }>({
      query: ({ id, patch }) => ({ url: `/khata/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Khata', id }, { type: 'Khata', id: 'LIST' }],
      async onQueryStarted({ id, patch }, { dispatch, queryFulfilled }) {
        const undo = dispatch(
          khataApi.util.updateQueryData('getKhataEntries', undefined, (draft) => {
            const item = draft.find((k) => k.id === id);
            if (item) Object.assign(item, patch);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          undo.undo();
        }
      },
    }),

    toggleKhataStatus: builder.mutation<KhataEntry, string>({
      query: (id) => ({ url: `/khata/${id}/toggle`, method: 'PATCH' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Khata', id }, { type: 'Khata', id: 'LIST' }],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          khataApi.util.updateQueryData('getKhataEntries', undefined, (draft) => {
            const item = draft.find((k) => k.id === id);
            if (item) {
              item.status = item.status === 'settled' ? 'pending' : 'settled';
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    deleteKhataEntry: builder.mutation<void, string>({
      query: (id) => ({ url: `/khata/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Khata', id }, { type: 'Khata', id: 'LIST' }],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          khataApi.util.updateQueryData('getKhataEntries', undefined, (draft) => {
            const index = draft.findIndex((k) => k.id === id);
            if (index !== -1) {
              draft.splice(index, 1);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    settleAllKhataForPerson: builder.mutation<void, string>({
      query: (personName) => ({ url: '/khata/settle-all', method: 'POST', body: { personName } }),
      invalidatesTags: [{ type: 'Khata', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetKhataEntriesQuery,
  useAddKhataEntryMutation,
  useToggleKhataStatusMutation,
  useUpdateKhataEntryMutation,
  useDeleteKhataEntryMutation,
  useSettleAllKhataForPersonMutation,
} = khataApi;
