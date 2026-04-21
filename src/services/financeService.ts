import { createClient } from '@/lib/supabase/client';
import type { TopupRequest, WithdrawalRequest, WithdrawalTrackerEntry } from '@/types/finance';

// ─── Finance Service ──────────────────────────────────────────────────────────

export async function fetchTopupRequests(): Promise<TopupRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('topup_requests')
    .select('*, user_profiles(full_name)')
    .order('submitted_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_profiles?.full_name ?? '—',
    amount: row.amount ?? 0,
    method: row.method ?? '—',
    reference: row.reference ?? '—',
    status: row.status ?? 'pending',
    submittedAt: row.submitted_at ?? '',
    receipt: row.receipt_url ?? '',
    bankInfo: row.bank_info ?? '',
  }));
}

export async function fetchWithdrawalRequests(): Promise<WithdrawalRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('withdrawal_requests')
    .select('*, user_profiles(full_name, reputation)')
    .order('requested_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_profiles?.full_name ?? '—',
    amount: row.amount ?? 0,
    bankName: row.bank_name ?? '—',
    accountNo: row.account_no ?? '—',
    reputation: row.user_profiles?.reputation ?? 0,
    status: row.status ?? 'pending',
    requestedAt: row.requested_at ?? '',
  }));
}

export async function fetchUserWithdrawals(userId: string): Promise<WithdrawalTrackerEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .eq('user_id', userId)
    .order('requested_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    amount: row.amount ?? 0,
    status: row.status ?? 'pending',
    submittedDate: row.requested_at ?? '',
    approvalDate: row.approved_at ?? undefined,
    bankName: row.bank_name ?? '—',
    accountNo: row.account_no ?? '—',
    accountHolder: row.account_holder ?? '—',
    referenceNo: row.reference_no ?? undefined,
    remarks: row.remarks ?? undefined,
  }));
}

export async function approveTopup(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('topup_requests')
    .update({ status: 'approved' })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function rejectTopup(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('topup_requests')
    .update({ status: 'rejected' })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function approveWithdrawal(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('withdrawal_requests')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function rejectWithdrawal(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('withdrawal_requests')
    .update({ status: 'rejected' })
    .eq('id', id);
  if (error) throw new Error(error.message);
}
