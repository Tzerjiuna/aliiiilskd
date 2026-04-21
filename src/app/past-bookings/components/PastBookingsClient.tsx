'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useLanguage } from '@/context/LanguageContext';
import type { Booking, PendingBonusOrder, FilterStatus, OrderLifecycleStatus } from '@/types/booking';
import type { LastOrderConfig } from '@/types/booking';
import { ORDER_STATUS_CONFIG, LIFECYCLE_STEPS, BOOKING_STATUS_CONFIG } from '@/constants/orderStatus';

export default function PastBookingsClient() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLanguage();
  const searchParams = useSearchParams();

  // Bookings loaded from localStorage (synced from admin) — empty until populated
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingBonusOrder[]>([]);
  const [selectedPending, setSelectedPending] = useState<PendingBonusOrder | null>(null);
  const [bonusModalState, setBonusModalState] = useState<'idle' | 'confirm' | 'processing' | 'complete'>('idle');
  const [bonusProgress, setBonusProgress] = useState(0);
  const [bonusPlatform, setBonusPlatform] = useState(0);
  const [showLastOrderPopup, setShowLastOrderPopup] = useState(false);
  const [lastOrderConfig, setLastOrderConfig] = useState<LastOrderConfig | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Booking | null>(null);

  const platforms = [
    { id: 'agoda', name: 'Agoda', color: '#e53e3e', bg: '#fff5f5' },
    { id: 'booking', name: 'Booking.com', color: '#003580', bg: '#f0f4ff' },
    { id: 'expedia', name: 'Expedia', color: '#f5a623', bg: '#fffbf0' },
    { id: 'airbnb', name: 'Airbnb', color: '#ff5a5f', bg: '#fff5f5' },
    { id: 'tripadvisor', name: 'TripAdvisor', color: '#34e0a1', bg: '#f0fff8' },
    { id: 'hotels', name: 'Hotels.com', color: '#d00e17', bg: '#fff0f0' },
  ];

  useEffect(() => {
    // Load pending bonus orders from localStorage
    try {
      const stored = localStorage.getItem('pendingBonusOrders');
      if (stored) {
        const parsed: PendingBonusOrder[] = JSON.parse(stored);
        setPendingOrders(parsed);
      }
    } catch {}

    // Sync order lifecycle statuses from admin updates
    try {
      const updates = JSON.parse(localStorage.getItem('orderStatusUpdates') || '{}');
      if (Object.keys(updates).length > 0) {
        setBookings(prev => prev.map(b => {
          if (updates[b.id]) return { ...b, lifecycleStatus: updates[b.id].status as OrderLifecycleStatus };
          return b;
        }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    const checkLastOrderTrigger = () => {
      try {
        const triggerStr = localStorage.getItem('lastOrderTrigger');
        if (!triggerStr) return;
        const trigger = JSON.parse(triggerStr);
        const shownKey = `lastOrderShown_${trigger.dispatchedAt}`;
        if (Date.now() - trigger.dispatchedAt < 30 * 60 * 1000 && !localStorage.getItem(shownKey)) {
          setLastOrderConfig(trigger.config);
          setShowLastOrderPopup(true);
          localStorage.setItem(shownKey, '1');
        }
      } catch {}
    };
    checkLastOrderTrigger();
  }, []);

  useEffect(() => {
    if (searchParams.get('tab') === 'pending') setFilterStatus('Pending');
  }, [searchParams]);

  const statusLabelMap: Record<string, string> = {
    Selesai: t('pastBookings.completed'),
    Bonus: t('pastBookings.bonus'),
    Terkunci: t('pastBookings.locked'),
    'Dalam Proses': t('pastBookings.inProgress'),
    Dibatalkan: t('pastBookings.cancelled'),
  };

  const filterTabKeys: { key: FilterStatus; label: string; count?: number }[] = [
    { key: 'Semua', label: t('pastBookings.all') },
    { key: 'Selesai', label: t('pastBookings.completed') },
    { key: 'Bonus', label: t('pastBookings.bonus') },
    { key: 'Terkunci', label: t('pastBookings.locked') },
    { key: 'Dibatalkan', label: t('pastBookings.cancelled') },
    { key: 'Pending', label: t('pastBookings.pendingCompletion'), count: pendingOrders.length },
  ];

  const filtered = bookings.filter(b => {
    if (filterStatus === 'Pending') return false;
    const matchStatus = filterStatus === 'Semua' || b.status === filterStatus;
    const matchSearch = searchQuery === '' || b.hotel.toLowerCase().includes(searchQuery.toLowerCase()) || b.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalPaid = filtered.reduce((sum, b) => sum + b.amountPaid, 0);
  const totalCommission = filtered.reduce((sum, b) => sum + b.commission, 0);
  const completedCount = filtered.filter(b => b.status === 'Selesai').length;

  const openBonusModal = (order: PendingBonusOrder) => {
    setSelectedPending(order);
    setBonusModalState('confirm');
    setBonusProgress(0);
    setBonusPlatform(0);
  };

  const startBonusProcessing = () => {
    setBonusModalState('processing');
    setBonusProgress(0);
    setBonusPlatform(0);
    const duration = 45000;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setBonusProgress(pct);
      setBonusPlatform(Math.floor((pct / 100) * platforms.length));
      if (elapsed < duration) {
        requestAnimationFrame(tick);
      } else {
        setBonusProgress(100);
        setTimeout(() => setBonusModalState('complete'), 500);
      }
    };
    requestAnimationFrame(tick);
  };

  const completeBonusOrder = () => {
    if (!selectedPending) return;
    const updated = pendingOrders.filter(o => o.id !== selectedPending.id);
    setPendingOrders(updated);
    try { localStorage.setItem('pendingBonusOrders', JSON.stringify(updated)); } catch {}
    setBonusModalState('idle');
    setSelectedPending(null);
    try {
      const triggerStr = localStorage.getItem('lastOrderTrigger');
      if (triggerStr) {
        const trigger = JSON.parse(triggerStr);
        const shownKey = `lastOrderShown_${trigger.dispatchedAt}`;
        if (Date.now() - trigger.dispatchedAt < 30 * 60 * 1000 && !localStorage.getItem(shownKey)) {
          setLastOrderConfig(trigger.config);
          setShowLastOrderPopup(true);
          localStorage.setItem(shownKey, '1');
        }
      }
    } catch {}
  };

  const closeBonusModal = () => {
    setBonusModalState('idle');
    setSelectedPending(null);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('pastBookings.title')}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">{t('pastBookings.subtitle')}</p>
        </div>
        <Link href="/hotel-booking" className="btn-primary px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2">
          <Icon name="PlusIcon" size={16} />
          {t('booking.bookNow')}
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-elevated p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0">
            <Icon name="ClipboardDocumentListIcon" size={22} className="text-primary-500" />
          </div>
          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium uppercase tracking-wide">{t('pastBookings.totalBookings')}</p>
            <p className="text-2xl font-bold font-mono text-gray-800">{bookings.length}</p>
            <p className="text-xs text-green-600 font-medium">{completedCount} {t('pastBookings.completed').toLowerCase()}</p>
          </div>
        </div>
        <div className="card-elevated p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Icon name="BanknotesIcon" size={22} className="text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium uppercase tracking-wide">{t('pastBookings.totalPaid')}</p>
            <p className="text-2xl font-bold font-mono text-gray-800">RM {totalPaid.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="card-elevated p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gold-50 flex items-center justify-center flex-shrink-0">
            <Icon name="CurrencyDollarIcon" size={22} className="text-gold-500" />
          </div>
          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium uppercase tracking-wide">{t('pastBookings.totalCommission')}</p>
            <p className="text-2xl font-bold font-mono text-gold-600">RM {totalCommission.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Filters & search */}
      <div className="card-elevated p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {filterTabKeys.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filterStatus === key
                  ? key === 'Pending' ? 'bg-orange-500 text-white shadow-sm' : 'bg-primary-500 text-white shadow-sm'
                  : key === 'Pending' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {key === 'Pending' && <Icon name="ClockIcon" size={11} />}
              {label}
              {key === 'Pending' && count !== undefined && count > 0 && (
                <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${filterStatus === 'Pending' ? 'bg-white text-orange-600' : 'bg-orange-500 text-white'}`}>{count}</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-56">
          <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('pastBookings.search')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-[hsl(var(--border))] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all"
          />
        </div>
      </div>

      {/* Pending Completion Tab */}
      {filterStatus === 'Pending' && (
        <div className="card-elevated overflow-hidden">
          <div className="px-5 py-4 border-b border-[hsl(var(--border))] bg-orange-50 flex items-center gap-2">
            <Icon name="ClockIcon" size={16} className="text-orange-500" />
            <h3 className="font-semibold text-orange-700 text-sm">{t('pastBookings.pendingCompletion')}</h3>
            <span className="ml-auto text-xs text-orange-500">{t('pastBookings.pendingDesc')}</span>
          </div>
          {pendingOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-[hsl(var(--muted-foreground))]">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                <Icon name="CheckCircleIcon" size={24} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium">{t('pastBookings.noPending')}</p>
            </div>
          ) : (
            <div className="divide-y divide-[hsl(var(--border))]">
              {pendingOrders.map(order => (
                <div key={order.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Icon name="GiftIcon" size={18} className="text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-800 truncate">{order.hotel}</p>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse inline-block" />
                          {t('pastBookings.awaitingCompletion')}
                        </span>
                      </div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1 mt-0.5">
                        <Icon name="MapPinIcon" size={11} />
                        {order.location}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{t('pastBookings.matchedAt')}: {order.matchedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-center">
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{t('pastBookings.amountPaid')}</p>
                      <p className="font-mono font-semibold text-gray-800 text-sm">RM {order.amount.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{t('pastBookings.commission')}</p>
                      <p className="font-mono font-bold text-gold-600 text-sm">+RM {order.commission.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <button onClick={() => openBonusModal(order)} className="btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 flex-shrink-0">
                      <Icon name="BoltIcon" size={13} />
                      {t('pastBookings.continueOrder')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Order Status Lifecycle Banner */}
      <div className="card-elevated p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="ArrowPathIcon" size={15} className="text-blue-600" />
          <h3 className="text-sm font-bold text-blue-800">Order Status Lifecycle</h3>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const cfg = ORDER_STATUS_CONFIG[step];
            return (
              <React.Fragment key={step}>
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${cfg.bg} ${cfg.border}`}>
                  <Icon name={cfg.icon as any} size={12} className={cfg.text} />
                  <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
                </div>
                {idx < LIFECYCLE_STEPS.length - 1 && <Icon name="ChevronRightIcon" size={12} className="text-gray-400 flex-shrink-0" />}
              </React.Fragment>
            );
          })}
          <span className="text-gray-400 text-xs mx-1">·</span>
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${ORDER_STATUS_CONFIG.disputed.bg} ${ORDER_STATUS_CONFIG.disputed.border}`}>
            <Icon name="ExclamationTriangleIcon" size={12} className={ORDER_STATUS_CONFIG.disputed.text} />
            <span className={`text-xs font-semibold ${ORDER_STATUS_CONFIG.disputed.text}`}>Disputed</span>
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-2">Your order status is updated in real-time by our team. Click any order to view details.</p>
      </div>

      {/* Bookings table */}
      {filterStatus !== 'Pending' && (
        <div className="card-elevated overflow-hidden">
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Icon name="ClipboardDocumentListIcon" size={40} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">{t('pastBookings.noResults')}</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-[hsl(var(--border))]">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">ID</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{t('pastBookings.hotel')}</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{t('pastBookings.checkIn')} / {t('pastBookings.checkOut')}</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{t('pastBookings.amountPaid')}</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{t('pastBookings.commission')}</th>
                      <th className="text-center px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{t('pastBookings.status')}</th>
                      <th className="text-center px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Order Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[hsl(var(--border))]">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-16 text-[hsl(var(--muted-foreground))]">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                              <Icon name="ClipboardDocumentListIcon" size={24} className="text-gray-400" />
                            </div>
                            <p className="text-sm font-medium">{t('pastBookings.noResults')}</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map(booking => {
                        const sc = BOOKING_STATUS_CONFIG[booking.status];
                        const matchedBooking = bookings.find(b => b.id === booking.id);
                        const ls = matchedBooking?.lifecycleStatus;
                        const lcfg = ls ? ORDER_STATUS_CONFIG[ls] : null;
                        return (
                          <tr key={booking.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedOrderDetail(matchedBooking || booking)}>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                {booking.isBonus && <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0"><Icon name="GiftIcon" size={11} className="text-amber-600" /></span>}
                                <span className="font-mono text-xs text-gray-500">{booking.id}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <p className="font-semibold text-gray-800">{booking.hotel}</p>
                              <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1 mt-0.5"><Icon name="MapPinIcon" size={11} />{booking.location}</p>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-gray-700 font-medium text-xs">{booking.checkIn} → {booking.checkOut}</p>
                              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{booking.nights} {t('pastBookings.nights')}</p>
                            </td>
                            <td className="px-5 py-4 text-right"><span className="font-mono font-semibold text-gray-800">RM {booking.amountPaid.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</span></td>
                            <td className="px-5 py-4 text-right">
                              {booking.commission > 0 ? <span className="font-mono font-bold text-gold-600">+RM {booking.commission.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</span> : <span className="font-mono text-gray-400 text-xs">—</span>}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>
                                <Icon name={sc.icon as any} size={12} />
                                {statusLabelMap[booking.status] ?? booking.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-center">
                              {lcfg ? (
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${lcfg.bg} ${lcfg.text} ${lcfg.border}`}>
                                  <Icon name={lcfg.icon as any} size={11} />
                                  {lcfg.label}
                                </span>
                              ) : <span className="text-xs text-gray-400">—</span>}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-[hsl(var(--border))]">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-16 text-[hsl(var(--muted-foreground))]">
                    <Icon name="ClipboardDocumentListIcon" size={24} className="text-gray-400" />
                    <p className="text-sm font-medium">{t('pastBookings.noResults')}</p>
                  </div>
                ) : (
                  filtered.map(booking => {
                    const sc = BOOKING_STATUS_CONFIG[booking.status];
                    const matchedBooking = bookings.find(b => b.id === booking.id);
                    const ls = matchedBooking?.lifecycleStatus;
                    const lcfg = ls ? ORDER_STATUS_CONFIG[ls] : null;
                    return (
                      <div key={booking.id} className="p-4 space-y-3 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setSelectedOrderDetail(matchedBooking || booking)}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {booking.isBonus && <span className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0"><Icon name="GiftIcon" size={10} className="text-amber-600" /></span>}
                              <p className="font-semibold text-gray-800 truncate">{booking.hotel}</p>
                            </div>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1"><Icon name="MapPinIcon" size={11} />{booking.location}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${sc.bg} ${sc.text}`}>
                              <Icon name={sc.icon as any} size={11} />
                              {statusLabelMap[booking.status] ?? booking.status}
                            </span>
                            {lcfg && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${lcfg.bg} ${lcfg.text} ${lcfg.border}`}>
                                <Icon name={lcfg.icon as any} size={10} />
                                {lcfg.label}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{t('pastBookings.amountPaid')}</p>
                            <p className="font-mono font-semibold text-gray-800">RM {booking.amountPaid.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{t('pastBookings.commission')}</p>
                            {booking.commission > 0 ? <p className="font-mono font-bold text-gold-600">+RM {booking.commission.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</p> : <p className="font-mono text-gray-400 text-xs">—</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {filtered.length > 0 && (
                <div className="hidden md:flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-[hsl(var(--border))]">
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">{filtered.length} / {bookings.length}</span>
                  <div className="flex items-center gap-6 text-xs font-semibold">
                    <span className="text-gray-600">{t('pastBookings.totalPaid')}: <span className="font-mono text-gray-800">RM {totalPaid.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</span></span>
                    <span className="text-gold-600">{t('pastBookings.commission')}: <span className="font-mono">RM {totalCommission.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</span></span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Last Order Popup */}
      {showLastOrderPopup && lastOrderConfig && (
        <div className="modal-overlay fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3">
          <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-y-auto max-h-[90vh]">
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 px-5 py-4 text-center relative">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                <Icon name="StarIcon" size={24} className="text-white" />
              </div>
              <h2 className="text-base font-bold text-white leading-snug">{lastOrderConfig.popupTitle}</h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed text-center">{lastOrderConfig.popupMessage}</p>
              {lastOrderConfig.tutorContact && (
                <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Icon name="UserIcon" size={18} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">请联系</p>
                    <p className="font-bold text-purple-700 text-sm">{lastOrderConfig.tutorContact}</p>
                  </div>
                </div>
              )}
              <button onClick={() => setShowLastOrderPopup(false)} className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2">
                <Icon name="CheckIcon" size={16} />
                我已了解，立即联系 Tutor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bonus Order Continuation Modal */}
      {bonusModalState !== 'idle' && selectedPending && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-y-auto max-h-[90vh]">
            {bonusModalState === 'confirm' && (
              <>
                <div className="relative overflow-hidden px-5 pt-5 pb-4 text-center" style={{ background: 'linear-gradient(145deg, #0f3d22 0%, #1a6b3c 45%, #0f4a28 100%)' }}>
                  <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #c9a84c, #a8862e)' }}>
                    <Icon name="GiftIcon" size={22} className="text-white" />
                  </div>
                  <h2 className="text-white font-bold text-lg">{t('pastBookings.resumeBonusTitle')}</h2>
                  <p className="text-white/70 text-xs mt-1">{t('pastBookings.resumeBonusDesc')}</p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="rounded-2xl overflow-hidden border border-amber-200/60" style={{ background: 'linear-gradient(135deg, #fffbf0, #fef9ec)' }}>
                    <div className="px-4 py-3 flex items-center gap-3 border-b border-amber-100">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #c9a84c, #a8862e)' }}>
                        <Icon name="GiftIcon" size={18} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 text-sm truncate">{selectedPending.hotel}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Icon name="MapPinIcon" size={10} />{selectedPending.location}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-amber-100">
                      <div className="px-4 py-3 text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">{t('pastBookings.amountPaid')}</p>
                        <p className="font-mono font-bold text-gray-800 text-base">RM {selectedPending.amount.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="px-4 py-3 text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">{t('pastBookings.commission')}</p>
                        <p className="font-mono font-bold text-base" style={{ color: '#a8862e' }}>+RM {selectedPending.commission.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={closeBonusModal} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">{t('pastBookings.cancelBtn')}</button>
                    <button onClick={startBonusProcessing} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #c9a84c, #a8862e)' }}>
                      <Icon name="BoltIcon" size={14} />
                      {t('pastBookings.continueOrder')}
                    </button>
                  </div>
                </div>
              </>
            )}

            {bonusModalState === 'processing' && (
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(26,107,60,0.1)', border: '2px solid rgba(26,107,60,0.3)' }}>
                    <Icon name="ArrowPathIcon" size={24} className="text-green-600 animate-spin" />
                  </div>
                  <h3 className="font-bold text-gray-800 text-base">{t('pastBookings.processingBonus')}</h3>
                  <p className="text-gray-500 text-xs mt-1">{selectedPending.hotel}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500">系统匹配进度</span>
                    <span className="text-sm font-bold font-mono text-green-700">{Math.round(bonusProgress)}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${bonusProgress}%`, background: 'linear-gradient(90deg, #1a6b3c, #c9a84c)' }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {platforms.map((plat, idx) => (
                    <div key={plat.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all" style={{ backgroundColor: idx <= bonusPlatform ? plat.bg : '#f9f9f9', borderColor: idx <= bonusPlatform ? plat.color + '40' : '#e5e5e5', opacity: idx <= bonusPlatform ? 1 : 0.4 }}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: idx <= bonusPlatform ? plat.color : '#ccc' }} />
                      <span className="text-xs font-semibold" style={{ color: idx <= bonusPlatform ? plat.color : '#aaa' }}>{plat.name}</span>
                      {idx <= bonusPlatform && <Icon name="CheckIcon" size={11} className="ml-auto" style={{ color: plat.color } as React.CSSProperties} />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bonusModalState === 'complete' && (
              <div className="p-6 space-y-4 text-center">
                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #c9a84c, #a8862e)' }}>
                  <Icon name="CheckIcon" size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{t('pastBookings.bonusComplete')}</h3>
                  <p className="text-gray-500 text-sm mt-1">{t('pastBookings.bonusCompleteDesc')}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">酒店</span>
                    <span className="font-semibold text-gray-800 truncate max-w-[60%]">{selectedPending.hotel}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">已获佣金</span>
                    <span className="font-mono font-bold text-lg" style={{ color: '#a8862e' }}>+RM {selectedPending.commission.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <button onClick={completeBonusOrder} className="w-full py-3 rounded-xl font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #1a6b3c, #145530)' }}>
                  {t('pastBookings.done')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderDetail && (
        <div className="modal-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Order Status</h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 font-mono">{selectedOrderDetail.id}</p>
              </div>
              <button onClick={() => setSelectedOrderDetail(null)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <Icon name="XMarkIcon" size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-[hsl(var(--border))]">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Icon name="BuildingOfficeIcon" size={18} className="text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{selectedOrderDetail.hotel}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1 mt-0.5"><Icon name="MapPinIcon" size={10} />{selectedOrderDetail.location}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="font-mono font-bold text-primary-600">RM {selectedOrderDetail.amountPaid.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</p>
                  {selectedOrderDetail.commission > 0 && <p className="font-mono text-xs font-bold text-gold-600">+RM {selectedOrderDetail.commission.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</p>}
                </div>
              </div>

              {selectedOrderDetail.lifecycleStatus && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Order Lifecycle Progress</p>
                  {selectedOrderDetail.lifecycleStatus === 'disputed' ? (
                    <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <Icon name="ExclamationTriangleIcon" size={18} className="text-red-600 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-red-700 text-sm">Order Disputed</p>
                        <p className="text-xs text-red-600 mt-0.5">This order has been flagged for dispute.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      {LIFECYCLE_STEPS.map((step, idx) => {
                        const cfg = ORDER_STATUS_CONFIG[step];
                        const currentStep = ORDER_STATUS_CONFIG[selectedOrderDetail.lifecycleStatus!]?.step ?? -1;
                        const isCompleted = cfg.step < currentStep;
                        const isActive = cfg.step === currentStep;
                        return (
                          <React.Fragment key={step}>
                            <div className="flex flex-col items-center gap-1">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${isCompleted ? 'bg-green-500 border-green-500' : isActive ? `${cfg.bg} ${cfg.border}` : 'bg-gray-100 border-gray-200'}`}>
                                {isCompleted ? <Icon name="CheckIcon" size={16} className="text-white" /> : <Icon name={cfg.icon as any} size={15} className={isActive ? cfg.text : 'text-gray-400'} />}
                              </div>
                              <span className={`text-[10px] font-semibold ${isActive ? cfg.text : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>{cfg.label}</span>
                            </div>
                            {idx < LIFECYCLE_STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 rounded-full ${isCompleted ? 'bg-green-400' : 'bg-gray-200'}`} />}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => setSelectedOrderDetail(null)} className="w-full py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
