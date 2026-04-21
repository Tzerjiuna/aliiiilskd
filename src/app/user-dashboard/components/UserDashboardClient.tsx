'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '@/context/LanguageContext';
import { MALAYSIA_BANKS, BANK_OPTIONS } from '@/constants/banks';
import type { WalletHistoryEntry, CommissionEntry, RecentOrder, LiveFeedItem, Task } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';

// ─── Virtual live feed data ───────────────────────────────────────────────────
const VIRTUAL_FEED_ITEMS: LiveFeedItem[] = [
  { id: 'vf-1',  icon: '🏨', msg: 'Ahmad R. 完成了 Grand Hyatt KL 的预订，获得 RM 45 佣金', time: '刚刚' },
  { id: 'vf-2',  icon: '💰', msg: 'Siti N. 成功提现 RM 320 到 Maybank 账户', time: '刚刚' },
  { id: 'vf-3',  icon: '⭐', msg: 'Raj K. 信誉分提升至 95，达到 VIP 等级', time: '刚刚' },
  { id: 'vf-4',  icon: '🏨', msg: 'Nurul A. 完成了 Mandarin Oriental 的预订，获得 RM 62 佣金', time: '刚刚' },
  { id: 'vf-5',  icon: '💎', msg: 'Hafiz M. 升级至 Level 3，解锁更高佣金率', time: '刚刚' },
  { id: 'vf-6',  icon: '🏨', msg: 'Lim W. 完成了 Shangri-La Hotel 的预订，获得 RM 38 佣金', time: '刚刚' },
  { id: 'vf-7',  icon: '💰', msg: 'Farah Z. 成功提现 RM 500 到 CIMB 账户', time: '刚刚' },
  { id: 'vf-8',  icon: '🎁', msg: 'Azman B. 收到福利订单奖励 RM 150', time: '刚刚' },
  { id: 'vf-9',  icon: '🏨', msg: 'Mei L. 完成了 The Ritz-Carlton KL 的预订，获得 RM 78 佣金', time: '刚刚' },
  { id: 'vf-10', icon: '⭐', msg: 'Zulkifli H. 信誉分恢复至 88，账户状态正常', time: '刚刚' },
  { id: 'vf-11', icon: '💰', msg: 'Priya S. 成功提现 RM 280 到 Public Bank 账户', time: '刚刚' },
  { id: 'vf-12', icon: '🏨', msg: 'Kamal A. 完成了 InterContinental KL 的预订，获得 RM 55 佣金', time: '刚刚' },
  { id: 'vf-13', icon: '💎', msg: 'Nadia R. 升级至 Level 2，每日订单上限提升', time: '刚刚' },
  { id: 'vf-14', icon: '🎁', msg: 'Ismail T. 收到福利订单奖励 RM 200', time: '刚刚' },
  { id: 'vf-15', icon: '🏨', msg: 'Tan S. 完成了 W Hotel KL 的预订，获得 RM 42 佣金', time: '刚刚' },
  { id: 'vf-16', icon: '💰', msg: 'Rohani M. 成功提现 RM 450 到 RHB 账户', time: '刚刚' },
  { id: 'vf-17', icon: '🏨', msg: 'Deepa K. 完成了 Four Seasons KL 的预订，获得 RM 91 佣金', time: '刚刚' },
  { id: 'vf-18', icon: '⭐', msg: 'Fadzil N. 信誉分提升至 92，解锁快速提现功能', time: '刚刚' },
  { id: 'vf-19', icon: '🏨', msg: 'Chong W. 完成了 Hilton KL 的预订，获得 RM 33 佣金', time: '刚刚' },
  { id: 'vf-20', icon: '💰', msg: 'Suraya A. 成功提现 RM 600 到 Hong Leong 账户', time: '刚刚' },
  { id: 'vf-21', icon: '🎁', msg: 'Rizal H. 收到福利订单奖励 RM 120', time: '刚刚' },
  { id: 'vf-22', icon: '🏨', msg: 'Kavitha R. 完成了 Westin KL 的预订，获得 RM 47 佣金', time: '刚刚' },
  { id: 'vf-23', icon: '💎', msg: 'Mohd F. 升级至 Level 4，成为平台精英会员', time: '刚刚' },
  { id: 'vf-24', icon: '🏨', msg: 'Yong L. 完成了 Le Méridien KL 的预订，获得 RM 58 佣金', time: '刚刚' },
  { id: 'vf-25', icon: '💰', msg: 'Haslinda M. 成功提现 RM 380 到 AmBank 账户', time: '刚刚' },
  { id: 'vf-26', icon: '⭐', msg: 'Suresh P. 信誉分提升至 97，达到平台最高等级', time: '刚刚' },
  { id: 'vf-27', icon: '🏨', msg: 'Noraini Z. 完成了 Pullman KL 的预订，获得 RM 36 佣金', time: '刚刚' },
  { id: 'vf-28', icon: '🎁', msg: 'Azrul K. 收到福利订单奖励 RM 175', time: '刚刚' },
  { id: 'vf-29', icon: '🏨', msg: 'Ling H. 完成了 Aloft KL 的预订，获得 RM 29 佣金', time: '刚刚' },
  { id: 'vf-30', icon: '💰', msg: 'Fatimah B. 成功提现 RM 250 到 BSN 账户', time: '刚刚' },
  { id: 'vf-31', icon: '🏨', msg: 'Rajan S. 完成了 Doubletree KL 的预订，获得 RM 51 佣金', time: '刚刚' },
  { id: 'vf-32', icon: '💎', msg: 'Zarina A. 升级至 Level 3，佣金率提升至 8%', time: '刚刚' },
  { id: 'vf-33', icon: '🏨', msg: 'Weng C. 完成了 Traders Hotel KL 的预订，获得 RM 44 佣金', time: '刚刚' },
  { id: 'vf-34', icon: '⭐', msg: 'Norhaida M. 信誉分提升至 89，账户升级成功', time: '刚刚' },
  { id: 'vf-35', icon: '💰', msg: 'Selvam K. 成功提现 RM 700 到 Maybank 账户', time: '刚刚' },
  { id: 'vf-36', icon: '🏨', msg: 'Amirah Z. 完成了 Sheraton KL 的预订，获得 RM 67 佣金', time: '刚刚' },
  { id: 'vf-37', icon: '💰', msg: 'Boon K. 成功提现 RM 410 到 CIMB 账户', time: '刚刚' },
  { id: 'vf-38', icon: '⭐', msg: 'Rashidah M. 信誉分提升至 93，解锁高级功能', time: '刚刚' },
  { id: 'vf-39', icon: '🏨', msg: 'Gopal S. 完成了 Marriott KL 的预订，获得 RM 72 佣金', time: '刚刚' },
  { id: 'vf-40', icon: '🎁', msg: 'Norzahra A. 收到福利订单奖励 RM 230', time: '刚刚' },
];

