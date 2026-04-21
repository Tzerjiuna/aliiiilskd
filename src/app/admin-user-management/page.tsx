import AppLayout from '@/components/AppLayout';
import AdminUserManagementClient from './components/AdminUserManagementClient';

export default function AdminUserManagementPage() {
  return (
    <AppLayout isAdmin={true}>
      <AdminUserManagementClient />
    </AppLayout>
  );
}