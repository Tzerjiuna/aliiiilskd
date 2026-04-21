// ─── App Routes ───────────────────────────────────────────────────────────────

export const ROUTES = {
  // Public
  LOGIN: '/sign-up-login-screen',
  AUTH_CALLBACK: '/auth/callback',

  // User
  DASHBOARD: '/user-dashboard',
  HOTEL_BOOKING: '/hotel-booking',
  PAST_BOOKINGS: '/past-bookings',
  WITHDRAWAL_TRACKER: '/withdrawal-tracker',
  WALLET_TOPUP: '/wallet-topup',
  WALLET_WITHDRAWAL: '/wallet-withdrawal',

  // Admin
  ADMIN_USER_MANAGEMENT: '/admin-user-management',
  ADMIN_FINANCE: '/admin-finance-management',
  ADMIN_HOTEL_MANAGEMENT: '/admin-hotel-management',
  ADMIN_HOTEL_IMPORT: '/admin-hotel-import',
  ADMIN_ACCOUNTS: '/admin-accounts',
  ADMIN_MESSAGES: '/admin-messages',
  ADMIN_ANALYTICS: '/admin-analytics',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
