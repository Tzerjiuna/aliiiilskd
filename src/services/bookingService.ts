import { createClient } from '@/lib/supabase/client';
import type { Booking, ManagedOrder, OrderLifecycleStatus, OrderStatusHistory } from '@/types/booking';

// ─── Booking Service ──────────────────────────────────────────────────────────

export async function fetchUserBookings(userId: string): Promise<Booking[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Booking[];
}

export async function fetchAllOrders(): Promise<ManagedOrder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, user_profiles(full_name), order_status_history(*)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_profiles?.full_name ?? '—',
    hotel: row.hotel_name ?? '—',
    amount: row.amount ?? 0,
    status: row.lifecycle_status ?? 'pending',
    orderDate: row.created_at
      ? new Date(row.created_at).toLocaleDateString('en-GB')
      : '—',
    statusHistory: (row.order_status_history ?? []).map((h: any) => ({
      status: h.status as OrderLifecycleStatus,
      changedAt: h.changed_at,
      note: h.note,
    })) as OrderStatusHistory[],
  }));
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderLifecycleStatus,
  note?: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc('update_order_status', {
    p_order_id: orderId,
    p_new_status: status,
    p_note: note ?? null,
  });

  if (error) throw new Error(error.message);
}
