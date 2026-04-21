'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import AppLayout from '@/components/AppLayout';
import Icon from '@/components/ui/AppIcon';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { BANK_OPTIONS } from '@/constants/banks';

// ─── Types ────────────────────────────────────────────────────────────────────
interface WithdrawalHistoryItem {
  id: string;
  amount: number;
  bankName: string;
  accountNo: string;
  status: string;
  requestedAt: string;
}

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

const DEFAULT_LOW_REP_MSG =
  '由于您的账户信誉评分低于80分，当前提款功能已被系统暂时限制。如需恢复提款权限，请联系相关部门进行审核处理。';

type Step = 'form' | 'review' | 'submitted';

export default function WalletWithdrawalClient() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const supabase = createClient();

  const [step, setStep] = useState<Step>('form');
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<WithdrawalHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [reputation, setReputation] = useState<number>(100);
  const [lowRepMsg, setLowRepMsg] = useState<string>(DEFAULT_LOW_REP_MSG);
  const [showLowRepModal, setShowLowRepModal] = useState(false);

  // Load user wallet balance, reputation, withdrawal history, and admin low-rep message
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoadingHistory(true);
      try {
        const [profileRes, historyRes, settingRes] = await Promise.all([
          supabase.from('user_profiles').select('wallet_balance, reputation').eq('id', user.id).single(),
          supabase
            .from('withdrawal_requests')
            .select('*')
            .eq('user_id', user.id)
            .order('requested_at', { ascending: false })
            .limit(10),
          supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'low_rep_withdrawal_message')
            .maybeSingle(),
        ]);
        if (profileRes.data) {
          setWalletBalance(profileRes.data.wallet_balance ?? 0);
          setReputation(profileRes.data.reputation ?? 100);
        }
        if (settingRes.data?.value) {
          setLowRepMsg(settingRes.data.value);
        }
        setHistory(
          (historyRes.data ?? []).map((row: any) => ({
            id: row.id,
            amount: row.amount ?? 0,
            bankName: row.bank_name ?? '—',
            accountNo: row.account_no ?? '—',
            status: row.status ?? 'pending',
            requestedAt: row.requested_at ?? '',
          }))
        );
      } catch {
        // silently fail
      } finally {
        setLoadingHistory(false);
      }
    };
    load();
  }, [user, step]);

  const validate = () => {
    const errs: Record<string, string> = {};
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed < 50) errs.amount = t('withdraw.amountRequired');
    if (walletBalance !== null && parsed > walletBalance) errs.amount = t('withdraw.insufficientBalance');
    if (!bankName) errs.bankName = t('withdraw.bankRequired');
    if (!accountNo.trim()) errs.accountNo = t('withdraw.accountNoRequired');
    if (!accountHolder.trim()) errs.accountHolder = t('withdraw.accountHolderRequired');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) setStep('review');
  };

  const handleSubmit = async () => {
    if (!user) { toast.error('Please log in to submit a withdrawal request'); return; }

    // Block if reputation < 80
    if (reputation < 80) {
      setShowLowRepModal(true);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user.id,
          amount: parseFloat(amount),
          bank_name: bankName,
          account_no: accountNo.trim(),
          account_holder: accountHolder.trim(),
          notes: notes.trim() || null,
          status: 'pending',
        });
      if (error) throw error;
      setStep('submitted');
      toast.success('Withdrawal request submitted successfully!');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to submit withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep('form');
    setAmount('');
    setBankName('');
    setAccountNo('');
    setAccountHolder('');
    setNotes('');
    setErrors({});
  };

  const statusColor = (status: string) => {
    if (status === 'approved') return 'bg-green-100 text-green-700';
    if (status === 'pending') return 'bg-amber-100 text-amber-700';
    if (status === 'rejected') return 'bg-red-100 text-red-600';
    return 'bg-gray-100 text-gray-600';
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = { approved: 'Approved', pending: 'Pending', rejected: 'Rejected' };
    return map[status] ?? status;
  };

  return (
    <AppLayout isAdmin={false}>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Wallet Withdrawal</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            Submit a withdrawal request — admin will review and process your payment
          </p>
        </div>

        {/* Wallet balance banner */}
        {walletBalance !== null && (
          <div className="flex items-center gap-3 bg-primary-50 border border-primary-200 rounded-2xl px-5 py-4">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Icon name="WalletIcon" size={20} className="text-primary-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary-500 uppercase tracking-wide">Available Balance</p>
              <p className="text-2xl font-bold font-mono text-primary-700">
                RM {walletBalance.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {(['form', 'review', 'submitted'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-1.5 ${step === s ? 'text-primary-600' : step === 'submitted' || (step === 'review' && i === 0) ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step === s ? 'border-primary-500 bg-primary-50 text-primary-600' : step === 'submitted' || (step === 'review' && i === 0) ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-300 bg-white text-gray-400'}`}>
                  {(step === 'submitted' || (step === 'review' && i === 0)) && s !== step ? (
                    <Icon name="CheckIcon" size={12} />
                  ) : (
                    i + 1
                  )}
                </div>
                <span className="text-xs font-semibold hidden sm:block">
                  {s === 'form' ? 'Details' : s === 'review' ? 'Review' : 'Done'}
                </span>
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 rounded-full ${(step === 'review' && i === 0) || step === 'submitted' ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* ── Step 1: Form ── */}
        {step === 'form' && (
          <form onSubmit={handleContinue} className="space-y-5">
            {/* Amount */}
            <div className="card-elevated p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                  <Icon name="ArrowUpTrayIcon" size={16} className="text-red-500" />
                </div>
                <h2 className="text-sm font-bold text-gray-700">Withdrawal Amount</h2>
              </div>
              <div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">RM</span>
                  <input
                    type="number"
                    min="50"
                    step="1"
                    value={amount}
                    onChange={e => { setAmount(e.target.value); setErrors(prev => ({ ...prev, amount: '' })); }}
                    placeholder="0.00"
                    className={`w-full pl-12 pr-4 py-3.5 border rounded-xl text-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${errors.amount ? 'border-red-400' : 'border-[hsl(var(--border))]'}`}
                  />
                </div>
                {errors.amount && <p className="text-xs text-red-500 mt-1.5">{errors.amount}</p>}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => { setAmount(String(amt)); setErrors(prev => ({ ...prev, amount: '' })); }}
                    className={`py-2 text-sm font-semibold rounded-xl border transition-all ${amount === String(amt) ? 'bg-primary-500 text-white border-primary-500' : 'border-[hsl(var(--border))] hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700'}`}
                  >
                    RM {amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Bank Details */}
            <div className="card-elevated p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Icon name="BuildingLibraryIcon" size={16} className="text-blue-600" />
                </div>
                <h2 className="text-sm font-bold text-gray-700">Bank Details</h2>
              </div>

              {/* Bank selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Bank Name</label>
                <select
                  value={bankName}
                  onChange={e => { setBankName(e.target.value); setErrors(prev => ({ ...prev, bankName: '' })); }}
                  className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white ${errors.bankName ? 'border-red-400' : 'border-[hsl(var(--border))]'}`}
                >
                  <option value="">Select your bank</option>
                  {BANK_OPTIONS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                {errors.bankName && <p className="text-xs text-red-500 mt-1.5">{errors.bankName}</p>}
              </div>

              {/* Account number */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Account Number</label>
                <input
                  type="text"
                  value={accountNo}
                  onChange={e => { setAccountNo(e.target.value); setErrors(prev => ({ ...prev, accountNo: '' })); }}
                  placeholder="e.g. 1234567890"
                  className={`w-full px-4 py-3 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${errors.accountNo ? 'border-red-400' : 'border-[hsl(var(--border))]'}`}
                />
                {errors.accountNo && <p className="text-xs text-red-500 mt-1.5">{errors.accountNo}</p>}
              </div>

              {/* Account holder */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Account Holder Name</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={e => { setAccountHolder(e.target.value); setErrors(prev => ({ ...prev, accountHolder: '' })); }}
                  placeholder="Full name as per bank account"
                  className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${errors.accountHolder ? 'border-red-400' : 'border-[hsl(var(--border))]'}`}
                />
                {errors.accountHolder && <p className="text-xs text-red-500 mt-1.5">{errors.accountHolder}</p>}
              </div>

              {/* Notes (optional) */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes <span className="font-normal text-gray-400">(optional)</span></label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any additional notes for admin..."
                  rows={2}
                  className="w-full px-4 py-3 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full btn-primary py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2"
            >
              Review Request
              <Icon name="ArrowRightIcon" size={16} />
            </button>
          </form>
        )}

        {/* ── Step 2: Review ── */}
        {step === 'review' && (
          <div className="space-y-5">
            <div className="card-elevated p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Icon name="ClipboardDocumentCheckIcon" size={16} className="text-amber-600" />
                </div>
                <h2 className="text-sm font-bold text-gray-700">Review Your Request</h2>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium">Withdrawal Amount</span>
                  <span className="font-mono font-bold text-lg text-gray-800">RM {parseFloat(amount).toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t border-[hsl(var(--border))]" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium">Bank</span>
                  <span className="text-sm font-semibold text-gray-800">{bankName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium">Account Number</span>
                  <span className="text-sm font-mono font-semibold text-gray-800">{accountNo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium">Account Holder</span>
                  <span className="text-sm font-semibold text-gray-800">{accountHolder}</span>
                </div>
                {notes && (
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium flex-shrink-0">Notes</span>
                    <span className="text-sm text-gray-700 text-right">{notes}</span>
                  </div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
                <Icon name="InformationCircleIcon" size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Your request will be reviewed by admin. Processing typically takes 1–3 business days.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('form')}
                className="flex-1 py-3.5 rounded-xl border border-[hsl(var(--border))] font-semibold text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 btn-primary py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
                ) : (
                  <><Icon name="PaperAirplaneIcon" size={16} /> Submit Request</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Submitted ── */}
        {step === 'submitted' && (
          <div className="card-elevated p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Icon name="CheckCircleIcon" size={32} className="text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Request Submitted!</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                Your withdrawal request of <span className="font-bold text-gray-700">RM {parseFloat(amount).toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</span> has been sent to admin for review.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[hsl(var(--muted-foreground))]">Bank</span>
                <span className="font-semibold text-gray-800">{bankName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[hsl(var(--muted-foreground))]">Account</span>
                <span className="font-mono font-semibold text-gray-800">{accountNo}</span>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="w-full btn-primary py-3 rounded-xl font-semibold text-sm"
            >
              New Withdrawal Request
            </button>
          </div>
        )}

        {/* ── Withdrawal History ── */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-700">Recent Requests</h2>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="card-elevated p-8 text-center">
              <Icon name="BanknotesIcon" size={36} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No withdrawal requests yet</p>
            </div>
          ) : (
            history.map(item => (
              <div key={item.id} className="card-elevated p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.status === 'approved' ? 'bg-green-50' : item.status === 'rejected' ? 'bg-red-50' : 'bg-amber-50'}`}>
                  <Icon
                    name={item.status === 'approved' ? 'CheckCircleIcon' : item.status === 'rejected' ? 'XCircleIcon' : 'ClockIcon'}
                    size={18}
                    className={item.status === 'approved' ? 'text-green-500' : item.status === 'rejected' ? 'text-red-500' : 'text-amber-500'}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{item.bankName} · {item.accountNo}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {item.requestedAt ? new Date(item.requestedAt).toLocaleDateString('en-MY') : '—'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 space-y-1">
                  <p className="font-mono font-bold text-gray-800 text-sm">RM {item.amount.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(item.status)}`}>
                    {statusLabel(item.status)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Low Reputation Block Modal ── */}
      {showLowRepModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Icon name="ShieldExclamationIcon" size={32} className="text-red-500" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-3">提款功能受限</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">{lowRepMsg}</p>
            <button
              onClick={() => setShowLowRepModal(false)}
              className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
