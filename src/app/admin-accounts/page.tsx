import AppLayout from '@/components/AppLayout';
import AdminAccountsClient from './components/AdminAccountsClient';

export default function AdminAccountsPage() {
  return (
    <AppLayout isAdmin={true}>
      <AdminAccountsClient />
    </AppLayout>
  );
}
