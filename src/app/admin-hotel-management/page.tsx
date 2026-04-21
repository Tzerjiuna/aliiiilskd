import AppLayout from '@/components/AppLayout';
import AdminHotelClient from './components/AdminHotelClient';

export default function AdminHotelManagementPage() {
  return (
    <AppLayout isAdmin={true}>
      <AdminHotelClient />
    </AppLayout>
  );
}