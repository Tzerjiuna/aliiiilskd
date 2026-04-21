'use client';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useLanguage } from '@/context/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { setSharedBankInfo } from '@/app/user-dashboard/components/UserDashboardClient';
import type { TopupRequest, WithdrawalRequest, FinanceChartEntry } from '@/types/finance';
import type { WalletLog } from '@/types/user';
import type { BankInfoForm, CommissionForm } from '@/types/admin';

// ─── Local service stubs (replace with actual API calls as needed) ────────────
async function fetchTopupRequests(): Promise<TopupRequest[]> {
  return EMPTY_TOPUPS;
}

async function fetchWithdrawalRequests(): Promise<WithdrawalRequest[]> {
  return EMPTY_WITHDRAWALS;
}

async function approveTopupService(_id: string): Promise<void> {
  // TODO: implement API call
}

async function rejectTopupService(_id: string): Promise<void> {
  // TODO: implement API call
}

async function rejectWithdrawalService(_id: string): Promise<void> {
  // TODO: implement API call
}

async function approveWithdrawalService(_id: string): Promise<void> {
  // TODO: implement API call
}

// ─── Empty initial state (data loaded from API/Supabase) ──────────────────────
const EMPTY_TOPUPS: TopupRequest[] = [];
const EMPTY_WITHDRAWALS: WithdrawalRequest[] = [];
const EMPTY_WALLET_LOGS: WalletLog[] = [];
const EMPTY_CHART_DATA: FinanceChartEntry[] = [];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[hsl(var(--border))] rounded-xl shadow-card px-3 py-2 text-xs">
        <p className="font-semibold text-gray-600 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={`ftt-${i}`} style={{ color: p.color }} className="font-mono font-bold">
            {p.name}: RM {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminFinanceClient() {
  const [activeTab, setActiveTab] = useState<'topup' | 'withdrawal' | 'logs'>('topup');
  const [topups, setTopups] = useState<TopupRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [walletLogs] = useState<WalletLog[]>([]);
  const [financeChartData] = useState<FinanceChartEntry[]>([]);
  const [bankModal, setBankModal] = useState<TopupRequest | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; type: 'topup' | 'withdrawal'; name: string } | null>(null);
  const [commissionRate, setCommissionRate] = useState('10');
  const [editingCommission, setEditingCommission] = useState(false);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const supabase = createClient();

  // Low-rep message state
  const DEFAULT_LOW_REP_MSG = '由于您的账户信誉评分低于80分，当前提款功能已被系统暂时限制。如需恢复提款权限，请联系相关部门进行审核处理。';
  const [lowRepMsg, setLowRepMsg] = useState(DEFAULT_LOW_REP_MSG);
  const [editingLowRepMsg, setEditingLowRepMsg] = useState(false);
  const [lowRepMsgDraft, setLowRepMsgDraft] = useState(DEFAULT_LOW_REP_MSG);
  const [savingLowRepMsg, setSavingLowRepMsg] = useState(false);

  const bankForm = useForm<BankInfoForm>({ defaultValues: { bankName: 'Maybank', accountNo: '', accountName: '', note: '' } });
  const commissionForm = useForm<CommissionForm>({ defaultValues: { rate: '10' } });

  // Load data from Supabase on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [topupData, withdrawalData, settingRes] = await Promise.all([
          fetchTopupRequests(),
          fetchWithdrawalRequests(),
          supabase.from('app_settings').select('value').eq('key', 'low_rep_withdrawal_message').maybeSingle(),
        ]);
        setTopups(topupData);
        setWithdrawals(withdrawalData);
        if (settingRes.data?.value) {
          setLowRepMsg(settingRes.data.value);
          setLowRepMsgDraft(settingRes.data.value);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveLowRepMsg = async () => {
    setSavingLowRepMsg(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'low_rep_withdrawal_message', value: lowRepMsgDraft }, { onConflict: 'key' });
      if (error) throw error;
      setLowRepMsg(lowRepMsgDraft);
      setEditingLowRepMsg(false);
      toast.success('提款限制提示语已更新');
    } catch {
      toast.error('保存失败，请重试');
    } finally {
      setSavingLowRepMsg(false);
    }
  };

  const approveTopup = async (id: string) => {
    try {
      await approveTopupService(id);
      setTopups(prev => prev.map(t => t.id === id ? { ...t, status: 'approved' } : t));
      toast.success('Top-up diluluskan dan baki pengguna dikemaskini');
    } catch {
      toast.error('Gagal meluluskan top-up');
    }
  };

  const rejectRequest = async () => {
    if (!rejectModal) return;
    try {
      if (rejectModal.type === 'topup') {
        await rejectTopupService(rejectModal.id);
        setTopups(prev => prev.map(t => t.id === rejectModal.id ? { ...t, status: 'rejected' } : t));
      } else {
        await rejectWithdrawalService(rejectModal.id);
        setWithdrawals(prev => prev.map(w => w.id === rejectModal.id ? { ...w, status: 'rejected' } : w));
      }
      toast.success(`Permintaan ${rejectModal.name} ditolak`);
      setRejectModal(null);
    } catch {
      toast.error('Gagal menolak permintaan');
    }
  };

  const approveWithdrawal = async (id: string) => {
    try {
      await approveWithdrawalService(id);
      setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'approved' } : w));
      toast.success('Pengeluaran diluluskan dan diproses');
    } catch {
      toast.error('Gagal meluluskan pengeluaran');
    }
  };

  const sendBankInfo = (data: BankInfoForm) => {
    if (!bankModal) return;
    setTopups(prev => prev.map(t => t.id === bankModal.id ? { ...t, bankInfo: `${data.bankName} ${data.accountNo}` } : t));
    setSharedBankInfo({ bankName: data.bankName, accountNo: data.accountNo, accountName: data.accountName, note: data.note });
    toast.success(`Maklumat bank dihantar kepada ${bankModal.userName}`);
    setBankModal(null);
  };

  const saveCommission = (data: CommissionForm) => {
    setCommissionRate(data.rate);
    setEditingCommission(false);
    toast.success(`Kadar komisen global dikemaskini kepada ${data.rate}%`);
  };

  const statusColor = (status: string) => {
    if (status === 'approved' || status === 'Diluluskan' || status === 'Selesai') return 'bg-green-100 text-green-700';
    if (status === 'pending' || status === 'Menunggu' || status === 'Diproses') return 'bg-amber-100 text-amber-700';
    if (status === 'rejected' || status === 'Ditolak') return 'bg-red-100 text-red-600';
    return 'bg-gray-100 text-gray-600';
  };

  const statusLabel = (status: string) => {
    if (status === 'approved') return 'Diluluskan';
    if (status === 'rejected') return 'Ditolak';
    if (status === 'pending') return 'Menunggu';
    return status;
  };

  const logTypeColor = (type: string) => {
    if (type === 'credit' || type === 'bonus') return 'text-green-600';
    if (type === 'debit' || type === 'withdrawal') return 'text-red-500';
    if (type === 'refund') return 'text-blue-500';
    return 'text-gray-600';
  };

  const pendingTopups = topups.filter(t => t.status === 'pending' || t.status === 'Menunggu').length;
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending' || w.status === 'Menunggu').length;
  const totalTopupToday = topups.filter(t => t.status === 'approved' || t.status === 'Diluluskan').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawalToday = withdrawals.filter(w => w.status === 'approved' || w.status === 'Selesai').reduce((s, w) => s + w.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('admin.financeTitle')}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">{t('admin.financeSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingTopups > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <Icon name="ClockIcon" size={14} className="text-amber-500" />
              <span className="text-xs font-semibold text-amber-700">{pendingTopups} {t('admin.topupPending')}</span>
            </div>
          )}
          {pendingWithdrawals > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <Icon name="ExclamationCircleIcon" size={14} className="text-red-500" />
              <span className="text-xs font-semibold text-red-600">{pendingWithdrawals} {t('admin.withdrawalPending')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('admin.topupToday'), value: `RM ${totalTopupToday.toLocaleString()}`, icon: 'ArrowDownTrayIcon', color: 'text-green-600 bg-green-50', trend: '' },
          { label: t('admin.withdrawalToday'), value: `RM ${totalWithdrawalToday.toLocaleString()}`, icon: 'ArrowUpTrayIcon', color: 'text-red-500 bg-red-50', trend: '' },
          { label: t('admin.pendingApproval'), value: String(pendingTopups + pendingWithdrawals), icon: 'ClockIcon', color: 'text-amber-600 bg-amber-50', trend: '' },
          { label: t('admin.commissionRate'), value: `${commissionRate}%`, icon: 'PercentBadgeIcon', color: 'text-primary-600 bg-primary-50', trend: 'Global' },
        ].map((stat, i) => (
          <div key={`fstat-${i}`} className="card-elevated p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}>
              <Icon name={stat.icon as any} size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold font-mono text-gray-800 truncate">{stat.value}</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))] truncate">{stat.label}</div>
              {stat.trend && <div className="text-[10px] font-medium text-gray-400">{stat.trend}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Finance chart */}
      <div className="card-elevated p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-700">{t('admin.financialFlow')}</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{t('admin.financialFlowSubtitle')}</p>
          </div>
        </div>
        {financeChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={financeChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `RM${v}`} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="topup" name={t('admin.topupRequests')} fill="#1a6b3c" radius={[3, 3, 0, 0]} />
              <Bar dataKey="withdrawal" name={t('admin.withdrawalRequests')} fill="#ef4444" radius={[3, 3, 0, 0]} />
              <Bar dataKey="commission" name={t('admin.commission')} fill="#c9a84c" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-gray-400">
            <div className="text-center">
              <Icon name="ChartBarIcon" size={32} className="mb-3 opacity-30" />
              <p className="text-sm">暂无财务数据</p>
            </div>
          </div>
        )}
      </div>

      {/* Commission settings */}
      <div className="card-elevated p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center">
              <Icon name="CogIcon" size={16} className="text-primary-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-700">{t('admin.globalCommissionSettings')}</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{t('admin.globalCommissionDesc')}</p>
            </div>
          </div>
          <button
            onClick={() => setEditingCommission(!editingCommission)}
            className="text-xs font-semibold text-primary-500 hover:text-primary-600 flex items-center gap-1"
          >
            <Icon name="PencilIcon" size={12} />
            {editingCommission ? t('admin.cancel') : t('admin.editHotel')}
          </button>
        </div>
        {editingCommission ? (
          <form onSubmit={commissionForm.handleSubmit(saveCommission)} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('admin.commissionRateLabel')}</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="30"
                {...commissionForm.register('rate', { required: true, min: 1, max: 30 })}
                className="w-full px-4 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
            <button type="submit" className="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold">
              {t('admin.save')}
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold font-mono text-primary-600">{commissionRate}%</div>
            <div className="text-sm text-[hsl(var(--muted-foreground))]">{t('admin.currentCommissionDesc')}</div>
          </div>
        )}
      </div>

      {/* Low-reputation withdrawal block message settings */}
      <div className="card-elevated p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
              <Icon name="ShieldExclamationIcon" size={16} className="text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-700">信誉分不足提款限制提示语</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">当用户信誉分低于80分时，提交提款将显示此提示</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (editingLowRepMsg) {
                setLowRepMsgDraft(lowRepMsg);
                setEditingLowRepMsg(false);
              } else {
                setLowRepMsgDraft(lowRepMsg);
                setEditingLowRepMsg(true);
              }
            }}
            className="text-xs font-semibold text-primary-500 hover:text-primary-600 flex items-center gap-1"
          >
            <Icon name="PencilIcon" size={12} />
            {editingLowRepMsg ? '取消' : '编辑'}
          </button>
        </div>
        {editingLowRepMsg ? (
          <div className="space-y-3">
            <textarea
              value={lowRepMsgDraft}
              onChange={e => setLowRepMsgDraft(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none"
              placeholder="输入提款限制提示语..."
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setLowRepMsgDraft(lowRepMsg); setEditingLowRepMsg(false); }}
                className="flex-1 py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={saveLowRepMsg}
                disabled={savingLowRepMsg || !lowRepMsgDraft.trim()}
                className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {savingLowRepMsg ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> 保存中...</>
                ) : '保存'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
            <Icon name="InformationCircleIcon" size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 leading-relaxed">{lowRepMsg}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { key: 'topup', label: t('admin.topupRequests'), badge: pendingTopups },
          { key: 'withdrawal', label: t('admin.withdrawalRequests'), badge: pendingWithdrawals },
          { key: 'logs', label: t('admin.transactionLogs'), badge: 0 },
        ] as const).map(tab => (
          <button
            key={`ftab-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.key ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Top-up tab */}
      {activeTab === 'topup' && (
        <div className="card-elevated overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Icon name="ArrowPathIcon" size={28} className="mb-3 opacity-50 animate-spin" />
              <p className="text-sm font-medium">加载中...</p>
            </div>
          ) : topups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Icon name="ArrowDownTrayIcon" size={32} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">暂无充值请求</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))] bg-gray-50">
                    <th className="p-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.user')}</th>
                    <th className="p-3 text-right font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.amount')}</th>
                    <th className="p-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.method')}</th>
                    <th className="p-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.reference')}</th>
                    <th className="p-3 text-center font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.status')}</th>
                    <th className="p-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.date')}</th>
                    <th className="p-3 text-center font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {topups.map((topup, idx) => (
                    <tr key={topup.id} className={`border-b border-[hsl(var(--border))] hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                      <td className="p-3">
                        <div className="font-semibold text-gray-700 text-sm">{topup.userName}</div>
                        <div className="font-mono text-[10px] text-gray-400">{topup.userId}</div>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-mono font-bold text-green-600">+RM {topup.amount.toLocaleString()}</span>
                      </td>
                      <td className="p-3 text-xs text-gray-600">{topup.method}</td>
                      <td className="p-3">
                        <span className="font-mono text-xs text-gray-500">{topup.reference}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor(topup.status)}`}>{statusLabel(topup.status)}</span>
                      </td>
                      <td className="p-3 text-xs text-[hsl(var(--muted-foreground))]">{topup.submittedAt}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          {(topup.status === 'pending' || topup.status === 'Menunggu') && (
                            <>
                              <button
                                onClick={() => { setBankModal(topup); }}
                                title={t('admin.sendBankInfo')}
                                className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                              >
                                <Icon name="BanknotesIcon" size={13} className="text-blue-600" />
                              </button>
                              <button
                                onClick={() => approveTopup(topup.id)}
                                title={t('admin.approveToplup')}
                                className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors"
                              >
                                <Icon name="CheckIcon" size={13} className="text-green-600" />
                              </button>
                              <button
                                onClick={() => setRejectModal({ id: topup.id, type: 'topup', name: topup.userName })}
                                title={t('admin.rejectRequest')}
                                className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                              >
                                <Icon name="XMarkIcon" size={13} className="text-red-500" />
                              </button>
                            </>
                          )}
                          {topup.bankInfo && (
                            <div className="text-[10px] text-gray-400 font-mono">{topup.bankInfo}</div>
                          )}
                          {topup.status !== 'pending' && topup.status !== 'Menunggu' && !topup.bankInfo && (
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Withdrawal tab */}
      {activeTab === 'withdrawal' && (
        <div className="card-elevated overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Icon name="ArrowPathIcon" size={28} className="mb-3 opacity-50 animate-spin" />
              <p className="text-sm font-medium">加载中...</p>
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Icon name="ArrowUpTrayIcon" size={32} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">暂无提款请求</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))] bg-gray-50">
                    <th className="p-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.user')}</th>
                    <th className="p-3 text-right font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.amount')}</th>
                    <th className="p-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('withdrawal.bank')}</th>
                    <th className="p-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.accountNo')}</th>
                    <th className="p-3 text-center font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.reputation')}</th>
                    <th className="p-3 text-center font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.status')}</th>
                    <th className="p-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.date')}</th>
                    <th className="p-3 text-center font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((wd, idx) => (
                    <tr key={wd.id} className={`border-b border-[hsl(var(--border))] hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                      <td className="p-3">
                        <div className="font-semibold text-gray-700 text-sm">{wd.userName}</div>
                        <div className="font-mono text-[10px] text-gray-400">{wd.userId}</div>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-mono font-bold text-red-500">-RM {wd.amount.toLocaleString()}</span>
                      </td>
                      <td className="p-3 text-xs text-gray-600">{wd.bankName}</td>
                      <td className="p-3">
                        <span className="font-mono text-xs text-gray-500">{wd.accountNo}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-lg ${wd.reputation >= 80 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                          {wd.reputation}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor(wd.status)}`}>{statusLabel(wd.status)}</span>
                      </td>
                      <td className="p-3 text-xs text-[hsl(var(--muted-foreground))]">{wd.requestedAt}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          {(wd.status === 'pending' || wd.status === 'Menunggu') && (
                            <>
                              {wd.reputation < 80 && (
                                <div title={t('admin.reputationWarningAdmin')} className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                                  <Icon name="ExclamationTriangleIcon" size={13} className="text-amber-500" />
                                </div>
                              )}
                              <button
                                onClick={() => approveWithdrawal(wd.id)}
                                disabled={wd.reputation < 80}
                                title={t('admin.approveWithdrawal')}
                                className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Icon name="CheckIcon" size={13} className="text-green-600" />
                              </button>
                              <button
                                onClick={() => setRejectModal({ id: wd.id, type: 'withdrawal', name: wd.userName })}
                                title={t('admin.rejectWithdrawal')}
                                className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                              >
                                <Icon name="XMarkIcon" size={13} className="text-red-500" />
                              </button>
                            </>
                          )}
                          {wd.status !== 'pending' && wd.status !== 'Menunggu' && <span className="text-xs text-[hsl(var(--muted-foreground))]">—</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Wallet logs tab */}
      {activeTab === 'logs' && (
        <div className="card-elevated overflow-hidden">
          <div className="p-4 border-b border-[hsl(var(--border))] bg-gray-50">
            <h3 className="text-sm font-bold text-gray-700">{t('admin.recentTransactionLogs')}</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{t('admin.allWalletMovements')}</p>
          </div>
          {walletLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Icon name="ClipboardDocumentListIcon" size={32} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">暂无交易记录</p>
            </div>
          ) : (
            <div className="divide-y divide-[hsl(var(--border))]">
              {walletLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${log.amount > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <Icon name={log.amount > 0 ? 'ArrowDownIcon' : 'ArrowUpIcon'} size={16} className={log.amount > 0 ? 'text-green-600' : 'text-red-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700">{log.userName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.amount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {log.log_type}
                      </span>
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{log.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`font-mono font-bold text-sm ${logTypeColor(log.log_type)}`}>
                      {log.amount > 0 ? '+' : ''}RM {Math.abs(log.amount)}
                    </div>
                    <div className="font-mono text-xs text-[hsl(var(--muted-foreground))]">{t('admin.balance')}: RM {log.balance_after.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400">{log.created_at}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bank info modal */}
      {bankModal && (
        <div className="modal-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{t('admin.bankInfoModalTitle')}</h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{t('admin.bankInfoTo')}: {bankModal.userName}</p>
              </div>
              <button onClick={() => setBankModal(null)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <Icon name="XMarkIcon" size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5">
              <p className="text-xs text-blue-700 font-medium">
                {t('admin.bankInfoDesc')}
              </p>
              <div className="mt-2 font-mono text-xs text-blue-600">Top-up: RM {bankModal.amount.toLocaleString()}</div>
            </div>

            <form onSubmit={bankForm.handleSubmit(sendBankInfo)} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('admin.bankName')}</label>
                <input
                  {...bankForm.register('bankName', { required: true })}
                  className="w-full px-4 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('admin.accountNumber')}</label>
                <input
                  {...bankForm.register('accountNo', { required: true })}
                  className="w-full px-4 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('admin.accountHolderName')}</label>
                <input
                  {...bankForm.register('accountName', { required: true })}
                  className="w-full px-4 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('admin.additionalInstructions')}</label>
                <textarea
                  {...bankForm.register('note')}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none"
                  placeholder={t('admin.additionalInstructionsPlaceholder')}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setBankModal(null)} className="flex-1 py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  {t('admin.cancel')}
                </button>
                <button type="submit" className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-bold">
                  {t('admin.sendInfo')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject confirm modal */}
      {rejectModal && (
        <div className="modal-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Icon name="ExclamationTriangleIcon" size={28} className="text-red-500" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-2">{t('admin.rejectConfirmTitle')}</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
              {rejectModal.type === 'topup' ? t('admin.topup') : t('admin.withdrawal')} {t('admin.rejectConfirmDesc')} <strong>{rejectModal.name}</strong>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="flex-1 py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                {t('admin.cancel')}
              </button>
              <button onClick={rejectRequest} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">
                {t('admin.yesReject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}