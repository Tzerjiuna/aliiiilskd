import AppLayout from '@/components/AppLayout';
import AdminAnalyticsClient from './components/AdminAnalyticsClient';

export default function AdminAnalyticsPage() {
  return (
    <AppLayout isAdmin={true}>
      <AdminAnalyticsClient />
    </AppLayout>
  );
}
