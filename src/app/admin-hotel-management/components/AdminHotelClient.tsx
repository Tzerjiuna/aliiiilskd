'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';
import { useLanguage } from '@/context/LanguageContext';
import {
  fetchAllHotels,
  createHotel,
  updateHotel,
  deleteHotel,
  uploadHotelImage,
} from '@/services/hotelService';
import type { Hotel } from '@/types/hotel';

const HOTEL_ORDER_KEY = 'hotelDisplayOrder';

function getSortedHotels(loaded: Hotel[]): Hotel[] {
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

// Local display type that adds is_full (not stored in DB)
type HotelDisplay = Hotel & { is_full: boolean };

type HotelForm = {
  name: string;
  location: string;
  pricePerNight: string;
  minDays: string;
  commission: string;
  halalTags: string;
  active: boolean;
  bonusEligible: boolean;
};

type GlobalSettingsForm = {
  globalPrice: string;
  globalMinDays: string;
  globalCommission: string;
};

export default function AdminHotelClient() {
  const [hotels, setHotels] = useState<HotelDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('Semua');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<HotelDisplay | null>(null);
  const [deleteModal, setDeleteModal] = useState<HotelDisplay | null>(null);
  const [globalSettingsOpen, setGlobalSettingsOpen] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const hotelForm = useForm<HotelForm>({
    defaultValues: { name: '', location: '', pricePerNight: '', minDays: '1', commission: '10', halalTags: '', active: true, bonusEligible: false }
  });

  const globalForm = useForm<GlobalSettingsForm>({
    defaultValues: { globalPrice: '', globalMinDays: '', globalCommission: '' }
  });

  const loadHotels = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAllHotels();
      const sorted = getSortedHotels(data);
      // Restore is_full from localStorage
      const fullStatus: Record<string, boolean> = (() => {
        try { return JSON.parse(localStorage.getItem('hotelFullStatus') || '{}'); } catch { return {}; }
      })();
      setHotels(sorted.map(h => ({ ...h, is_full: fullStatus[h.id] ?? false })));
    } catch (err: any) {
      toast.error('Failed to load hotels: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHotels(); }, [loadHotels]);

  const saveOrder = (newHotels: HotelDisplay[]) => {
    try {
      localStorage.setItem(HOTEL_ORDER_KEY, JSON.stringify(newHotels.map(h => h.id)));
    } catch {}
  };

  const moveHotel = (index: number, direction: 'up' | 'down') => {
    const newHotels = [...hotels];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newHotels.length) return;
    [newHotels[index], newHotels[targetIndex]] = [newHotels[targetIndex], newHotels[index]];
    setHotels(newHotels);
    saveOrder(newHotels);
    toast.success('顺序已更新 / Order updated');
  };

  const filtered = reorderMode
    ? hotels
    : hotels.filter(h => {
        const matchSearch = h.name.toLowerCase().includes(search.toLowerCase()) || h.location.toLowerCase().includes(search.toLowerCase());
        const matchActive = filterActive === 'Semua' || (filterActive === 'Aktif' ? h.active : !h.active);
        return matchSearch && matchActive;
      });

  const openAddModal = () => {
    setEditingHotel(null);
    setImageFile(null);
    setImagePreview('');
    hotelForm.reset({ name: '', location: '', pricePerNight: '', minDays: '1', commission: '10', halalTags: '', active: true, bonusEligible: false });
    setModalOpen(true);
  };

  const openEditModal = (hotel: HotelDisplay) => {
    setEditingHotel(hotel);
    setImageFile(null);
    setImagePreview(hotel.image || '');
    hotelForm.reset({
      name: hotel.name,
      location: hotel.location,
      pricePerNight: String(hotel.pricePerNight),
      minDays: String(hotel.minDays),
      commission: hotel.commission,
      halalTags: Array.isArray(hotel.halalTags) ? hotel.halalTags.join(', ') : (hotel.halalTags as string).toString(),
      active: hotel.active,
      bonusEligible: hotel.bonusEligible,
    });
    setModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be under 10MB');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleHotelSubmit = async (data: HotelForm) => {
    setLoadingSubmit(true);
    try {
      const halalTagsArr = data.halalTags.split(',').map(t => t.trim()).filter(Boolean);
      let imageUrl = editingHotel?.image ?? '';

      if (imageFile) {
        setUploadingImage(true);
        try {
          imageUrl = await uploadHotelImage(imageFile, editingHotel?.id);
        } finally {
          setUploadingImage(false);
        }
      }

      if (editingHotel) {
        await updateHotel(editingHotel.id, {
          name: data.name,
          location: data.location,
          pricePerNight: parseFloat(data.pricePerNight),
          minDays: parseInt(data.minDays),
          commission: data.commission,
          halalTags: halalTagsArr,
          active: data.active,
          bonusEligible: data.bonusEligible,
          image: imageUrl,
        });
        toast.success(`Hotel "${data.name}" berjaya dikemaskini`);
      } else {
        await createHotel({
          name: data.name,
          location: data.location,
          pricePerNight: parseFloat(data.pricePerNight),
          minDays: parseInt(data.minDays),
          commission: data.commission,
          halalTags: halalTagsArr,
          active: data.active,
          bonusEligible: data.bonusEligible,
          rating: 0,
          image: imageUrl,
          imageAlt: data.name,
        });
        toast.success(`Hotel "${data.name}" berjaya ditambah`);
      }
      await loadHotels();
      setModalOpen(false);
      setEditingHotel(null);
      setImageFile(null);
      setImagePreview('');
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await deleteHotel(deleteModal.id);
      toast.success(`Hotel "${deleteModal.name}" dipadam`);
      setDeleteModal(null);
      await loadHotels();
    } catch (err: any) {
      toast.error('Delete failed: ' + err.message);
    }
  };

  const toggleActive = async (id: string) => {
    const hotel = hotels.find(h => h.id === id);
    if (!hotel) return;
    const newActive = !hotel.active;
    try {
      await updateHotel(id, { active: newActive });
      setHotels(prev => prev.map(h => h.id === id ? { ...h, active: newActive } : h));
      toast.success(`Hotel "${hotel.name}" ${newActive ? 'diaktifkan' : 'dinyahaktifkan'}`);
    } catch (err: any) {
      toast.error('Update failed: ' + err.message);
    }
  };

  const toggleBonus = async (id: string) => {
    const hotel = hotels.find(h => h.id === id);
    if (!hotel) return;
    const newBonus = !hotel.bonusEligible;
    try {
      await updateHotel(id, { bonusEligible: newBonus });
      setHotels(prev => prev.map(h => h.id === id ? { ...h, bonusEligible: newBonus } : h));
      toast.success(`Bonus eligibility untuk "${hotel.name}" dikemaskini`);
    } catch (err: any) {
      toast.error('Update failed: ' + err.message);
    }
  };

  const toggleFull = (id: string) => {
    const hotel = hotels.find(h => h.id === id);
    if (!hotel) return;
    const newState = !hotel.is_full;
    setHotels(prev => prev.map(h => h.id === id ? { ...h, is_full: newState } : h));
    try {
      const stored = localStorage.getItem('hotelFullStatus') || '{}';
      const fullStatus = JSON.parse(stored);
      fullStatus[id] = newState;
      localStorage.setItem('hotelFullStatus', JSON.stringify(fullStatus));
    } catch {}
    toast.success(`"${hotel.name}" ${newState ? '已设为 Full（客满）' : '已取消 Full 状态'}`);
  };

  const applyGlobalSettings = async (data: GlobalSettingsForm) => {
    try {
      await Promise.all(
        hotels.map(h =>
          updateHotel(h.id, {
            pricePerNight: data.globalPrice ? parseFloat(data.globalPrice) : h.pricePerNight,
            minDays: data.globalMinDays ? parseInt(data.globalMinDays) : h.minDays,
            commission: data.globalCommission ? data.globalCommission : h.commission,
          })
        )
      );
      toast.success('Tetapan global berjaya digunakan ke semua hotel');
      setGlobalSettingsOpen(false);
      globalForm.reset();
      await loadHotels();
    } catch (err: any) {
      toast.error('Global update failed: ' + err.message);
    }
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-primary-500' : 'bg-gray-300'}`}
      role="switch"
      aria-checked={checked}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('admin.hotelTitle')}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">{hotels.length} {t('admin.hotels')} · {hotels.filter(h => h.active).length} {t('admin.activeFilter').toLowerCase()} · {hotels.filter(h => h.bonusEligible).length} {t('admin.bonusEligible').toLowerCase()}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setReorderMode(prev => !prev);
              if (!reorderMode) setSearch('');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${reorderMode ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'border-[hsl(var(--border))] text-gray-600 hover:bg-gray-50'}`}
          >
            <Icon name="Bars3BottomLeftIcon" size={16} />
            {reorderMode ? '✓ 完成排序 / Done' : '排列顺序 / Reorder'}
          </button>
          <button
            onClick={() => setGlobalSettingsOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Icon name="AdjustmentsHorizontalIcon" size={16} />
            {t('admin.globalSettings')}
          </button>
          <button
            onClick={openAddModal}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
          >
            <Icon name="PlusIcon" size={16} />
            {t('admin.addHotelBtn')}
          </button>
        </div>
      </div>

      {/* Reorder mode banner */}
      {reorderMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
          <Icon name="InformationCircleIcon" size={18} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            排序模式已启用 — 使用 ↑ ↓ 按钮调整酒店在前台的显示顺序。排序结果会自动保存。
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('admin.totalHotels'), value: hotels.length, icon: 'BuildingOfficeIcon', color: 'text-primary-600 bg-primary-50' },
          { label: t('admin.activeHotels'), value: hotels.filter(h => h.active).length, icon: 'CheckCircleIcon', color: 'text-green-600 bg-green-50' },
          { label: t('admin.bonusEligibleHotels'), value: hotels.filter(h => h.bonusEligible).length, icon: 'StarIcon', color: 'text-gold-600 bg-gold-50' },
          { label: t('admin.inactiveHotels'), value: hotels.filter(h => !h.active).length, icon: 'PauseCircleIcon', color: 'text-gray-500 bg-gray-100' },
        ].map((stat, i) => (
          <div key={`hstat-${i}`} className="card-elevated p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}>
              <Icon name={stat.icon as any} size={18} />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-gray-800">{stat.value}</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters — hidden in reorder mode */}
      {!reorderMode && (
        <div className="card-elevated p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('admin.searchHotelPlaceholder')}
              className="w-full pl-9 pr-4 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white"
            />
          </div>
          <div className="flex gap-2">
            {[
              { key: 'Semua', label: t('admin.allFilter') },
              { key: 'Aktif', label: t('admin.activeFilter') },
              { key: 'Tidak Aktif', label: t('admin.inactiveFilter') },
            ].map(f => (
              <button
                key={`hfilter-${f.key}`}
                onClick={() => setFilterActive(f.key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filterActive === f.key ? 'bg-primary-500 text-white' : 'bg-white border border-[hsl(var(--border))] text-gray-600 hover:border-primary-300'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hotel table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-gray-50">
                {reorderMode && (
                  <th className="p-3 text-center font-semibold text-gray-600 text-xs uppercase tracking-wider w-20">顺序</th>
                )}
                <th className="p-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.hotels')}</th>
                <th className="p-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.location')}</th>
                <th className="p-3 text-right font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.pricePerNightLabel')}</th>
                <th className="p-3 text-center font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.minDaysLabel')}</th>
                <th className="p-3 text-center font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.commissionLabel')}</th>
                {!reorderMode && <th className="p-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.halalTags')}</th>}
                <th className="p-3 text-center font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.activeLabel')}</th>
                <th className="p-3 text-center font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.bonusLabel')}</th>
                <th className="p-3 text-center font-semibold text-gray-600 text-xs uppercase tracking-wider">Full</th>
                {!reorderMode && <th className="p-3 text-center font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.actions')}</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((hotel, idx) => (
                <tr key={hotel.id} className={`border-b border-[hsl(var(--border))] hover:bg-gray-50 transition-colors group ${reorderMode ? 'bg-white' : idx % 2 === 0 ? '' : 'bg-gray-50/30'} ${!hotel.active ? 'opacity-60' : ''}`}>
                  {reorderMode && (
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-mono font-bold text-gray-400 mb-0.5">#{idx + 1}</span>
                        <button
                          onClick={() => moveHotel(idx, 'up')}
                          disabled={idx === 0}
                          title="上移"
                          className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Icon name="ChevronUpIcon" size={14} className="text-blue-600" />
                        </button>
                        <button
                          onClick={() => moveHotel(idx, 'down')}
                          disabled={idx === filtered.length - 1}
                          title="下移"
                          className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Icon name="ChevronDownIcon" size={14} className="text-blue-600" />
                        </button>
                      </div>
                    </td>
                  )}
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <Icon name="BuildingOfficeIcon" size={14} className="text-primary-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-gray-800 text-sm">{hotel.name}</div>
                          {hotel.is_full && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">FULL</span>
                          )}
                        </div>
                        <div className="font-mono text-[10px] text-gray-400">{hotel.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Icon name="MapPinIcon" size={11} className="text-gray-400" />
                      {hotel.location}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <span className="font-mono font-bold text-gray-800">RM {hotel.pricePerNight}</span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="font-mono text-sm text-gray-700">{hotel.minDays}x</span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="font-mono text-sm font-semibold text-primary-600">{hotel.commission}%</span>
                  </td>
                  {!reorderMode && (
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(Array.isArray(hotel.halalTags) ? hotel.halalTags : (hotel.halalTags as string).toString().split(', ')).slice(0, 2).map(tag => (
                          <span key={`${hotel.id}-htag-${tag}`} className="text-[10px] bg-green-50 text-green-700 border border-green-200 rounded-full px-1.5 py-0.5">
                            {tag}
                          </span>
                        ))}
                        {(Array.isArray(hotel.halalTags) ? hotel.halalTags : (hotel.halalTags as string).toString().split(', ')).length > 2 && (
                          <span className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">
                            +{(Array.isArray(hotel.halalTags) ? hotel.halalTags : (hotel.halalTags as string).toString().split(', ')).length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="p-3 text-center">
                    <div className="flex justify-center">
                      <button
                        onClick={() => toggleActive(hotel.id)}
                        className={`relative inline-flex w-10 h-5 rounded-full transition-colors duration-200 ${hotel.active ? 'bg-primary-500' : 'bg-gray-300'}`}
                        role="switch"
                        aria-checked={hotel.active}
                        title={hotel.active ? t('admin.inactiveFilter') : t('admin.activeFilter')}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${hotel.active ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center">
                      <button
                        onClick={() => toggleBonus(hotel.id)}
                        className={`relative inline-flex w-10 h-5 rounded-full transition-colors duration-200 ${hotel.bonusEligible ? 'bg-gold-500' : 'bg-gray-300'}`}
                        role="switch"
                        aria-checked={hotel.bonusEligible}
                        title={t('admin.bonusEligible')}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${hotel.bonusEligible ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center">
                      <button
                        onClick={() => toggleFull(hotel.id)}
                        className={`relative inline-flex w-10 h-5 rounded-full transition-colors duration-200 ${hotel.is_full ? 'bg-red-500' : 'bg-gray-300'}`}
                        role="switch"
                        aria-checked={hotel.is_full}
                        title={hotel.is_full ? '取消 Full 状态' : '设为 Full（客满）'}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${hotel.is_full ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </td>
                  {!reorderMode && (
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(hotel)}
                          title={t('admin.editHotel')}
                          className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                        >
                          <Icon name="PencilIcon" size={13} className="text-blue-600" />
                        </button>
                        <button
                          onClick={() => setDeleteModal(hotel)}
                          title={t('admin.deleteHotel')}
                          className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                        >
                          <Icon name="TrashIcon" size={13} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={reorderMode ? 9 : 10} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <Icon name="BuildingOfficeIcon" size={24} className="text-gray-400" />
                      </div>
                      <div className="font-semibold text-gray-600">{t('booking.noHotelFound')}</div>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">{t('booking.noHotelDesc')}</p>
                      <button onClick={openAddModal} className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold">
                        {t('admin.addHotelBtn')}
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Hotel Modal */}
      {modalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="sticky top-0 bg-white border-b border-[hsl(var(--border))] px-6 py-4 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">{editingHotel ? t('admin.editHotelTitle') : t('admin.addHotelTitle')}</h2>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                    {editingHotel ? editingHotel.name : t('admin.halalTagsForm')}
                  </p>
                </div>
                <button onClick={() => { setModalOpen(false); setEditingHotel(null); setImageFile(null); setImagePreview(''); }} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <Icon name="XMarkIcon" size={18} className="text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={hotelForm.handleSubmit(handleHotelSubmit)} className="p-6 space-y-4">
              {/* Image Upload section */}
              <div className="border-b border-[hsl(var(--border))] pb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-3">Gambar Hotel</h3>
                <div className="space-y-3">
                  {imagePreview ? (
                    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-[hsl(var(--border))]">
                      <img src={imagePreview} alt="Hotel preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
                      >
                        <Icon name="XMarkIcon" size={14} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 border-2 border-dashed border-[hsl(var(--border))] rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary-400 hover:bg-primary-50/30 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                        <Icon name="PhotoIcon" size={20} className="text-primary-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-700">Klik untuk muat naik gambar</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">JPG, PNG, WebP — maks 10MB</p>
                      </div>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 border border-[hsl(var(--border))] rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Icon name="ArrowPathIcon" size={13} />
                      Tukar Gambar
                    </button>
                  )}
                </div>
              </div>

              {/* Basic Info section */}
              <div className="border-b border-[hsl(var(--border))] pb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-3">Maklumat Asas</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('admin.hotelName')}</label>
                    <input
                      {...hotelForm.register('name', { required: true })}
                      className="w-full px-4 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
                      placeholder="The Majestic Kuala Lumpur"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('admin.hotelLocation')}</label>
                    <input
                      {...hotelForm.register('location', { required: true })}
                      className="w-full px-4 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
                      placeholder="KLCC, Kuala Lumpur"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing section */}
              <div className="border-b border-[hsl(var(--border))] pb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-3">Harga & Komisen</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('admin.pricePerNightForm')}</label>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1.5">Harga asas setiap malam</p>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      {...hotelForm.register('pricePerNight', { required: true, min: 1 })}
                      className="w-full px-3 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                      placeholder="320"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('admin.minDaysForm')}</label>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1.5">Minimum malam tempahan</p>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      {...hotelForm.register('minDays', { required: true, min: 1 })}
                      className="w-full px-3 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                      placeholder="2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('admin.commissionForm')}</label>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1.5">% komisen untuk pengguna</p>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      step="0.5"
                      {...hotelForm.register('commission', { required: true, min: 1, max: 30 })}
                      className="w-full px-3 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                      placeholder="10"
                    />
                  </div>
                </div>
              </div>

              {/* Halal tags */}
              <div className="border-b border-[hsl(var(--border))] pb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-3">Tag Halal</h3>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('admin.halalTagsForm')}</label>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1.5">Pisahkan dengan koma. Contoh: Makanan Halal, Solat Room, No Alkohol</p>
                  <textarea
                    {...hotelForm.register('halalTags', { required: true })}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none"
                    placeholder={t('admin.halalTagsPlaceholder')}
                  />
                </div>
              </div>

              {/* Status toggles */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-3">Status Hotel</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <div className="text-sm font-semibold text-gray-700">{t('admin.activeForm')}</div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">Hotel ini akan dipaparkan kepada pengguna</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => hotelForm.setValue('active', !hotelForm.watch('active'))}
                      className={`relative inline-flex w-10 h-5 rounded-full transition-colors duration-200 ${hotelForm.watch('active') ? 'bg-primary-500' : 'bg-gray-300'}`}
                      role="switch"
                      aria-checked={hotelForm.watch('active')}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${hotelForm.watch('active') ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <div className="text-sm font-semibold text-gray-700">{t('admin.bonusEligibleForm')}</div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">Hotel ini boleh digunakan dalam bonus order yang ditugaskan admin</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => hotelForm.setValue('bonusEligible', !hotelForm.watch('bonusEligible'))}
                      className={`relative inline-flex w-10 h-5 rounded-full transition-colors duration-200 ${hotelForm.watch('bonusEligible') ? 'bg-gold-500' : 'bg-gray-300'}`}
                      role="switch"
                      aria-checked={hotelForm.watch('bonusEligible')}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${hotelForm.watch('bonusEligible') ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); setEditingHotel(null); setImageFile(null); setImagePreview(''); }}
                  className="flex-1 py-3 rounded-xl border border-[hsl(var(--border))] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loadingSubmit}
                  className="flex-1 btn-primary py-3 rounded-xl text-sm font-bold disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loadingSubmit ? (
                    <><Icon name="ArrowPathIcon" size={16} className="animate-spin" />{uploadingImage ? 'Memuat naik gambar...' : t('admin.saving')}</>
                  ) : (
                    editingHotel ? t('admin.updateHotel') : t('admin.saveHotel')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Settings Modal */}
      {globalSettingsOpen && (
        <div className="modal-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{t('admin.globalSettingsTitle')}</h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{t('admin.globalSettingsDesc')}</p>
              </div>
              <button onClick={() => setGlobalSettingsOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <Icon name="XMarkIcon" size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 flex items-start gap-2">
              <Icon name="ExclamationTriangleIcon" size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-medium">
                {t('admin.globalSettingsDesc')}
              </p>
            </div>

            <form onSubmit={globalForm.handleSubmit(applyGlobalSettings)} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('admin.globalPriceLabel')}</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  {...globalForm.register('globalPrice')}
                  className="w-full px-4 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  placeholder="—"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('admin.globalMinDaysLabel')}</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  {...globalForm.register('globalMinDays')}
                  className="w-full px-4 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  placeholder="—"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('admin.globalCommissionLabel')}</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  step="0.5"
                  {...globalForm.register('globalCommission')}
                  className="w-full px-4 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  placeholder="—"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGlobalSettingsOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-[hsl(var(--border))] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Icon name="AdjustmentsHorizontalIcon" size={16} />
                  {t('admin.applyToAll')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteModal && (
        <div className="modal-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Icon name="TrashIcon" size={28} className="text-red-500" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-2">{t('admin.deleteHotelTitle')}</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">
              <strong>{deleteModal.name}</strong>
            </p>
            <p className="text-xs text-red-500 font-medium mb-6">{t('admin.deleteHotelDesc')}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(null)} className="flex-1 py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                {t('admin.cancel')}
              </button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">
                {t('admin.yesDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}