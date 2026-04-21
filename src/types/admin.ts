// ─── Admin Types ──────────────────────────────────────────────────────────────

export interface BonusTemplate {
  id: string;
  hotel: string;
  amount: number;
  commission: number;
}

export interface InternalMessage {
  id: string;
  fromUserId: string;
  toUserId: string;
  subject: string;
  body: string;
  sentAt: string;
  read: boolean;
}

export interface AnalyticsStats {
  totalUsers: number;
  totalRevenue: number;
  totalBookings: number;
  activeUsers: number;
}

// ─── Form Types ───────────────────────────────────────────────────────────────

export type WalletForm = {
  amount: string;
  note: string;
  type: 'add' | 'deduct';
};

export type RepForm = {
  reputation: string;
  reason: string;
};

export type BonusTemplateForm = {
  hotel: string;
  amount: string;
  commission: string;
};

export type BankInfoForm = {
  bankName: string;
  accountNo: string;
  accountName: string;
  note: string;
};

export type CommissionForm = {
  rate: string;
};

export type AddAdminForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'super_admin' | 'admin';
};
