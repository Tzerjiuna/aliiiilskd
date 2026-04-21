'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { useLanguage } from '@/context/LanguageContext';
import { fetchActiveHotels } from '@/services/hotelService';
import type { Hotel } from '@/types/hotel';

// TODO: GET /api/hotels?active=true
const HOTEL_ORDER_KEY = 'hotelDisplayOrder';
const HOTEL_FULL_KEY = 'hotelFullStatus';

function getSortedFromLoaded(loaded: Hotel[]): Hotel[] {
  if (typeof window === 'undefined') return loaded;
  try {
    const saved = localStorage.getItem(HOTEL_ORDER_KEY);
    if (saved) {
      const order: string[] = JSON.parse(saved);
      return [...loaded].sort((a, b) => {
        const ai = order.indexOf(a.id);
        const bi = order.indexOf(b.id);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
    }
  } catch {}
  return loaded;
}

function getFullStatus(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem(HOTEL_FULL_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}


const bonusHotels = [
{
  id: 'hotel-001',
  name: 'The Majestic Kuala Lumpur',
  amount: 640,
  commission: 64
},
{
  id: 'hotel-005',
  name: 'Mandarin Oriental KL',
  amount: 680,
  commission: 82
}];


const platformLogos = [
{ id: 'plat-agoda', name: 'Agoda', color: '#ef4444', bg: '#fef2f2' },
{ id: 'plat-trip', name: 'Trip.com', color: '#1a6b3c', bg: '#f0faf4' },
{ id: 'plat-booking', name: 'Booking.com', color: '#003580', bg: '#eff6ff' },
{ id: 'plat-traveloka', name: 'Traveloka', color: '#0066cc', bg: '#eff6ff' },
{ id: 'plat-halal', name: 'HalalBooking', color: '#c9a84c', bg: '#fdf8ec' }];


type BookingState = 'idle' | 'panel' | 'processing' | 'complete' | 'bonus' | 'bonus_processing' | 'bonus_complete';

export default function HotelBookingClient() {
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [days, setDays] = useState(2);
  const [bookingState, setBookingState] = useState<BookingState>('idle');
  const [progress, setProgress] = useState(0);
  const [currentPlatform, setCurrentPlatform] = useState(0);
  const [walletBalance] = useState(1250);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [selectedBonusHotel, setSelectedBonusHotel] = useState<typeof bonusHotels[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLocation, setFilterLocation] = useState('Semua');
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [sortedHotels, setSortedHotels] = useState<Hotel[]>([]);
  const [showPendingWarning, setShowPendingWarning] = useState(false);
  const [fullStatus, setFullStatus] = useState<Record<string, boolean>>({});
  const { t, lang } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    fetchActiveHotels()
      .then((data) => {
        setHotels(data);
        setSortedHotels(getSortedFromLoaded(data));
      })
      .catch(() => toast.error('Failed to load hotels'))
      .finally(() => setHotelsLoading(false));
  }, []);

  useEffect(() => {
    setFullStatus(getFullStatus());
    // Refresh full status periodically in case admin changed it
    const interval = setInterval(() => setFullStatus(getFullStatus()), 3000);
    return () => clearInterval(interval);
  }, []);

  const hasPendingBonusOrder = useCallback((): boolean => {
    try {
      const stored = localStorage.getItem('pendingBonusOrders');
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) && parsed.length > 0;
      }
      // Demo data: treat as having a pending order if no key exists yet
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleHotelClick = (hotel: Hotel) => {
    if (hasPendingBonusOrder()) {
      setShowPendingWarning(true);
      return;
    }
    if (fullStatus[hotel.id]) {
      toast.error(t('booking.fullHotel'));
      return;
    }
    setSelectedHotel(hotel);
    setDays(hotel.minDays);
    setBookingState('panel');
  };

  const goToPendingTab = () => {
    setShowPendingWarning(false);
    router.push('/past-bookings?tab=pending');
  };

  const locations = ['Semua', 'Kuala Lumpur', 'KLCC, KL', 'Putrajaya', 'Petaling Jaya, Selangor', 'Bukit Bintang, KL', 'Vietnam', 'Turkey', 'Makkah', 'Bangkok', 'Maldives', 'Korea', 'Indonesia', 'Malaysia', 'France', 'Dubai', 'England', 'Switzerland', 'Italy'];

  const filteredHotels = sortedHotels.filter((h) => {
    const matchSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchLocation = filterLocation === 'Semua' || h.location === filterLocation;
    return matchSearch && matchLocation;
  });

  const total = selectedHotel ? selectedHotel.pricePerNight * days : 0;
  const commissionRate = selectedHotel ? parseFloat(selectedHotel.commission) / 100 : 0;
  const commissionEarned = Math.round(total * commissionRate);
  const canBook = walletBalance >= total;

  const startBooking = useCallback(() => {
    if (!selectedHotel) return;
    if (!canBook) {
      toast.error('Baki dompet tidak mencukupi. Sila buat top-up.');
      return;
    }
    setBookingState('processing');
    setProgress(0);
    setCurrentPlatform(0);

    // TODO: POST /api/orders { hotel_id, days, amount, user_id }
    const duration = 45000;
    const startTime = Date.now();

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(elapsed / duration * 100, 99);
      setProgress(pct);
      setCurrentPlatform(Math.floor(elapsed / duration * platformLogos.length));

      if (elapsed >= duration) {
        clearInterval(intervalId);
        setProgress(100);
        setTimeout(() => {
          setCompletedOrder({
            hotel: selectedHotel.name,
            amount: total,
            commission: commissionEarned,
            commissionRate: selectedHotel.commission,
            orderId: `order-${Date.now()}`
          });
          setBookingState('complete');
        }, 500);
      }
    }, 200);
  }, [selectedHotel, canBook, total, commissionEarned]);

  const handleComplete = () => {
    // Simulate bonus order trigger (30% chance after first order)
    const triggerBonus = Math.random() < 0.4;
    if (triggerBonus) {
      setBookingState('bonus');
    } else {
      toast.success(`Tempahan berjaya! Komisen RM ${commissionEarned} ditambah ke dompet.`);
      setBookingState('idle');
      setSelectedHotel(null);
    }
  };

  const acceptBonusOrder = (bonusHotel: typeof bonusHotels[0]) => {
    setSelectedBonusHotel(bonusHotel);
    setBookingState('bonus_processing');
    setProgress(0);
    setCurrentPlatform(0);

    // TODO: POST /api/orders { hotel_id, amount, is_bonus: true, linked_order_id }
    const duration = 45000;
    const startTime = Date.now();

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(elapsed / duration * 100, 99);
      setProgress(pct);
      setCurrentPlatform(Math.floor(elapsed / duration * platformLogos.length));

      if (elapsed >= duration) {
        clearInterval(intervalId);
        setProgress(100);
        setTimeout(() => {
          setBookingState('bonus_complete');
        }, 500);
      }
    }, 200);
  };

  const handleBonusComplete = () => {
    toast.success(`Kedua-dua pesanan selesai! Komisen digabungkan telah ditambah ke dompet.`);
    setBookingState('idle');
    setSelectedHotel(null);
    setSelectedBonusHotel(null);
    setCompletedOrder(null);
  };

  return (
    <div className="space-y-6">
      {/* Pending Bonus Order Warning Modal */}
      {showPendingWarning &&
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
              <Icon name="ExclamationTriangleIcon" size={32} className="text-orange-500" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-800 mb-1">
                {t('booking.pendingWarningTitle')}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {t('booking.pendingWarningDesc')}
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full mt-1">
              <button
              onClick={goToPendingTab}
              className="w-full btn-primary py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
              
                <Icon name="ClockIcon" size={16} />
                {t('booking.goToPendingOrder')}
              </button>
              <button
              onClick={() => setShowPendingWarning(false)}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors">
              
                {t('booking.cancel')}
              </button>
            </div>
          </div>
        </div>
      }

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('booking.title')}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">{t('booking.halalCertified')} · {sortedHotels.length}</p>
        </div>
        <div className="flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-xl px-4 py-2">
          <Icon name="WalletIcon" size={16} className="text-primary-500" />
          <span className="text-sm font-medium text-gray-600">{t('booking.walletBalance')}:</span>
          <span className="font-mono font-bold text-primary-600">RM {walletBalance.toLocaleString()}</span>
        </div>
      </div>

      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('booking.searchHotel')}
            className="w-full pl-9 pr-4 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 bg-white" />
          
        </div>
        <div className="flex gap-2 flex-wrap">
          {locations.slice(0, 4).map((loc) =>
          <button
            key={`loc-${loc}`}
            onClick={() => setFilterLocation(loc)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
            filterLocation === loc ?
            'bg-primary-500 text-white' : 'bg-white border border-[hsl(var(--border))] text-gray-600 hover:border-primary-300'}`
            }>
            
              {loc === 'Semua' ? t('booking.allHotels') : loc}
            </button>
          )}
        </div>
      </div>

      {/* Hotel grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-5">
        {hotelsLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-elevated overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))
        ) : filteredHotels.map((hotel) => {
          const isFull = fullStatus[hotel.id] || false;
          return (
            <div
              key={hotel.id}
              className={`card-elevated overflow-hidden group transition-all ${
              isFull ?
              'opacity-75 cursor-not-allowed' : 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5'} ${
              selectedHotel?.id === hotel.id ? 'ring-2 ring-primary-500' : ''}`}
              onClick={() => !isFull && handleHotelClick(hotel)}>
          
            <div className="relative h-48 overflow-hidden">
              <AppImage
                  src={hotel.image}
                  alt={hotel.imageAlt}
                  fill
                  className={`object-cover transition-transform duration-500 ${!isFull ? 'group-hover:scale-105' : ''}`}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
            
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              {isFull &&
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="bg-red-600 text-white font-black text-2xl px-6 py-2 rounded-xl shadow-lg tracking-widest rotate-[-8deg]">
                    FULL
                  </div>
                </div>
                }
              <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                <span className="badge-halal">🌙 HALAL</span>
                {hotel.bonusEligible &&
                  <span className="badge-gold text-[10px] font-bold px-2 py-0.5 rounded-full">⭐ BONUS</span>
                  }
              </div>
              <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
                <Icon name="StarIcon" size={12} className="text-gold-500" variant="solid" />
                <span className="text-xs font-bold text-gray-700">{hotel.rating}</span>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-bold text-gray-800 text-sm leading-snug">{hotel.name}</h3>
                {isFull &&
                  <span className="flex-shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-300">FULL</span>
                  }
              </div>
              <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] mb-3">
                <Icon name="MapPinIcon" size={12} />
                {hotel.location}
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {hotel.halalTags.slice(0, 3).map((tag) =>
                  <span key={`${hotel.id}-tag-${tag}`} className="text-[10px] bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 font-medium">
                    {tag}
                  </span>
                  )}
                {hotel.halalTags.length > 3 &&
                  <span className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">+{hotel.halalTags.length - 3}</span>
                  }
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold font-mono text-primary-600">RM {hotel.pricePerNight}</span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">{t('booking.perNightLabel')}</span>
                  </div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">{t('booking.minNightsLabel')} {hotel.minDays} {t('booking.nights_label')} · {t('booking.commissionShort')} {hotel.commission}</div>
                </div>
                {isFull ?
                  <div className="px-4 py-2 rounded-xl bg-red-100 border border-red-200 text-red-600 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed">
                    <Icon name="XCircleIcon" size={13} />
                    FULL
                  </div> :

                  <button
                    onClick={(e) => {e.stopPropagation();handleHotelClick(hotel);}}
                    className="btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <Icon name="CalendarDaysIcon" size={13} />
                    {t('booking.bookBtn')}
                  </button>
                  }
              </div>
            </div>
          </div>);

        })}
        {filteredHotels.length === 0 &&
        <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Icon name="BuildingOfficeIcon" size={28} className="text-gray-400" />
            </div>
            <h3 className="font-bold text-gray-600 mb-1">{t('booking.noHotelFound')}</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{t('booking.noHotelDesc')}</p>
          </div>
        }
      </div>

      {/* Booking panel modal */}
      {bookingState === 'panel' && selectedHotel &&
      <div className="modal-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-800">{t('booking.bookingDetails')}</h2>
                <button onClick={() => {setBookingState('idle');setSelectedHotel(null);}} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <Icon name="XMarkIcon" size={18} className="text-gray-500" />
                </button>
              </div>

              {/* Hotel summary */}
              <div className="relative h-32 rounded-xl overflow-hidden mb-4">
                <AppImage src={selectedHotel.image} alt={selectedHotel.imageAlt} fill className="object-cover" sizes="448px" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <div className="text-white font-bold text-sm">{selectedHotel.name}</div>
                  <div className="text-white/70 text-xs flex items-center gap-1">
                    <Icon name="MapPinIcon" size={10} />
                    {selectedHotel.location}
                  </div>
                </div>
              </div>

              {/* Day selector */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('booking.numberOfNights')}</label>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">{t('booking.minimumNights')} {selectedHotel.minDays} {t('booking.nights_label')}</p>
                <div className="flex items-center gap-3">
                  <button
                  onClick={() => setDays((d) => Math.max(selectedHotel.minDays, d - 1))}
                  className="w-10 h-10 rounded-xl border border-[hsl(var(--border))] flex items-center justify-center hover:bg-gray-50 transition-colors font-bold text-lg">
                  
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-2xl font-bold font-mono text-gray-800">{days}</span>
                    <span className="text-sm text-[hsl(var(--muted-foreground))] ml-1">{t('booking.nights_label')}</span>
                  </div>
                  <button
                  onClick={() => setDays((d) => d + 1)}
                  className="w-10 h-10 rounded-xl border border-[hsl(var(--border))] flex items-center justify-center hover:bg-gray-50 transition-colors font-bold text-lg">
                  
                    +
                  </button>
                </div>
              </div>

              {/* Calculation */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">RM {selectedHotel.pricePerNight} × {days} {t('booking.nights_label')}</span>
                  <span className="font-mono font-semibold">RM {total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">{t('booking.commissionLabel')} ({selectedHotel.commission})</span>
                  <span className="font-mono font-semibold text-green-600">+RM {commissionEarned}</span>
                </div>
                <div className="border-t border-[hsl(var(--border))] pt-2 flex justify-between">
                  <span className="font-semibold text-gray-700">{t('booking.totalDeducted')}</span>
                  <span className="font-mono font-bold text-primary-600 text-lg">RM {total.toLocaleString()}</span>
                </div>
              </div>

              {/* Wallet check */}
              <div className={`flex items-center gap-2 rounded-xl p-3 mb-4 ${canBook ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <Icon name={canBook ? 'CheckCircleIcon' : 'ExclamationCircleIcon'} size={16} className={canBook ? 'text-green-600' : 'text-red-500'} />
                <div className="text-xs">
                  <span className={canBook ? 'text-green-700' : 'text-red-600'}>
                    {t('booking.walletBalanceLabel')}: <strong className="font-mono">RM {walletBalance.toLocaleString()}</strong>
                    {canBook ? ` — ${t('booking.walletSufficient')}` : ` — ${t('booking.walletInsufficient')}`}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                onClick={() => {setBookingState('idle');setSelectedHotel(null);}}
                className="flex-1 py-3 rounded-xl border border-[hsl(var(--border))] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                
                  {t('booking.cancel')}
                </button>
                <button
                onClick={startBooking}
                disabled={!canBook}
                className="flex-1 btn-primary py-3 rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                
                  <Icon name="CheckIcon" size={16} />
                  {t('booking.confirmBooking')}
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      {/* Processing modal */}
      {bookingState === 'processing' &&
      <div className="modal-overlay fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3">
          <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-y-auto max-h-[90vh]">
            {/* Dark Islamic header */}
            <div className="relative overflow-hidden px-5 py-4 text-center" style={{ background: 'linear-gradient(145deg, #0f3d22 0%, #1a6b3c 100%)' }}>
              <div className="absolute inset-0 opacity-[0.1]">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="islamicProcMain" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                      <polygon points="10,5 13,15 23,15 15,22 18,34 10,26 2,34 5,22 3,15 16,15" fill="none" stroke="#c9a84c" strokeWidth="0.8" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#islamicProcMain)" />
                </svg>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #c9a84c 0%, transparent 70%)' }} />
              <div className="relative">
                <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.15)', border: '2px solid rgba(201,168,76,0.4)' }}>
                  <Icon name="ArrowPathIcon" size={22} className="text-amber-300 animate-spin" />
                </div>
                <h3 className="font-bold text-white text-base">{t('booking.processingTitle')}</h3>
                <p className="text-white/60 text-xs mt-0.5">{selectedHotel?.name}</p>
                <div className="flex items-center justify-center gap-2 mt-1.5">
                  <div className="h-px w-8 opacity-40" style={{ background: 'linear-gradient(to right, transparent, #c9a84c)' }} />
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#c9a84c' }} />
                  <div className="h-px w-8 opacity-40" style={{ background: 'linear-gradient(to left, transparent, #c9a84c)' }} />
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {/* Order info card */}
              <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'rgba(201,168,76,0.3)', background: 'linear-gradient(135deg, #fffbf0 0%, #fef9ec 100%)' }}>
                <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #1a6b3c, #145530)' }}>
                  <Icon name="ClipboardDocumentListIcon" size={13} className="text-white/80" />
                  <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">{t('booking.orderSettlement')}</span>
                </div>
                <div className="divide-y divide-amber-100">
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Icon name="BuildingOffice2Icon" size={12} className="text-gray-400" />
                      {t('booking.hotelName')}
                    </span>
                    <span className="font-mono font-semibold text-gray-800 text-xs text-right max-w-[55%] truncate">{selectedHotel?.name}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Icon name="HashtagIcon" size={12} className="text-gray-400" />
                      {t('booking.orderNumber')}
                    </span>
                    <span className="font-mono font-semibold text-gray-700 text-xs">ORD-{Date.now().toString().slice(-8)}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs text-gray-500">{t('booking.totalPaid')}</span>
                    <span className="font-mono font-semibold text-gray-800">RM {total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs text-gray-500">{t('booking.commissionLabel')}</span>
                    <span className="font-mono text-xs" style={{ color: '#1a6b3c' }}>{selectedHotel?.commission}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5" style={{ background: 'rgba(201,168,76,0.07)' }}>
                    <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: '#a8862e' }}>
                      <Icon name="SparklesIcon" size={12} style={{ color: '#a8862e' } as React.CSSProperties} />
                      {t('booking.commissionReceived')}
                    </span>
                    <span className="font-mono font-bold text-sm" style={{ color: '#a8862e' }}>+RM {commissionEarned}</span>
                  </div>
                </div>
              </div>

              {/* Progress section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('booking.progressLabel')}</span>
                  <span className="text-sm font-bold font-mono" style={{ color: '#1a6b3c' }}>{Math.round(progress)}%</span>
                </div>
                <div className="relative w-full h-4 rounded-full overflow-hidden" style={{ background: '#e8f0eb' }}>
                  <div
                    className="h-full rounded-full relative overflow-hidden"
                    style={{
                      width: `${progress}%`,
                      transition: 'width 0.2s linear',
                      background: '#1a6b3c',
                    }}>
                    <div
                      className="absolute inset-0"
                      style={{
                        width: progress > 0 ? `${(100 / progress) * 100}%` : '100%',
                        background: 'linear-gradient(90deg, #1a6b3c 0%, #2d9e5f 40%, #c9a84c 75%, #e8c96a 100%)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
                      }} />
                    <div className="absolute inset-0 opacity-30" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)', animation: 'shimmer 2s infinite' }} />
                  </div>
                  {progress > 2 && progress < 100 &&
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white"
                      style={{
                        left: `calc(${progress}% - 6px)`,
                        background: '#c9a84c',
                        boxShadow: '0 0 8px rgba(201,168,76,0.9)'
                      }} />
                  }
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400">{t('booking.processingStatus')}</span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {Math.round(45 - progress / 100 * 45)}{t('booking.secondsLeft')}
                  </span>
                </div>
              </div>

              {/* Platform matching indicators */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('booking.syncingPlatforms')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {platformLogos.map((plat, idx) =>
                <div
                  key={plat.id}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-500"
                  style={{
                    backgroundColor: idx <= currentPlatform ? plat.bg : '#f9f9f9',
                    borderColor: idx <= currentPlatform ? plat.color + '40' : '#e5e5e5',
                    opacity: idx <= currentPlatform ? 1 : 0.4,
                    transform: idx <= currentPlatform ? 'scale(1)' : 'scale(0.97)'
                  }}>
                  
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: idx <= currentPlatform ? plat.color : '#ccc' }} />
                      <span className="text-xs font-semibold" style={{ color: idx <= currentPlatform ? plat.color : '#aaa' }}>{plat.name}</span>
                      {idx <= currentPlatform &&
                  <Icon name="CheckIcon" size={11} className="ml-auto" style={{ color: plat.color } as React.CSSProperties} />
                  }
                    </div>
                )}
                </div>
              </div>

              {/* Animated status text */}
              <div className="flex items-center justify-center gap-2 py-2">
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#1a6b3c', animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#c9a84c', animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#1a6b3c', animationDelay: '300ms' }} />
                <span className="text-xs text-gray-400 ml-1">{t('booking.processingWait')}</span>
              </div>
            </div>
          </div>
        </div>
      }

      {/* Completion modal */}
      {bookingState === 'complete' && completedOrder &&
      <div className="modal-overlay fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3">
          <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-y-auto max-h-[90vh]">
            {/* Success header with Islamic pattern */}
            <div className="relative overflow-hidden px-5 py-5 text-center" style={{ background: 'linear-gradient(145deg, #0a3d1f 0%, #1a6b3c 50%, #145530 100%)' }}>
              <div className="absolute inset-0 opacity-[0.12]">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="islamicCompleteMain" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                      <polygon points="30,2 36,12 48,12 39,20 43,32 30,25 17,32 21,20 12,12 24,12" fill="none" stroke="#c9a84c" strokeWidth="0.8" />
                      <polygon points="30,10 34,18 43,18 36,24 39,33 30,28 21,33 24,24 17,18 26,18" fill="none" stroke="#c9a84c" strokeWidth="0.4" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#islamicCompleteMain)" />
                </svg>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #c9a84c 0%, transparent 70%)' }} />
              <div className="relative">
                <div className="relative w-16 h-16 mx-auto mb-3">
                  <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: '#c9a84c' }} />
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #c9a84c, #a8862e)', boxShadow: '0 0 24px rgba(201,168,76,0.5)' }}>
                    <Icon name="CheckIcon" size={28} className="text-white" />
                  </div>
                </div>
                <h3 className="font-bold text-white text-lg">{t('booking.bookingSuccessTitle')}</h3>
                <p className="text-white/65 text-xs mt-1">{t('booking.orderComplete')}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="h-px w-8 opacity-40" style={{ background: 'linear-gradient(to right, transparent, #c9a84c)' }} />
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#c9a84c' }} />
                  <div className="h-px w-8 opacity-40" style={{ background: 'linear-gradient(to left, transparent, #c9a84c)' }} />
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {/* Settlement summary card */}
              <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'rgba(26,107,60,0.2)' }}>
                <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #1a6b3c, #145530)' }}>
                  <Icon name="ClipboardDocumentCheckIcon" size={14} className="text-white/80" />
                  <span className="text-xs font-bold text-white/90 uppercase tracking-wider">{t('booking.orderSettlementDetails')}</span>
                </div>
                <div className="divide-y divide-amber-50">
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-xs text-gray-500">{t('booking.orderNo')}</span>
                    <span className="font-mono text-xs text-gray-700">{completedOrder.orderId}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-xs text-gray-500">{t('booking.totalPaid')}</span>
                    <span className="font-mono text-xs font-semibold text-gray-800">RM {completedOrder.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-xs text-gray-500">{t('booking.commissionLabel')}</span>
                    <span className="font-mono text-xs text-green-600 font-semibold">+RM {completedOrder.commission}</span>
                  </div>
                </div>
              </div>

              {/* Congratulations notice */}
              <div className="flex items-center gap-3 rounded-xl px-4 py-3 border" style={{ background: 'rgba(26,107,60,0.04)', borderColor: 'rgba(26,107,60,0.15)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(26,107,60,0.1)' }}>
                  <Icon name="CheckCircleIcon" size={15} style={{ color: '#1a6b3c' } as React.CSSProperties} />
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#1a6b3c' }}>{t('booking.congratsMsg')}</p>
              </div>

              <button
              onClick={handleComplete}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #1a6b3c, #145530)', boxShadow: '0 4px 16px rgba(26,107,60,0.3)' }}>
                <Icon name="CheckCircleIcon" size={16} />
                {t('booking.proceed')}
              </button>
            </div>
          </div>
        </div>
      }

      {/* Bonus order popup */}
      {bookingState === 'bonus' &&
      <div className="modal-overlay fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3">
          <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-y-auto max-h-[90vh]">
            {/* Gold header */}
            <div className="bg-gradient-to-r from-gold-600 to-gold-400 p-4 text-center relative">
              <div className="absolute inset-0 opacity-10">
                <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                  <polygon points="10,5 13,15 23,15 15,21 18,31 10,25 2,31 5,21 -3,15 7,15" fill="white" />
                  <polygon points="50,2 53,12 63,12 55,18 58,28 50,22 42,28 45,18 37,12 47,12" fill="white" />
                  <polygon points="90,5 93,15 103,15 95,21 98,31 90,25 82,31 85,21 77,15 87,15" fill="white" />
                </svg>
              </div>
              <div className="relative">
                <span className="text-3xl mb-2 block">🎁</span>
                <h2 className="text-white font-bold text-xl">{t('booking.bonusSelectedTitle')}</h2>
                <p className="text-white/80 text-sm mt-1">{t('booking.bonusSelectedDesc')}</p>
              </div>
            </div>

            <div className="p-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-start gap-2">
                <Icon name="LockClosedIcon" size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 font-medium">
                  {t('booking.bonusLockedWarning')}
                </p>
              </div>

              <p className="text-sm font-semibold text-gray-700 mb-3">{t('booking.selectBonusHotelLabel')}</p>

              <div className="space-y-3">
                {bonusHotels.map((bh) =>
              <div key={`bonus-${bh.id}`} className="border-2 border-[hsl(var(--border))] rounded-xl p-4 hover:border-gold-400 transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm text-gray-800 group-hover:text-gold-600 transition-colors">{bh.name}</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{t('booking.bonusCommission')}: +RM {bh.commission}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-primary-600">RM {bh.amount}</div>
                        <button
                      onClick={() => acceptBonusOrder(bh)}
                      className="btn-gold text-xs px-3 py-1.5 rounded-lg font-bold mt-1 flex items-center gap-1">
                      
                          <Icon name="BoltIcon" size={12} />
                          {t('booking.selectBtn')}
                        </button>
                      </div>
                    </div>
                  </div>
              )}
              </div>

              <p className="text-center text-xs text-[hsl(var(--muted-foreground))] mt-4">
                {t('booking.bonusCannotSkip')}
              </p>
            </div>
          </div>
        </div>
      }

      {/* Bonus processing modal */}
      {bookingState === 'bonus_processing' &&
      <div className="modal-overlay fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3">
          <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-y-auto max-h-[90vh]">
            {/* Dark Islamic header */}
            <div className="relative overflow-hidden px-5 py-4 text-center" style={{ background: 'linear-gradient(145deg, #0f3d22 0%, #1a6b3c 100%)' }}>
              <div className="absolute inset-0 opacity-[0.1]">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="islamicBonusProc" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                      <polygon points="30,2 36,12 48,12 39,20 43,32 30,25 17,32 21,20 12,12 24,12" fill="none" stroke="#c9a84c" strokeWidth="0.8" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#islamicBonusProc)" />
                </svg>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #c9a84c 0%, transparent 70%)' }} />
              <div className="relative">
                <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.15)', border: '2px solid rgba(201,168,76,0.4)' }}>
                  <Icon name="ArrowPathIcon" size={22} className="text-amber-300 animate-spin" />
                </div>
                <h3 className="font-bold text-white text-base">{t('booking.bonusProcessingTitle')}</h3>
                <p className="text-white/60 text-xs mt-0.5">{selectedBonusHotel?.name}</p>
                <p className="text-amber-300/80 text-[11px] mt-1 font-medium">🔒 {t('booking.bonusProcessingDesc')}</p>
                <div className="flex items-center justify-center gap-2 mt-1.5">
                  <div className="h-px w-8 opacity-40" style={{ background: 'linear-gradient(to right, transparent, #c9a84c)' }} />
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#c9a84c' }} />
                  <div className="h-px w-8 opacity-40" style={{ background: 'linear-gradient(to left, transparent, #c9a84c)' }} />
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {/* Order info card */}
              <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'rgba(201,168,76,0.3)', background: 'linear-gradient(135deg, #fffbf0 0%, #fef9ec 100%)' }}>
                <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #c9a84c, #a8862e)' }}>
                  <Icon name="GiftIcon" size={13} className="text-white/90" />
                  <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">{t('booking.bonusOrderSettlement')}</span>
                </div>
                <div className="divide-y divide-amber-100">
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Icon name="BuildingOffice2Icon" size={11} className="text-gray-400" />
                      {t('booking.hotelName')}
                    </span>
                    <span className="font-semibold text-gray-800 text-xs text-right max-w-[55%] truncate">{selectedBonusHotel.name}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Icon name="HashtagIcon" size={12} className="text-gray-400" />
                      {t('booking.orderNumber')}
                    </span>
                    <span className="font-mono font-semibold text-gray-700 text-xs">BONUS-{Date.now().toString().slice(-8)}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs text-gray-500">{t('booking.bonusTotalPaid')}</span>
                    <span className="font-mono font-semibold text-gray-800">RM {selectedBonusHotel.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs text-gray-500">{t('booking.bonusCommissionLabel')}</span>
                    <span className="font-mono text-xs text-green-600 font-semibold">+RM {selectedBonusHotel.commission}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5" style={{ background: 'rgba(201,168,76,0.07)' }}>
                    <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: '#a8862e' }}>
                      <Icon name="SparklesIcon" size={12} style={{ color: '#a8862e' } as React.CSSProperties} />
                      {t('booking.commissionReceived')}
                    </span>
                    <span className="font-mono font-bold text-sm" style={{ color: '#a8862e' }}>+RM {selectedBonusHotel?.commission}</span>
                  </div>
                </div>
              </div>

              {/* Progress section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('booking.progressLabel')}</span>
                  <span className="text-sm font-bold font-mono" style={{ color: '#1a6b3c' }}>{Math.round(progress)}%</span>
                </div>
                <div className="relative w-full h-4 rounded-full overflow-hidden" style={{ background: '#e8f0eb' }}>
                  <div
                    className="h-full rounded-full relative overflow-hidden"
                    style={{
                      width: `${progress}%`,
                      transition: 'width 0.2s linear',
                      background: '#1a6b3c',
                    }}>
                    <div
                      className="absolute inset-0"
                      style={{
                        width: progress > 0 ? `${(100 / progress) * 100}%` : '100%',
                        background: 'linear-gradient(90deg, #1a6b3c 0%, #2d9e5f 40%, #c9a84c 75%, #e8c96a 100%)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
                      }} />
                    <div className="absolute inset-0 opacity-30" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)', animation: 'shimmer 2s infinite' }} />
                  </div>
                  {progress > 2 && progress < 100 &&
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white"
                      style={{
                        left: `calc(${progress}% - 6px)`,
                        background: '#c9a84c',
                        boxShadow: '0 0 8px rgba(201,168,76,0.9)'
                      }} />
                  }
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400">{t('booking.processingStatus')}</span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {Math.round(45 - progress / 100 * 45)}{t('booking.secondsLeft')}
                  </span>
                </div>
              </div>

              {/* Platform matching indicators */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('booking.syncingPlatforms')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {platformLogos.map((plat, idx) =>
                <div
                  key={plat.id}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-500"
                  style={{
                    backgroundColor: idx <= currentPlatform ? plat.bg : '#f9f9f9',
                    borderColor: idx <= currentPlatform ? plat.color + '40' : '#e5e5e5',
                    opacity: idx <= currentPlatform ? 1 : 0.4,
                    transform: idx <= currentPlatform ? 'scale(1)' : 'scale(0.97)'
                  }}>
                  
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: idx <= currentPlatform ? plat.color : '#ccc' }} />
                      <span className="text-xs font-semibold" style={{ color: idx <= currentPlatform ? plat.color : '#aaa' }}>{plat.name}</span>
                      {idx <= currentPlatform &&
                  <Icon name="CheckIcon" size={11} className="ml-auto" style={{ color: plat.color } as React.CSSProperties} />
                  }
                    </div>
                )}
                </div>
              </div>

              {/* Animated status text */}
              <div className="flex items-center justify-center gap-2 py-2">
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#1a6b3c', animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#c9a84c', animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#1a6b3c', animationDelay: '300ms' }} />
                <span className="text-xs text-gray-400 ml-1">{t('booking.processingWait')}</span>
              </div>
            </div>
          </div>
        </div>
      }

      {/* Bonus completion modal — shows combined commissions */}
      {bookingState === 'bonus_complete' && completedOrder && selectedBonusHotel &&
      <div className="modal-overlay fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3">
          <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-y-auto max-h-[90vh]">
            {/* Success header with Islamic pattern */}
            <div className="relative overflow-hidden px-5 py-5 text-center" style={{ background: 'linear-gradient(145deg, #0a3d1f 0%, #1a6b3c 50%, #145530 100%)' }}>
              <div className="absolute inset-0 opacity-[0.12]">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="islamicBonusComplete" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                      <polygon points="30,2 36,12 48,12 39,20 43,32 30,25 17,32 21,20 12,12 24,12" fill="none" stroke="#c9a84c" strokeWidth="0.8" />
                      <polygon points="30,10 34,18 43,18 36,24 39,33 30,28 21,33 24,24 17,18 26,18" fill="none" stroke="#c9a84c" strokeWidth="0.4" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#islamicBonusComplete)" />
                </svg>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #c9a84c 0%, transparent 70%)' }} />
              <div className="relative">
                <div className="relative w-16 h-16 mx-auto mb-3">
                  <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: '#c9a84c' }} />
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #c9a84c, #a8862e)', boxShadow: '0 0 24px rgba(201,168,76,0.5)' }}>
                    <span className="text-2xl">🎉</span>
                  </div>
                </div>
                <h3 className="font-bold text-white text-lg">{t('booking.bothOrdersComplete')}</h3>
                <p className="text-white/65 text-xs mt-1">{t('booking.bothOrdersDesc')}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="h-px w-8 opacity-40" style={{ background: 'linear-gradient(to right, transparent, #c9a84c)' }} />
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#c9a84c' }} />
                  <div className="h-px w-8 opacity-40" style={{ background: 'linear-gradient(to left, transparent, #c9a84c)' }} />
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {/* Settlement summary card */}
              <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'rgba(26,107,60,0.2)' }}>
                <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #1a6b3c, #145530)' }}>
                  <Icon name="ClipboardDocumentCheckIcon" size={14} className="text-white/80" />
                  <span className="text-xs font-bold text-white/90 uppercase tracking-wider">{t('booking.orderSettlementDetails')}</span>
                </div>
                <div className="divide-y divide-amber-50">
                  {/* Original order */}
                  <div className="px-4 py-2 bg-gray-50">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{t('booking.originalOrderLabel')}</p>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs text-gray-500">{t('booking.orderNo')}</span>
                    <span className="font-mono text-xs text-gray-700">{completedOrder.orderId}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs text-gray-500">{t('booking.totalPaid')}</span>
                    <span className="font-mono font-semibold text-gray-800">RM {completedOrder.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs text-gray-500">{t('booking.commissionLabel')}</span>
                    <span className="font-mono text-xs text-green-600 font-semibold">+RM {completedOrder.commission}</span>
                  </div>

                  {/* Bonus order */}
                  <div className="px-4 py-2" style={{ background: 'rgba(201,168,76,0.06)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#a8862e' }}>{t('booking.bonusOrderStar')}</p>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Icon name="BuildingOffice2Icon" size={11} className="text-gray-400" />
                      {t('booking.hotelName')}
                    </span>
                    <span className="font-semibold text-gray-800 text-xs text-right max-w-[55%] truncate">{selectedBonusHotel.name}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs text-gray-500">{t('booking.bonusCommissionLabel')}</span>
                    <span className="font-mono text-xs text-green-600 font-semibold">+RM {selectedBonusHotel.commission}</span>
                  </div>

                  <div className="flex justify-between items-center px-4 py-3.5" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.06), rgba(201,168,76,0.12))' }}>
                    <div className="flex items-center gap-1.5">
                      <Icon name="SparklesIcon" size={14} style={{ color: '#a8862e' } as React.CSSProperties} />
                      <span className="font-bold text-sm" style={{ color: '#a8862e' }}>{t('booking.totalCommissionReceived')}</span>
                    </div>
                    <span className="font-mono font-bold text-xl" style={{ color: '#a8862e' }}>
                      +RM {completedOrder.commission + selectedBonusHotel.commission}
                    </span>
                  </div>
                </div>
              </div>

              {/* Congratulations notice */}
              <div className="flex items-center gap-3 rounded-xl px-4 py-3 border" style={{ background: 'rgba(26,107,60,0.04)', borderColor: 'rgba(26,107,60,0.15)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(26,107,60,0.1)' }}>
                  <Icon name="CheckCircleIcon" size={15} style={{ color: '#1a6b3c' } as React.CSSProperties} />
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#1a6b3c' }}>
                  {t('booking.fundsReleasedMsg').replace('sebanyak', 'sebanyak')} <strong className="font-mono">RM {completedOrder.amount.toLocaleString()}</strong> 已释放到您的钱包。
                </p>
              </div>

              <button
              onClick={handleBonusComplete}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #1a6b3c, #145530)', boxShadow: '0 4px 16px rgba(26,107,60,0.3)' }}>
                <Icon name="CheckCircleIcon" size={16} />
                {t('booking.finish')}
              </button>
            </div>
          </div>
        </div>
      }
    </div>);

}