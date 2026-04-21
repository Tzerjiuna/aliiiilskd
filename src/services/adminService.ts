import { createClient } from '@/lib/supabase/client';
import type { AdminAccount } from '@/types/user';
import type { AddAdminForm } from '@/types/admin';

// ─── Admin Service ────────────────────────────────────────────────────────────

export async function fetchAdmins(): Promise<AdminAccount[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, role, is_active, created_at')
    .in('role', ['admin', 'super_admin'])
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.full_name ?? row.email ?? '—',
    email: row.email ?? '—',
    role: row.role as 'super_admin' | 'admin',
    createdAt: row.created_at
      ? new Date(row.created_at).toLocaleDateString('en-GB')
      : '—',
    status: row.is_active ? 'active' : 'inactive',
  }));
}

export async function createAdmin(form: AddAdminForm): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: form.email,
    password: form.password,
    options: { data: { full_name: form.name } },
  });

  if (error) throw new Error(error.message);

  if (data?.user) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({ id: data.user.id, full_name: form.name, role: form.role });

    if (profileError) throw new Error(profileError.message);
  }
}

export async function updateAdminRole(
  id: string,
  role: 'admin' | 'super_admin'
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('user_profiles')
    .update({ role })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function toggleAdminStatus(
  id: string,
  isActive: boolean
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('user_profiles')
    .update({ is_active: isActive })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function demoteAdmin(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('user_profiles')
    .update({ role: 'user' })
    .eq('id', id);
  if (error) throw new Error(error.message);
}
