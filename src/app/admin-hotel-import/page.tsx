'use server';
import { createClient } from '@/lib/supabase/server';
import AdminHotelImportClient from './components/AdminHotelImportClient';
import AppLayout from '@/components/AppLayout';

export default async function AdminHotelImportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase?.auth?.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase?.from('user_profiles')?.select('role')?.eq('id', user?.id)?.single();
    isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  }

  return (
    <AppLayout isAdmin={isAdmin}>
      <AdminHotelImportClient />
    </AppLayout>
  );
}
