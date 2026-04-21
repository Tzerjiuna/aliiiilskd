// ─── Finance Types ────────────────────────────────────────────────────────────

export interface TopupRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  method: string;
  reference: string;
  status: string;
  submittedAt: string;
  receipt: string;
  bankInfo: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  bankName: string;
  accountNo: string;
  reputation: number;
  status: string;
  requestedAt: string;
}

export interface FinanceChartEntry {
  date: string;
  topup: number;
  withdrawal: number;
  commission: number;
}

export interface BankInfo {
  bankName: string;
  accountNo: string;
  accountName: string;
  note: string;
}

export interface WithdrawalTrackerEntry {
  id: string;
  amount: number;
  status: 'approved' | 'processing' | 'pending' | 'rejected';
  submittedDate: string;
  approvalDate?: string;
  bankName: string;
  accountNo: string;
  accountHolder: string;
  referenceNo?: string;
  remarks?: string;
}
