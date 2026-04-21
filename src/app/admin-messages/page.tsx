'use client';
import AppLayout from '@/components/AppLayout';
import AdminMessagesClient from './components/AdminMessagesClient';

export default function AdminMessagesPage() {
  return (
    <AppLayout isAdmin={true}>
      <AdminMessagesClient />
    </AppLayout>
  );
}
