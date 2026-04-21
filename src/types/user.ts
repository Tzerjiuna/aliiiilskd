// ─── User Types ───────────────────────────────────────────────────────────────

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  level: number;
  wallet_balance: number;
  reputation: number;
  total_orders: number;
  status: string;
  joinDate: string;
  referral_code: string;
  is_frozen: boolean;
}

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin';
  createdAt: string;
  status: 'active' | 'inactive';
}

export interface WalletHistoryEntry {
  date: string;
  balance: number;
}

export interface CommissionEntry {
  day: string;
  commission: number;
}

export interface LiveFeedItem {
  id: string;
  msg: string;
  time: string;
  icon: string;
}

export interface Task {
  id: string;
  title: string;
  progress: number;
  total: number;
  reward: string;
  done: boolean;
}

export interface WalletLog {
  id: string;
  userId: string;
  userName: string;
  log_type: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

function RecentOrder(...args: any[]): any {
  // eslint-disable-next-line no-console
  console.warn('Placeholder: RecentOrder is not implemented yet.', args);
  return null;
}

export { RecentOrder };