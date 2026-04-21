import AppLayout from '@/components/AppLayout';
import UserDashboardClient from './components/UserDashboardClient';

export default function UserDashboardPage() {
  return (
    <AppLayout isAdmin={false}>
      <UserDashboardClient />
    </AppLayout>
  );
}