// ─── Dynamic time label helper ────────────────────────────────────────────────
function getDynamicTime(index: number, tickSeconds: number): string {
  const totalSeconds = (index * 7 + tickSeconds % 7);
  if (totalSeconds < 10) return '刚刚';
  if (totalSeconds < 60) return `${totalSeconds}秒前`;
  const mins = Math.floor(totalSeconds / 60);
  if (mins < 60) return `${mins}分钟前`;
  return `${Math.floor(mins / 60)}小时前`;
}

let sharedBankInfo: { bankName: string; accountNo: string; accountName: string; note: string } | null = null;

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[hsl(var(--border))] rounded-xl px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-gray-700">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }} className="font-mono font-bold">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// ─── TopUp Modal ──────────────────────────────────────────────────────────────
type TopUpStep = 'amount' | 'waiting' | 'bankInfo' | 'submitted';

function TopUpModal({ onClose, t }: { onClose: () => void; t: (key: string) => string }) {
  const [step, setStep] = useState<TopUpStep>('amount');
  const [amount, setAmount] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [bankInfo, setBankInfo] = useState<{ bankName: string; accountNo: string; accountName: string; note: string } | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (step !== 'waiting') return;
    const interval = setInterval(() => setCarouselIndex(prev => (prev + 1) % MALAYSIA_BANKS.length), 1200);
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (step !== 'waiting') return;
    pollingRef.current = setInterval(() => {
      if (sharedBankInfo) {
        setBankInfo(sharedBankInfo);
        sharedBankInfo = null;
        setStep('bankInfo');
        if (pollingRef.current) clearInterval(pollingRef.current);
      }
    }, 1500);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [step]);

  const visibleBanks = Array.from({ length: 4 }, (_, i) => MALAYSIA_BANKS[(carouselIndex + i) % MALAYSIA_BANKS.length]);

  return (
    <div className="modal-overlay fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
              <Icon name="ArrowDownTrayIcon" size={16} className="text-green-600" />
            </div>
            <h2 className="text-base font-bold text-gray-800">{t('topup.title')}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <Icon name="XMarkIcon" size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          {step === 'amount' && (
            <form onSubmit={e => { e.preventDefault(); if (!amount || parseFloat(amount) <= 0) return; setStep('waiting'); }} className="space-y-5">
              <div>
                <p className="text-sm text-gray-600 mb-4">{t('topup.enterAmountDesc')}</p>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('topup.depositAmount')}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">RM</span>
                  <input type="number" min="10" step="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full pl-12 pr-4 py-3 border border-[hsl(var(--border))] rounded-xl text-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-green-500/30" required />
                </div>
                <div className="flex gap-2 mt-3">
                  {[100, 300, 500, 1000].map(amt => (
                    <button key={amt} type="button" onClick={() => setAmount(String(amt))} className="flex-1 py-1.5 text-xs font-semibold border border-[hsl(var(--border))] rounded-lg hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors">RM {amt}</button>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full btn-primary py-3 rounded-xl font-bold text-sm">{t('topup.continue')}</button>
            </form>
          )}

          {step === 'waiting' && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-amber-50 border-4 border-amber-200 flex items-center justify-center mx-auto">
                <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-base mb-1">{t('topup.waitingTitle')}</h3>
                <p className="text-sm text-gray-500">{t('topup.waitingDesc')}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                  <span className="text-xs font-mono font-bold text-green-700">RM {parseFloat(amount).toLocaleString()}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-3 font-medium">{t('topup.supportedBanks')}</p>
                <div className="flex gap-2 justify-center overflow-hidden">
                  {visibleBanks.map((bank, i) => (
                    <div key={`${bank.abbr}-${i}`} className="flex flex-col items-center gap-1 transition-all duration-500" style={{ opacity: i === 0 ? 1 : i === 3 ? 0.4 : 0.75 }}>
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm border" style={{ backgroundColor: bank.bg, color: bank.color, borderColor: bank.color + '33' }}>{bank.abbr}</div>
                      <span className="text-[9px] text-gray-400 font-medium text-center leading-tight w-14">{bank.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <Icon name="InformationCircleIcon" size={16} className="text-blue-500 flex-shrink-0" />
                <p className="text-xs text-blue-700">{t('topup.adminWillProvide')}</p>
              </div>
            </div>
          )}

          {step === 'bankInfo' && bankInfo && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"><Icon name="CheckIcon" size={12} className="text-white" /></div>
                  <span className="text-sm font-bold text-green-700">{t('topup.bankInfoReceived')}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">{t('topup.bankName')}</span><span className="font-semibold text-gray-800">{bankInfo.bankName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">{t('topup.accountNumber')}</span><span className="font-mono font-bold text-gray-800">{bankInfo.accountNo}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">{t('topup.accountHolder')}</span><span className="font-semibold text-gray-800">{bankInfo.accountName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">{t('topup.transferAmount')}</span><span className="font-mono font-bold text-green-700">RM {parseFloat(amount).toLocaleString()}</span></div>
                  {bankInfo.note && <div className="pt-2 border-t border-green-200"><p className="text-xs text-gray-500">{bankInfo.note}</p></div>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('topup.uploadReceipt')}</label>
                <label className="block cursor-pointer">
                  <input type="file" accept="image/*,application/pdf" onChange={e => { const f = e.target.files?.[0]; if (f) { setReceiptFile(f); const r = new FileReader(); r.onload = ev => setReceiptPreview(ev.target?.result as string); r.readAsDataURL(f); } }} className="hidden" />
                  {receiptPreview ? (
                    <div className="relative rounded-xl overflow-hidden border-2 border-green-400">
                      <img src={receiptPreview} alt="Receipt preview" className="w-full h-40 object-cover" />
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-lg">✓ {t('topup.uploaded')}</div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-[hsl(var(--border))] rounded-xl p-6 text-center hover:border-green-400 hover:bg-green-50 transition-colors">
                      <Icon name="ArrowUpTrayIcon" size={24} className="text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-600">{t('topup.clickToUpload')}</p>
                      <p className="text-xs text-gray-400 mt-1">{t('topup.uploadFormats')}</p>
                    </div>
                  )}
                </label>
              </div>
              <button onClick={() => { if (!receiptFile) { toast.error(t('topup.pleaseUploadReceipt')); return; } setStep('submitted'); toast.success(t('topup.receiptSubmitted')); }} className="w-full btn-primary py-3 rounded-xl font-bold text-sm">{t('topup.submitReceipt')}</button>
            </div>
          )}

          {step === 'submitted' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Icon name="CheckCircleIcon" size={36} className="text-green-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">{t('topup.submittedTitle')}</h3>
                <p className="text-sm text-gray-500">{t('topup.submittedDesc')}</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-xs text-amber-700 font-medium">{t('topup.reviewNotice')}</p>
              </div>
              <button onClick={onClose} className="w-full btn-primary py-3 rounded-xl font-bold text-sm">{t('topup.done')}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Withdraw Modal ───────────────────────────────────────────────────────────
function WithdrawModal({ onClose, t }: { onClose: () => void; t: (key: string) => string }) {
  const [step, setStep] = useState<'form' | 'submitted'>('form');
  const [amount, setAmount] = useState('');
  const [bank, setBank] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [maskedAccountNo, setMaskedAccountNo] = useState('');
  const [holderName, setHolderName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAccountNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setAccountNo(raw);
    setMaskedAccountNo(raw.length > 4 ? '*'.repeat(raw.length - 4) + raw.slice(-4) : raw);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!amount || parseFloat(amount) <= 0) errs.amount = t('withdraw.amountRequired');
    if (!bank) errs.bank = t('withdraw.bankRequired');
    if (!accountNo.trim()) errs.accountNo = t('withdraw.accountNoRequired');
    if (!holderName.trim()) errs.holderName = t('withdraw.holderNameRequired');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  return (
    <div className="modal-overlay fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gold-50 flex items-center justify-center">
              <Icon name="ArrowUpTrayIcon" size={16} className="text-gold-600" />
            </div>
            <h2 className="text-base font-bold text-gray-800">{t('withdraw.title')}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <Icon name="XMarkIcon" size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          {step === 'form' && (
            <form onSubmit={e => { e.preventDefault(); if (validate()) setStep('submitted'); }} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('withdraw.amount')}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">RM</span>
                  <input type="number" min="10" step="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className={`w-full pl-12 pr-4 py-3 border rounded-xl text-base font-mono font-bold focus:outline-none focus:ring-2 focus:ring-gold-500/30 ${errors.amount ? 'border-red-400' : 'border-[hsl(var(--border))]'}`} />
                </div>
                {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('withdraw.selectBank')}</label>
                <select value={bank} onChange={e => setBank(e.target.value)} className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 bg-white ${errors.bank ? 'border-red-400' : 'border-[hsl(var(--border))]'}`}>
                  <option value="">{t('withdraw.selectBankPlaceholder')}</option>
                  {BANK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                {errors.bank && <p className="text-xs text-red-500 mt-1">{errors.bank}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('withdraw.accountNumber')}</label>
                <div className="relative">
                  <input type="text" inputMode="numeric" value={maskedAccountNo} onChange={handleAccountNoChange} placeholder="••••••••••" className={`w-full px-4 py-3 border rounded-xl text-base font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-gold-500/30 ${errors.accountNo ? 'border-red-400' : 'border-[hsl(var(--border))]'}`} />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2"><Icon name="LockClosedIcon" size={14} className="text-gray-400" /></div>
                </div>
                {errors.accountNo && <p className="text-xs text-red-500 mt-1">{errors.accountNo}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('withdraw.holderName')}</label>
                <input type="text" value={holderName} onChange={e => setHolderName(e.target.value)} placeholder={t('withdraw.holderNamePlaceholder')} className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 ${errors.holderName ? 'border-red-400' : 'border-[hsl(var(--border))]'}`} />
                {errors.holderName && <p className="text-xs text-red-500 mt-1">{errors.holderName}</p>}
              </div>
              <button type="submit" className="w-full bg-gold-500 hover:bg-gold-600 text-white py-3 rounded-xl font-bold text-sm transition-colors mt-2">{t('withdraw.submit')}</button>
            </form>
          )}
          {step === 'submitted' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-gold-50 border-4 border-gold-200 flex items-center justify-center mx-auto">
                <Icon name="ClockIcon" size={28} className="text-gold-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">{t('withdraw.submittedTitle')}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{t('withdraw.submittedDesc')}</p>
              </div>
              <div className="bg-gray-50 border border-[hsl(var(--border))] rounded-xl px-4 py-3 text-left space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">{t('withdraw.amount')}</span><span className="font-mono font-bold text-gray-800">RM {parseFloat(amount).toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">{t('withdraw.selectBank')}</span><span className="font-semibold text-gray-800">{bank}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">{t('withdraw.holderName')}</span><span className="font-semibold text-gray-800">{holderName}</span></div>
              </div>
              <button onClick={onClose} className="w-full bg-gold-500 hover:bg-gold-600 text-white py-3 rounded-xl font-bold text-sm transition-colors">{t('withdraw.done')}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function UserDashboardClient() {
  const { t } = useLanguage();
  const { getUserProfile } = useAuth();
  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  // Dashboard data — empty until loaded from Supabase
  const [walletBalance, setWalletBalance] = useState(0);
  const [reputation, setReputation] = useState(0);
  const [level, setLevel] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [walletHistory, setWalletHistory] = useState<WalletHistoryEntry[]>([]);
  const [commissionData, setCommissionData] = useState<CommissionEntry[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [liveFeedMessages, setLiveFeedMessages] = useState<LiveFeedItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [visibleFeeds, setVisibleFeeds] = useState<LiveFeedItem[]>([]);
  const feedRef = useRef<number>(0);
  const [feedTick, setFeedTick] = useState(0);

  // Load current user profile from Supabase
  useEffect(() => {
    getUserProfile()
      .then(profile => {
        if (!profile) return;
        setReputation(profile.reputation ?? 100);
        setWalletBalance(profile.wallet_balance ?? 0);
        setLevel(profile.level ?? 1);
        setTotalOrders(profile.total_orders ?? 0);
      })
      .catch(() => {});
  }, []);

  // Initialise live feed with virtual data
  useEffect(() => {
    setLiveFeedMessages(VIRTUAL_FEED_ITEMS);
  }, []);

  useEffect(() => {
    if (liveFeedMessages.length === 0) return;
    setVisibleFeeds(liveFeedMessages.slice(0, 4));
    const interval = setInterval(() => {
      feedRef.current = (feedRef.current + 1) % liveFeedMessages.length;
      const start = feedRef.current;
      const feeds = Array.from({ length: 4 }, (_, i) => liveFeedMessages[(start + i) % liveFeedMessages.length]);
      setVisibleFeeds(feeds);
    }, 2000);
    return () => clearInterval(interval);
  }, [liveFeedMessages]);

  // Tick every second to update dynamic time labels
  useEffect(() => {
    const timer = setInterval(() => setFeedTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const statusColor = (status: string) => {
    if (status === 'Selesai') return 'bg-green-100 text-green-700';
    if (status === 'Bonus') return 'bg-gold-100 text-gold-700';
    if (status === 'Terkunci') return 'bg-red-100 text-red-600';
    return 'bg-gray-100 text-gray-600';
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      Selesai: t('dashboard.completed'),
      Bonus: t('dashboard.bonus'),
      Terkunci: t('dashboard.locked'),
      'Dalam Proses': t('dashboard.inProgress'),
      Dibatalkan: t('dashboard.cancelled'),
    };
    return map[status] || status;
  };

  return (
    <div className="space-y-6">
      {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} t={t} />}
      {showWithdraw && <WithdrawModal onClose={() => setShowWithdraw(false)} t={t} />}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('dashboard.title')}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">{t('dashboard.welcome')}</p>
        </div>
        <Link href="/hotel-booking" className="btn-primary px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2">
          <Icon name="PlusIcon" size={16} />
          {t('dashboard.bookNow')}
        </Link>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Wallet hero card */}
        <div className="wallet-card rounded-2xl p-6 col-span-1 md:col-span-2 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Icon name="WalletIcon" size={16} className="text-white" />
                </div>
                <span className="text-white/80 text-sm font-medium">{t('dashboard.walletBalance')}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-green-400/20 border border-green-400/30 rounded-full px-3 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-300 text-xs font-semibold">{t('admin.active')}</span>
              </div>
            </div>
            <div className="mb-1">
              <span className="text-white/60 text-sm font-medium">RM</span>
              <span className="text-white text-4xl font-bold font-mono ml-1 tabular-nums">{walletBalance.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-white/10 rounded-xl p-3">
                <div className="text-white/60 text-xs mb-1">{t('dashboard.commission')}</div>
                <div className="text-gold-300 font-bold font-mono text-lg">RM {totalCommission.toLocaleString()}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <div className="text-white/60 text-xs mb-1">{t('dashboard.totalOrders')}</div>
                <div className="text-white font-bold font-mono text-lg">{totalOrders}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <div className="text-white/60 text-xs mb-1">{t('dashboard.totalCommission')}</div>
                <div className="text-gold-300 font-bold font-mono text-lg">RM {totalCommission.toLocaleString()}</div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowTopUp(true)} className="flex-1 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-semibold py-2 rounded-xl transition-all flex items-center justify-center gap-2">
                <Icon name="ArrowDownTrayIcon" size={14} />
                {t('dashboard.topUp')}
              </button>
              <button onClick={() => setShowWithdraw(true)} className="flex-1 bg-gold-500/80 hover:bg-gold-500 text-white text-sm font-semibold py-2 rounded-xl transition-all flex items-center justify-center gap-2">
                <Icon name="ArrowUpTrayIcon" size={14} />
                {t('dashboard.withdraw')}
              </button>
            </div>
          </div>
        </div>

        {/* Reputation card */}
        <div className="card-elevated p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">{t('dashboard.reputation')}</span>
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
              <Icon name="ShieldCheckIcon" size={16} className="text-green-600" />
            </div>
          </div>
          <div className="text-4xl font-bold font-mono text-gray-800 tabular-nums mb-1">{reputation}</div>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${reputation}%` }} />
          </div>
          <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
            <span>Min: 80</span>
            <span>{reputation}/100</span>
          </div>
          {reputation >= 80 && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
              <Icon name="CheckCircleIcon" size={14} className="text-green-600" />
              <span className="text-xs text-green-700 font-medium">{t('dashboard.canWithdraw')}</span>
            </div>
          )}
        </div>

        {/* Level card */}
        <div className="card-elevated p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">{t('dashboard.level')}</span>
            <div className="w-8 h-8 rounded-full bg-gold-50 flex items-center justify-center">
              <Icon name="TrophyIcon" size={16} className="text-gold-500" />
            </div>
          </div>
          <div className="text-4xl font-bold font-mono text-gray-800 mb-1">{t('dashboard.level')} {level}</div>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
            <div className="progress-bar-fill h-2 rounded-full" style={{ width: `${Math.min((totalOrders / 30) * 100, 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
            <span>{totalOrders} {t('dashboard.ordersToNextLevel')}</span>
            <span>60%</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="font-bold text-gray-700">L3: 50</div>
              <div className="text-[hsl(var(--muted-foreground))]">RM 399</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="font-bold text-gray-700">L4: 100</div>
              <div className="text-[hsl(var(--muted-foreground))]">RM 599</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Wallet trend chart */}
        <div className="card-elevated p-5 col-span-1 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-700">{t('dashboard.walletHistory')}</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">7 {t('dashboard.date')}</p>
            </div>
            <span className="text-xs font-mono bg-green-50 text-green-700 border border-green-200 rounded-lg px-2 py-1">+RM 270</span>
          </div>
          {walletHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={walletHistory}>
                <defs>
                  <linearGradient id="walletGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a6b3c" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1a6b3c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `RM${v}`} width={55} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="balance" stroke="#1a6b3c" strokeWidth={2} fill="url(#walletGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[160px] text-gray-400">
              <div className="text-center">
                <Icon name="ChartBarIcon" size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">暂无钱包历史</p>
              </div>
            </div>
          )}
        </div>

        {/* Commission bar chart */}
        <div className="card-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-700">{t('dashboard.commissionChart')}</h3>
          </div>
          {commissionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={commissionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={35} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="commission" fill="#c9a84c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[160px] text-gray-400">
              <div className="text-center">
                <Icon name="ChartBarIcon" size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">暂无佣金数据</p>
              </div>
            </div>
          )}
        </div>

        {/* Live feed */}
        <div className="card-elevated p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="text-sm font-bold text-gray-700">{t('dashboard.liveFeed')}</h3>
            </div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))] bg-gray-100 rounded-full px-2 py-0.5">Live</span>
          </div>
          {visibleFeeds.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400">
              <p className="text-xs">暂无动态</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-hidden">
              {visibleFeeds.map((item, idx) => (
                <div key={`${item.id}-${feedTick}`} className="live-feed-item flex items-start gap-2 p-2.5 bg-gray-50 rounded-xl">
                  <span className="text-base">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 font-medium leading-snug">{item.msg}</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">{getDynamicTime(idx, feedTick)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: tasks + recent orders */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Tasks */}
        <div className="card-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-700">{t('dashboard.tasks')}</h3>
            <span className="text-xs text-[hsl(var(--muted-foreground))]">{tasks.filter(t => t.done).length}/{tasks.length}</span>
          </div>
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <p className="text-xs">暂无任务</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map(task => (
                <div key={task.id} className={`p-3 rounded-xl border ${task.done ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-[hsl(var(--border))]'}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-start gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 ${task.done ? 'bg-green-500' : 'bg-gray-200'}`}>
                        {task.done && <Icon name="CheckIcon" size={12} className="text-white" />}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${task.done ? 'text-green-700 line-through' : 'text-gray-700'}`}>{task.title}</p>
                        <p className="text-xs text-gold-600 font-medium mt-0.5">🎁 {task.reward}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-[hsl(var(--muted-foreground))] flex-shrink-0">{task.progress}/{task.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${task.done ? 'bg-green-500' : 'progress-bar-fill'}`} style={{ width: `${Math.min((task.progress / task.total) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="card-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-700">{t('dashboard.recentOrders')}</h3>
            <Link href="/past-bookings" className="text-xs text-primary-500 font-semibold hover:underline">{t('dashboard.viewAll')} →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <p className="text-xs">暂无订单记录</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map(order => (
                <div key={order.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-[hsl(var(--border))]">
                  <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <Icon name="BuildingOfficeIcon" size={16} className="text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">{order.hotel}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{order.date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono text-sm font-bold text-gray-800">RM {order.amount}</div>
                    {order.commission > 0 ? <div className="font-mono text-xs text-green-600 font-medium">+RM {order.commission}</div> : <div className="font-mono text-xs text-red-500 font-medium">{t('dashboard.locked')}</div>}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${statusColor(order.status)}`}>{statusLabel(order.status)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function setSharedBankInfo(...args: any[]): any {
  // eslint-disable-next-line no-console
  console.warn('Placeholder: setSharedBankInfo is not implemented yet.', args);
  return null;
}

export { setSharedBankInfo };