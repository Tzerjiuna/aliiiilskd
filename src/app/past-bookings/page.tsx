import React, { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import PastBookingsClient from './components/PastBookingsClient';

export default function PastBookingsPage() {
  return (
    <AppLayout>
      <Suspense fallback={null}>
        <PastBookingsClient />
      </Suspense>
    </AppLayout>
  );
}
