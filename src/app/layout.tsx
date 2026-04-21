import React from 'react';
import type { Metadata, Viewport } from 'next';
import '../styles/tailwind.css';
import { Toaster } from 'sonner';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'IslamicBooking Pro — Platform Tempahan Hotel Halal Premium',
  description: 'Platform tempahan hotel halal bersertifikasi dengan sistem komisen, dompet digital, dan pengurusan pesanan lengkap untuk ahli berdaftar.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ms">
      <body>
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: '14px',
            },
          }}
        />
</body>
    </html>
  );
}