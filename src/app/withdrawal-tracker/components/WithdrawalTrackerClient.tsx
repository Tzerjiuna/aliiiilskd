'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Icon from '@/components/ui/AppIcon';
import { useLanguage } from '@/context/LanguageContext';
import { createClient } from '@/lib/supabase/client';

interface WithdrawalRequest {
  id: string;
  submittedDate: string;
  amount: number;
  status: 'Diluluskan' | 'Menunggu' | 'Ditolak' | 'Dalam Proses';
  approvalDate: string | null;
  paymentMethod: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  referenceNo: string | null;
  remarks: string | null;
}

type FilterStatus = 'Semua' | 'Diluluskan' | 'Menunggu' | 'Dalam Proses' | 'Ditolak';

const statusConfig: Record<string, { bg: string; text: string; icon: string; dot: string }> = {
  Diluluskan: { bg: 'bg-green-100', text: 'text-green-700', icon: 'CheckCircleIcon', dot: 'bg-green-500' },
  Menunggu: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'ClockIcon', dot: 'bg-amber-500' },
  'Dalam Proses': { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'ArrowPathIcon', dot: 'bg-blue-500' },
  Ditolak: { bg: 'bg-red-100', text: 'text-red-600', icon: 'XCircleIcon', dot: 'bg-red-500' },
};

export default function WithdrawalTrackerClient() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('Semua');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const supabase = createClient();

  useEffect(() => {
    const fetchWithdrawals = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) {
        setWithdrawals(data as WithdrawalRequest[]);
      }
      setLoading(false);
    };
    fetchWithdrawals();
  }, []);

  const statusLabelMap: Record<string, string> = {
    Diluluskan: t('withdrawal.approved'),
    Menunggu: t('withdrawal.pending'),
    'Dalam Proses': t('withdrawal.inProcess'),
    Ditolak: t('withdrawal.rejected'),
  };

  const filterTabKeys: { key: FilterStatus; label: string }[] = [
    { key: 'Semua', label: t('withdrawal.all') },
    { key: 'Diluluskan', label: t('withdrawal.approved') },
    { key: 'Dalam Proses', label: t('withdrawal.inProcess') },
    { key: 'Menunggu', label: t('withdrawal.pending') },
    { key: 'Ditolak', label: t('withdrawal.rejected') },
  ];

  const filtered = withdrawals.filter(w => filterStatus === 'Semua' || w.status === filterStatus);

  const totalApproved = withdrawals.filter(w => w.status === 'Diluluskan').reduce((sum, w) => sum + w.amount, 0);
  const totalPending = withdrawals.filter(w => w.status === 'Menunggu' || w.status === 'Dalam Proses').reduce((sum, w) => sum + w.amount, 0);
  const approvedCount = withdrawals.filter(w => w.status === 'Diluluskan').length;

  return (
    <AppLayout isAdmin={false}>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t('withdrawal.title')}</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">{t('withdrawal.subtitle')}</p>
          </div>
          <button className="btn-primary px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2">
            <Icon name="PlusIcon" size={16} />
            {t('withdrawal.title')}
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-elevated p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <Icon name="CheckCircleIcon" size={22} className="text-green-500" />
            </div>
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium uppercase tracking-wide">{t('withdrawal.totalApproved')}</p>
              <p className="text-2xl font-bold font-mono text-gray-800">RM {totalApproved.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-green-600 font-medium">{approvedCount} {t('withdrawal.approved').toLowerCase()}</p>
            </div>
          </div>

          <div className="card-elevated p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Icon name="ClockIcon" size={22} className="text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium uppercase tracking-wide">{t('withdrawal.pendingAmount')}</p>
              <p className="text-2xl font-bold font-mono text-gray-800">RM {totalPending.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-amber-600 font-medium">{t('withdrawal.pending_approval')}</p>
            </div>
          </div>

          <div className="card-elevated p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Icon name="BanknotesIcon" size={22} className="text-primary-500" />
            </div>
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium uppercase tracking-wide">{t('withdrawal.totalRequests')}</p>
              <p className="text-2xl font-bold font-mono text-gray-800">{withdrawals.length}</p>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="card-elevated p-4">
          <div className="flex flex-wrap gap-2">
            {filterTabKeys.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filterStatus === key ? 'bg-primary-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {label}
                {key !== 'Semua' && (
                  <span className="ml-1.5 text-xs opacity-75">({withdrawals.filter(w => w.status === key).length})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Withdrawal list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="card-elevated p-12 text-center">
                <Icon name="BanknotesIcon" size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">{t('withdrawal.noResults')}</p>
              </div>
            ) : (
              filtered.map(wd => {
                const cfg = statusConfig[wd.status] || statusConfig['Menunggu'];
                const isExpanded = expandedId === wd.id;
                return (
                  <div key={wd.id} className="card-elevated overflow-hidden">
                    <div
                      className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : wd.id)}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                        <Icon name={cfg.icon as any} size={18} className={cfg.text} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-gray-500">{wd.id}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {statusLabelMap[wd.status] || wd.status}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-700 mt-0.5">{wd.bankName} · {wd.accountNumber}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{wd.submittedDate}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-mono font-bold text-gray-800">RM {wd.amount.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</p>
                        <Icon name={isExpanded ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={14} className="text-gray-400 ml-auto mt-1" />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-[hsl(var(--border))] p-4 bg-gray-50 space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{t('withdrawal.bank')}</p>
                            <p className="font-semibold text-gray-800">{wd.bankName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{t('withdrawal.accountNumber')}</p>
                            <p className="font-mono font-semibold text-gray-800">{wd.accountNumber}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{t('withdrawal.accountHolder')}</p>
                            <p className="font-semibold text-gray-800">{wd.accountHolder}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{t('withdrawal.paymentMethod')}</p>
                            <p className="font-semibold text-gray-800">{wd.paymentMethod}</p>
                          </div>
                          {wd.approvalDate && (
                            <div>
                              <p className="text-xs text-[hsl(var(--muted-foreground))]">{t('withdrawal.approvalDate')}</p>
                              <p className="font-semibold text-gray-800">{wd.approvalDate}</p>
                            </div>
                          )}
                          {wd.referenceNo && (
                            <div>
                              <p className="text-xs text-[hsl(var(--muted-foreground))]">{t('withdrawal.referenceNo')}</p>
                              <p className="font-mono font-semibold text-gray-800">{wd.referenceNo}</p>
                            </div>
                          )}
                        </div>
                        {wd.remarks && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                            <p className="text-xs text-amber-700">{wd.remarks}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
