import AppLayout from '@/components/AppLayout';
import HotelBookingClient from './components/HotelBookingClient';

export default function HotelBookingPage() {
  return (
    <AppLayout isAdmin={false}>
      <HotelBookingClient />
    </AppLayout>
  );
}