import AppLayout from '@/components/AppLayout';
import AdminFinanceClient from './components/AdminFinanceClient';

export default function AdminFinanceManagementPage() {
  return (
    <AppLayout isAdmin={true}>
      <AdminFinanceClient />
    </AppLayout>
  );
}