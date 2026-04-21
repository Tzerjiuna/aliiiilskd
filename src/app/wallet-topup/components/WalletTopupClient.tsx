'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { BANK_OPTIONS } from '@/constants/banks';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TopupHistoryItem {
  id: string;
  amount: number;
  method: string;
  reference: string;
  status: string;
  submittedAt: string;
}

const PAYMENT_METHODS = [
  { id: 'bank_transfer', label: 'Bank Transfer', icon: 'BuildingLibraryIcon', desc: 'Transfer via online banking' },
  { id: 'tng', label: 'Touch \'n Go', icon: 'DevicePhoneMobileIcon', desc: 'TNG eWallet transfer' },
  { id: 'boost', label: 'Boost', icon: 'BoltIcon', desc: 'Boost eWallet transfer' },
  { id: 'grabpay', label: 'GrabPay', icon: 'CreditCardIcon', desc: 'GrabPay wallet transfer' },
];

const QUICK_AMOUNTS = [50, 100, 300, 500, 1000, 2000];

type Step = 'form' | 'review' | 'submitted';

export default function WalletTopupClient() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const supabase = createClient();

  const [step, setStep] = useState<Step>('form');
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('bank_transfer');
  const [selectedBank, setSelectedBank] = useState('');
  const [reference, setReference] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<TopupHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // Load user's top-up history
  useEffect(() => {
    if (!user) return;
    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const { data, error } = await supabase
          .from('topup_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false })
          .limit(10);
        if (error) throw error;
        setHistory(
          (data ?? []).map((row: any) => ({
            id: row.id,
            amount: row.amount ?? 0,
            method: row.method ?? '—',
            reference: row.reference ?? '—',
            status: row.status ?? 'pending',
            submittedAt: row.submitted_at ?? '',
          }))
        );
      } catch {
        // silently fail — history is non-critical
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [user, step]);

  const validate = () => {
    const errs: Record<string, string> = {};
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed < 10) errs.amount = t('topup.amountError');
    if (!selectedMethod) errs.method = t('topup.methodError');
    if (selectedMethod === 'bank_transfer' && !selectedBank) errs.bank = t('topup.bankError');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) setStep('review');
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!user) { toast.error('Please log in to submit a top-up request'); return; }
    setSubmitting(true);
    try {
      let receiptUrl: string | null = null;

      // Upload receipt if provided
      if (receiptFile) {
        const ext = receiptFile.name.split('.').pop();
        const path = `topup-receipts/${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('hotel-images')
          .upload(path, receiptFile, { upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('hotel-images').getPublicUrl(path);
          receiptUrl = urlData.publicUrl;
        }
      }

      const methodLabel = PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label ?? selectedMethod;
      const methodFull = selectedMethod === 'bank_transfer' && selectedBank
        ? `${methodLabel} — ${selectedBank}`
        : methodLabel;

      const { data, error } = await supabase
        .from('topup_requests')
        .insert({
          user_id: user.id,
          amount: parseFloat(amount),
          method: methodFull,
          reference: reference.trim() || null,
          receipt_url: receiptUrl,
          status: 'pending',
        })
        .select('id')
        .single();

      if (error) throw error;
      setSubmittedId(data?.id ?? null);
      setStep('submitted');
      toast.success(t('topup.successTitle'));
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to submit top-up request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep('form');
    setAmount('');
    setSelectedMethod('bank_transfer');
    setSelectedBank('');
    setReference('');
    setReceiptFile(null);
    setReceiptPreview(null);
    setErrors({});
    setSubmittedId(null);
  };

  const statusColor = (status: string) => {
    if (status === 'approved') return 'bg-green-100 text-green-700';
    if (status === 'pending') return 'bg-amber-100 text-amber-700';
    if (status === 'rejected') return 'bg-red-100 text-red-600';
    return 'bg-gray-100 text-gray-600';
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      approved: t('topup.statusApproved'),
      pending: t('topup.statusPending'),
      rejected: t('topup.statusRejected'),
    };
    return map[status] ?? status;
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t('topup.title')}</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
          {t('topup.subtitle')}
        </p>
      </div>

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
                {s === 'form' ? t('topup.stepDetails') : s === 'review' ? t('topup.stepReview') : t('topup.stepDone')}
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
              <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
                <Icon name="CurrencyDollarIcon" size={16} className="text-green-600" />
              </div>
              <h2 className="text-sm font-bold text-gray-700">{t('topup.amountTitle')}</h2>
            </div>
            <div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">RM</span>
                <input
                  type="number"
                  min="10"
                  step="1"
                  value={amount}
                  onChange={e => { setAmount(e.target.value); setErrors(prev => ({ ...prev, amount: '' })); }}
                  placeholder={t('topup.amountPlaceholder')}
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

          {/* Payment Method */}
          <div className="card-elevated p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                <Icon name="CreditCardIcon" size={16} className="text-blue-600" />
              </div>
              <h2 className="text-sm font-bold text-gray-700">{t('topup.methodTitle')}</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(method => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => { setSelectedMethod(method.id); setErrors(prev => ({ ...prev, method: '' })); }}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${selectedMethod === method.id ? 'border-primary-500 bg-primary-50' : 'border-[hsl(var(--border))] hover:border-primary-300 hover:bg-gray-50'}`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedMethod === method.id ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Icon name={method.icon as any} size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className={`text-sm font-semibold truncate ${selectedMethod === method.id ? 'text-primary-700' : 'text-gray-700'}`}>{method.label}</div>
                    <div className="text-[11px] text-gray-400 truncate">{method.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            {errors.method && <p className="text-xs text-red-500">{errors.method}</p>}

            {/* Bank selector for bank transfer */}
            {selectedMethod === 'bank_transfer' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('topup.selectBank')}</label>
                <select
                  value={selectedBank}
                  onChange={e => { setSelectedBank(e.target.value); setErrors(prev => ({ ...prev, bank: '' })); }}
                  className={`w-full px-4 py-3 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${errors.bank ? 'border-red-400' : 'border-[hsl(var(--border))]'}`}
                >
                  <option value="">{t('topup.selectBankPlaceholder')}</option>
                  {BANK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                {errors.bank && <p className="text-xs text-red-500 mt-1">{errors.bank}</p>}
              </div>
            )}
          </div>

          {/* Reference (optional) */}
          <div className="card-elevated p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <Icon name="DocumentTextIcon" size={16} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-700">{t('topup.referenceTitle')} <span className="text-gray-400 font-normal">{t('topup.referenceOptional')}</span></h2>
              </div>
            </div>
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder={t('topup.referencePlaceholder')}
              className="w-full px-4 py-3 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
          </div>

          {/* Receipt upload (optional) */}
          <div className="card-elevated p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                <Icon name="PhotoIcon" size={16} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-700">{t('topup.receiptTitle')} <span className="text-gray-400 font-normal">{t('topup.receiptOptional')}</span></h2>
              </div>
            </div>
            <label className="block cursor-pointer">
              <input type="file" accept="image/*,application/pdf" onChange={handleReceiptChange} className="hidden" />
              {receiptPreview ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-primary-400">
                  <img src={receiptPreview} alt="Receipt preview" className="w-full h-36 object-cover" />
                  <div className="absolute top-2 right-2 bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                    <Icon name="CheckIcon" size={10} /> {t('topup.receiptUploaded')}
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-[hsl(var(--border))] rounded-xl p-6 text-center hover:border-primary-400 hover:bg-primary-50/50 transition-colors">
                  <Icon name="ArrowUpTrayIcon" size={24} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-600">{t('topup.receiptClickUpload')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('topup.receiptFormats')}</p>
                </div>
              )}
            </label>
          </div>

          <button type="submit" className="w-full btn-primary py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
            <Icon name="ArrowRightIcon" size={16} />
            {t('topup.continueBtn')}
          </button>
        </form>
      )}

      {/* ── Step 2: Review ── */}
      {step === 'review' && (
        <div className="space-y-5">
          <div className="card-elevated p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center">
                <Icon name="ClipboardDocumentCheckIcon" size={16} className="text-primary-600" />
              </div>
              <h2 className="text-sm font-bold text-gray-700">{t('topup.reviewTitle')}</h2>
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-center">
              <div className="text-xs text-primary-600 font-semibold mb-1">{t('topup.reviewAmountLabel')}</div>
              <div className="text-3xl font-bold font-mono text-primary-700">RM {parseFloat(amount).toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-[hsl(var(--border))]">
                <span className="text-gray-500">{t('topup.reviewMethodLabel')}</span>
                <span className="font-semibold text-gray-800">
                  {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label}
                  {selectedMethod === 'bank_transfer' && selectedBank ? ` — ${selectedBank}` : ''}
                </span>
              </div>
              {reference && (
                <div className="flex justify-between py-2 border-b border-[hsl(var(--border))]">
                  <span className="text-gray-500">{t('topup.reviewReferenceLabel')}</span>
                  <span className="font-mono font-semibold text-gray-800">{reference}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-[hsl(var(--border))]">
                <span className="text-gray-500">{t('topup.reviewReceiptLabel')}</span>
                <span className={`font-semibold ${receiptFile ? 'text-green-600' : 'text-gray-400'}`}>
                  {receiptFile ? receiptFile.name : t('topup.reviewReceiptNone')}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">{t('topup.reviewStatusLabel')}</span>
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{t('topup.reviewStatusPending')}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <Icon name="InformationCircleIcon" size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">{t('topup.reviewInfoMsg')}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('form')}
              className="flex-1 py-3 rounded-xl border border-[hsl(var(--border))] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="ArrowLeftIcon" size={14} />
              {t('topup.backBtn')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 btn-primary py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t('topup.submittingBtn')}</>
              ) : (
                <><Icon name="PaperAirplaneIcon" size={14} /> {t('topup.submitBtn')}</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Submitted ── */}
      {step === 'submitted' && (
        <div className="card-elevated p-8 text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <Icon name="CheckCircleIcon" size={44} className="text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">{t('topup.successTitle')}</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              {t('topup.successDesc')} <span className="font-bold text-primary-600">RM {parseFloat(amount).toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</span> {t('topup.successDescSuffix')}
            </p>
          </div>
          {submittedId && (
            <div className="bg-gray-50 border border-[hsl(var(--border))] rounded-xl px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">{t('topup.requestIdLabel')}</p>
              <p className="font-mono text-xs text-gray-600 break-all">{submittedId}</p>
            </div>
          )}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-700 font-medium">{t('topup.pendingNotice')}</p>
          </div>
          <button onClick={handleReset} className="w-full btn-primary py-3 rounded-xl font-bold text-sm">
            {t('topup.submitAnotherBtn')}
          </button>
        </div>
      )}

      {/* ── History ── */}
      <div className="card-elevated overflow-hidden">
        <div className="px-5 py-4 border-b border-[hsl(var(--border))] flex items-center gap-2">
          <Icon name="ClockIcon" size={16} className="text-gray-500" />
          <h3 className="text-sm font-bold text-gray-700">{t('topup.historyTitle')}</h3>
        </div>
        {loadingHistory ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Icon name="InboxIcon" size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">{t('topup.historyEmpty')}</p>
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--border))]">
            {history.map(item => (
              <div key={item.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <Icon name="ArrowDownTrayIcon" size={16} className="text-primary-500" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800 font-mono">RM {item.amount.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</div>
                    <div className="text-xs text-gray-400">{item.method} · {new Date(item.submittedAt).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColor(item.status)}`}>
                  {statusLabel(item.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
