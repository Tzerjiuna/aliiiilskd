import { createClient } from '@/lib/supabase/client';
import type { User, WalletLog } from '@/types/user';
import type { UserProfile } from '@/types/auth';

// ─── User Service ─────────────────────────────────────────────────────────────

export async function fetchUsers(): Promise<User[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    full_name: row.full_name ?? '—',
    email: row.email ?? '—',
    phone: row.phone ?? '—',
    level: row.level ?? 1,
    wallet_balance: row.wallet_balance ?? 0,
    reputation: row.reputation ?? 100,
    total_orders: row.total_orders ?? 0,
    status: row.is_frozen ? 'frozen' : 'active',
    joinDate: row.created_at
      ? new Date(row.created_at).toLocaleDateString('en-GB')
      : '—',
    referral_code: row.referral_code ?? '—',
    is_frozen: row.is_frozen ?? false,
  }));
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data as UserProfile;
}

export async function updateWalletBalance(
  userId: string,
  amount: number,
  type: 'add' | 'deduct',
  note: string
): Promise<void> {
  const supabase = createClient();
  const { data: profile, error: fetchError } = await supabase
    .from('user_profiles')
    .select('wallet_balance')
    .eq('id', userId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const currentBalance = profile?.wallet_balance ?? 0;
  const newBalance =
    type === 'add' ? currentBalance + amount : currentBalance - amount;

  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ wallet_balance: newBalance })
    .eq('id', userId);

  if (updateError) throw new Error(updateError.message);
}

export async function updateReputation(
  userId: string,
  reputation: number
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('user_profiles')
    .update({ reputation })
    .eq('id', userId);

  if (error) throw new Error(error.message);
}

export async function toggleFreezeUser(
  userId: string,
  freeze: boolean
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('user_profiles')
    .update({ is_frozen: freeze })
    .eq('id', userId);

  if (error) throw new Error(error.message);
}

export async function fetchWalletLogs(): Promise<WalletLog[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('wallet_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as WalletLog[];
}
