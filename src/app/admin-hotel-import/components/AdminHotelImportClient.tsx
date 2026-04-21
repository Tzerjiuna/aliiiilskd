'use client';
import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';

interface SampleHotel {
  name: string;
  description: string;
  location: string;
  city: string;
  country: string;
  image_url: string;
  price_per_night: number;
  rating: number;
  total_reviews: number;
  is_active: boolean;
  amenities: string[];
  min_days: number;
  commission_rate: number;
  halal_tags: string[];
  bonus_eligible: boolean;
  is_full: boolean;
}

const SAMPLE_HOTELS: SampleHotel[] = [
{
  name: 'The Majestic Kuala Lumpur',
  description: 'Hotel mewah di pusat bandar Kuala Lumpur dengan kemudahan solat dan makanan halal bersijil.',
  location: 'Kuala Lumpur City Centre',
  city: 'Kuala Lumpur',
  country: 'Malaysia',
  image_url: "https://img.rocket.new/generatedImages/rocket_gen_img_1047f4c33-1776689191712.png",
  price_per_night: 320,
  rating: 4.7,
  total_reviews: 312,
  is_active: true,
  amenities: ['WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Parking'],
  min_days: 2,
  commission_rate: 10,
  halal_tags: ['Makanan Halal', 'Solat Room', 'No Alkohol'],
  bonus_eligible: true,
  is_full: false
},
{
  name: 'Pullman Kuala Lumpur City Centre',
  description: 'Hotel bintang 5 berhampiran KLCC dengan arah kiblat di setiap bilik dan Al-Quran tersedia.',
  location: 'KLCC, Kuala Lumpur',
  city: 'Kuala Lumpur',
  country: 'Malaysia',
  image_url: "https://img.rocket.new/generatedImages/rocket_gen_img_1e69082c1-1776749696811.png",
  price_per_night: 450,
  rating: 4.8,
  total_reviews: 489,
  is_active: true,
  amenities: ['WiFi', 'Pool', 'Gym', 'Concierge', 'Restaurant', 'Bar-Free'],
  min_days: 1,
  commission_rate: 10,
  halal_tags: ['Makanan Halal', 'Kiblat Direction', 'No Alkohol', 'Quran'],
  bonus_eligible: true,
  is_full: false
},
{
  name: 'Dorsett Putrajaya',
  description: 'Hotel moden di Putrajaya dengan persekitaran tenang dan kemudahan solat lengkap.',
  location: 'Putrajaya',
  city: 'Putrajaya',
  country: 'Malaysia',
  image_url: "https://img.rocket.new/generatedImages/rocket_gen_img_12be36009-1776689191165.png",
  price_per_night: 220,
  rating: 4.4,
  total_reviews: 178,
  is_active: true,
  amenities: ['WiFi', 'Pool', 'Restaurant', 'Parking', 'Meeting Room'],
  min_days: 2,
  commission_rate: 8,
  halal_tags: ['Makanan Halal', 'Solat Room'],
  bonus_eligible: false,
  is_full: false
},
{
  name: 'Royale Chulan Kuala Lumpur',
  description: 'Hotel bersejarah di Bukit Bintang dengan suasana mewah dan perkhidmatan halal terbaik.',
  location: 'Bukit Bintang, Kuala Lumpur',
  city: 'Kuala Lumpur',
  country: 'Malaysia',
  image_url: "https://images.unsplash.com/photo-1694265004272-93e7e8dfee1a",
  price_per_night: 380,
  rating: 4.6,
  total_reviews: 267,
  is_active: true,
  amenities: ['WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Valet Parking'],
  min_days: 2,
  commission_rate: 10,
  halal_tags: ['Makanan Halal', 'No Alkohol', 'Kiblat Direction', 'Quran'],
  bonus_eligible: true,
  is_full: false
},
{
  name: 'Mandarin Oriental Kuala Lumpur',
  description: 'Hotel ikonik di KLCC dengan pemandangan menara kembar dan perkhidmatan premium halal.',
  location: 'KLCC, Kuala Lumpur',
  city: 'Kuala Lumpur',
  country: 'Malaysia',
  image_url: "https://img.rocket.new/generatedImages/rocket_gen_img_146c10dae-1776689192268.png",
  price_per_night: 680,
  rating: 4.9,
  total_reviews: 521,
  is_active: true,
  amenities: ['WiFi', 'Pool', 'Gym', 'Spa', 'Fine Dining', 'Butler Service'],
  min_days: 1,
  commission_rate: 12,
  halal_tags: ['Makanan Halal', 'Solat Room', 'No Alkohol', 'Kiblat Direction'],
  bonus_eligible: true,
  is_full: false
},
{
  name: 'Hilton Petaling Jaya',
  description: 'Hotel kontemporari di Petaling Jaya dengan kemudahan mesra Muslim dan lokasi strategik.',
  location: 'Petaling Jaya, Selangor',
  city: 'Petaling Jaya',
  country: 'Malaysia',
  image_url: "https://img.rocket.new/generatedImages/rocket_gen_img_1d245c158-1775909760272.png",
  price_per_night: 280,
  rating: 4.3,
  total_reviews: 203,
  is_active: true,
  amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Parking', 'Business Center'],
  min_days: 2,
  commission_rate: 8,
  halal_tags: ['Makanan Halal', 'Solat Room'],
  bonus_eligible: false,
  is_full: false
},
{
  name: 'Sunway Resort Hotel',
  description: 'Resort keluarga di Subang Jaya dengan taman tema dan kemudahan halal lengkap.',
  location: 'Subang Jaya, Selangor',
  city: 'Subang Jaya',
  country: 'Malaysia',
  image_url: "https://img.rocket.new/generatedImages/rocket_gen_img_1192f7a34-1776749698286.png",
  price_per_night: 350,
  rating: 4.5,
  total_reviews: 389,
  is_active: true,
  amenities: ['WiFi', 'Pool', 'Theme Park Access', 'Restaurant', 'Kids Club'],
  min_days: 2,
  commission_rate: 9,
  halal_tags: ['Makanan Halal', 'Kiblat Direction'],
  bonus_eligible: false,
  is_full: false
},
{
  name: 'Marriott Putrajaya',
  description: 'Hotel mewah di Putrajaya dengan pemandangan tasik dan pakej halal komprehensif.',
  location: 'Putrajaya',
  city: 'Putrajaya',
  country: 'Malaysia',
  image_url: "https://img.rocket.new/generatedImages/rocket_gen_img_1e93c4615-1775815965627.png",
  price_per_night: 420,
  rating: 4.7,
  total_reviews: 298,
  is_active: true,
  amenities: ['WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Lake View'],
  min_days: 1,
  commission_rate: 10,
  halal_tags: ['Makanan Halal', 'No Alkohol', 'Solat Room', 'Quran', 'Kiblat Direction'],
  bonus_eligible: true,
  is_full: false
},
{
  name: 'InterContinental Kuala Lumpur',
  description: 'Hotel antarabangsa di jantung KL dengan perkhidmatan halal bertaraf dunia.',
  location: 'Jalan Ampang, Kuala Lumpur',
  city: 'Kuala Lumpur',
  country: 'Malaysia',
  image_url: "https://img.rocket.new/generatedImages/rocket_gen_img_1350196ee-1776749698095.png",
  price_per_night: 520,
  rating: 4.8,
  total_reviews: 412,
  is_active: true,
  amenities: ['WiFi', 'Pool', 'Gym', 'Spa', 'Multiple Restaurants', 'Club Lounge'],
  min_days: 1,
  commission_rate: 11,
  halal_tags: ['Makanan Halal', 'No Alkohol', 'Kiblat Direction', 'Quran', 'Solat Room'],
  bonus_eligible: true,
  is_full: false
},
{
  name: 'Aloft Kuala Lumpur Sentral',
  description: 'Hotel moden di KL Sentral dengan akses mudah ke pengangkutan awam dan kemudahan halal.',
  location: 'KL Sentral, Kuala Lumpur',
  city: 'Kuala Lumpur',
  country: 'Malaysia',
  image_url: "https://img.rocket.new/generatedImages/rocket_gen_img_1f4276476-1776749696211.png",
  price_per_night: 290,
  rating: 4.4,
  total_reviews: 156,
  is_active: true,
  amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Transit Access'],
  min_days: 1,
  commission_rate: 9,
  halal_tags: ['Makanan Halal', 'Solat Room'],
  bonus_eligible: false,
  is_full: false
},
{
  name: 'Grand Hyatt Kuala Lumpur',
  description: 'Hotel grand di KLCC dengan pemandangan spektakular dan perkhidmatan halal premium.',
  location: 'KLCC, Kuala Lumpur',
  city: 'Kuala Lumpur',
  country: 'Malaysia',
  image_url: "https://img.rocket.new/generatedImages/rocket_gen_img_1d245c158-1775909760272.png",
  price_per_night: 590,
  rating: 4.8,
  total_reviews: 367,
  is_active: true,
  amenities: ['WiFi', 'Pool', 'Gym', 'Spa', 'Fine Dining', 'Rooftop Bar-Free'],
  min_days: 2,
  commission_rate: 12,
  halal_tags: ['Makanan Halal', 'No Alkohol', 'Kiblat Direction', 'Quran'],
  bonus_eligible: true,
  is_full: false
},
{
  name: 'Concorde Hotel Kuala Lumpur',
  description: 'Hotel klasik di Jalan Sultan Ismail dengan kemudahan solat dan makanan halal bersijil JAKIM.',
  location: 'Jalan Sultan Ismail, Kuala Lumpur',
  city: 'Kuala Lumpur',
  country: 'Malaysia',
  image_url: "https://img.rocket.new/generatedImages/rocket_gen_img_15975fbcf-1776749697116.png",
  price_per_night: 240,
  rating: 4.2,
  total_reviews: 189,
  is_active: true,
  amenities: ['WiFi', 'Pool', 'Restaurant', 'Parking', 'Business Center'],
  min_days: 2,
  commission_rate: 8,
  halal_tags: ['Makanan Halal', 'Solat Room', 'Kiblat Direction'],
  bonus_eligible: false,
  is_full: false
}];


interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

interface UploadProgress {
  hotelName: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  message?: string;
}

type TabType = 'generate' | 'preview';

// Fetch image as blob from URL (via proxy to avoid CORS)
async function fetchImageAsBlob(url: string): Promise<Blob> {
  const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
  return response.blob();
}

// Slugify hotel name for filename
function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function AdminHotelImportClient() {
  const [activeTab, setActiveTab] = useState<TabType>('generate');
  const [selectedHotels, setSelectedHotels] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [filterCity, setFilterCity] = useState('All');
  const [filterBonus, setFilterBonus] = useState('All');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [showProgress, setShowProgress] = useState(false);
  const [updatingImages, setUpdatingImages] = useState(false);
  const [updateResult, setUpdateResult] = useState<ImportResult | null>(null);

  const supabase = createClient();

  const cities = ['All', ...Array.from(new Set(SAMPLE_HOTELS.map((h) => h.city)))];

  const filteredHotels = SAMPLE_HOTELS.filter((h) => {
    const cityMatch = filterCity === 'All' || h.city === filterCity;
    const bonusMatch = filterBonus === 'All' || (filterBonus === 'Yes' ? h.bonus_eligible : !h.bonus_eligible);
    return cityMatch && bonusMatch;
  });

  const toggleSelect = (index: number) => {
    setSelectedHotels((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);else next.add(index);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedHotels(new Set());
      setSelectAll(false);
    } else {
      setSelectedHotels(new Set(filteredHotels.map((_, i) => SAMPLE_HOTELS.indexOf(filteredHotels[i]))));
      setSelectAll(true);
    }
  };

  // Upload a single image to Supabase Storage and return the public URL
  const uploadImageToStorage = async (hotel: SampleHotel): Promise<string> => {
    const slug = slugify(hotel.name);
    const fileName = `${slug}.jpg`;
    const filePath = `hotels/${fileName}`;

    // Fetch image as blob
    const blob = await fetchImageAsBlob(hotel.image_url);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage.
    from('hotel-images').
    upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: true
    });

    if (uploadError) throw new Error(uploadError.message);

    // Get public URL
    const { data } = supabase.storage.from('hotel-images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  // Import hotels with image upload to Supabase Storage
  const handleImportWithUpload = async (hotelsToImport: SampleHotel[]) => {
    setImporting(true);
    setResult(null);
    setShowProgress(true);

    const progress: UploadProgress[] = hotelsToImport.map((h) => ({
      hotelName: h.name,
      status: 'pending'
    }));
    setUploadProgress([...progress]);

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < hotelsToImport.length; i++) {
      const hotel = hotelsToImport[i];

      // Update status to uploading
      progress[i] = { hotelName: hotel.name, status: 'uploading', message: '上传图片中...' };
      setUploadProgress([...progress]);

      let finalImageUrl = hotel.image_url;

      try {
        finalImageUrl = await uploadImageToStorage(hotel);
        progress[i] = { hotelName: hotel.name, status: 'uploading', message: '保存到数据库...' };
        setUploadProgress([...progress]);
      } catch (uploadErr) {
        // If upload fails, use original URL
        progress[i] = { hotelName: hotel.name, status: 'uploading', message: '图片上传失败，使用原始链接...' };
        setUploadProgress([...progress]);
      }

      // Insert hotel with (possibly updated) image URL
      const { error } = await supabase.from('hotels').insert({
        name: hotel.name,
        description: hotel.description,
        location: hotel.location,
        city: hotel.city,
        country: hotel.country,
        image_url: finalImageUrl,
        price_per_night: hotel.price_per_night,
        rating: hotel.rating,
        total_reviews: hotel.total_reviews,
        is_active: hotel.is_active,
        amenities: hotel.amenities,
        min_days: hotel.min_days,
        commission_rate: hotel.commission_rate,
        halal_tags: hotel.halal_tags,
        bonus_eligible: hotel.bonus_eligible,
        is_full: hotel.is_full
      });

      if (error) {
        failed++;
        errors.push(`${hotel.name}: ${error.message}`);
        progress[i] = { hotelName: hotel.name, status: 'error', message: error.message };
      } else {
        success++;
        progress[i] = { hotelName: hotel.name, status: 'done', message: '完成' };
      }
      setUploadProgress([...progress]);
    }

    setResult({ success, failed, errors });
    setImporting(false);
    setSelectedHotels(new Set());
    setSelectAll(false);
  };

  const handleImport = async () => {
    if (selectedHotels.size === 0) return;
    const hotelsToImport = SAMPLE_HOTELS.filter((_, i) => selectedHotels.has(i));
    await handleImportWithUpload(hotelsToImport);
  };

  const handleImportAll = async () => {
    await handleImportWithUpload(SAMPLE_HOTELS);
  };

  // Update image_url for existing hotels in DB by re-uploading to Supabase Storage
  const handleUpdateExistingImages = async () => {
    setUpdatingImages(true);
    setUpdateResult(null);
    setShowProgress(true);

    const progress: UploadProgress[] = SAMPLE_HOTELS.map((h) => ({
      hotelName: h.name,
      status: 'pending'
    }));
    setUploadProgress([...progress]);

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < SAMPLE_HOTELS.length; i++) {
      const hotel = SAMPLE_HOTELS[i];

      progress[i] = { hotelName: hotel.name, status: 'uploading', message: '上传图片中...' };
      setUploadProgress([...progress]);

      try {
        const newUrl = await uploadImageToStorage(hotel);

        progress[i] = { hotelName: hotel.name, status: 'uploading', message: '更新数据库...' };
        setUploadProgress([...progress]);

        const { error } = await supabase.
        from('hotels').
        update({ image_url: newUrl }).
        eq('name', hotel.name);

        if (error) {
          failed++;
          errors.push(`${hotel.name}: ${error.message}`);
          progress[i] = { hotelName: hotel.name, status: 'error', message: error.message };
        } else {
          success++;
          progress[i] = { hotelName: hotel.name, status: 'done', message: '已更新' };
        }
      } catch (err: unknown) {
        failed++;
        const msg = err instanceof Error ? err.message : '未知错误';
        errors.push(`${hotel.name}: ${msg}`);
        progress[i] = { hotelName: hotel.name, status: 'error', message: msg };
      }
      setUploadProgress([...progress]);
    }

    setUpdateResult({ success, failed, errors });
    setUpdatingImages(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Import Hotel Sampel Halal</h1>
          <p className="text-sm text-gray-500 mt-1">
            Jana atau import data hotel halal sampel ke dalam pangkalan data
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
          <Icon name="BuildingStorefrontIcon" size={16} className="text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700">{SAMPLE_HOTELS.length} Hotel Tersedia</span>
        </div>
      </div>

      {/* Update Existing Images Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-bold text-blue-800 flex items-center gap-2">
              <Icon name="CloudArrowUpIcon" size={18} className="text-blue-600" />
              上传图片到 Supabase Storage 并更新数据库
            </h2>
            <p className="text-sm text-blue-600 mt-1">
              将所有酒店图片上传到 Supabase Storage，并更新数据库中的 image_url 字段为 Storage 公开链接。
            </p>
          </div>
          <button
            onClick={handleUpdateExistingImages}
            disabled={updatingImages || importing}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            
            {updatingImages ?
            <><Icon name="ArrowPathIcon" size={15} className="animate-spin" /> 处理中...</> :

            <><Icon name="CloudArrowUpIcon" size={15} /> 上传图片 & 更新数据库</>
            }
          </button>
        </div>

        {updateResult &&
        <div className={`mt-4 rounded-xl border p-3 ${updateResult.failed === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            <p className={`font-semibold text-sm ${updateResult.failed === 0 ? 'text-emerald-800' : 'text-amber-800'}`}>
              更新完成: {updateResult.success} 成功, {updateResult.failed} 失败
            </p>
            {updateResult.errors.length > 0 &&
          <ul className="mt-1 space-y-0.5">
                {updateResult.errors.map((err, i) =>
            <li key={i} className="text-xs text-amber-700">• {err}</li>
            )}
              </ul>
          }
          </div>
        }
      </div>

      {/* Upload Progress Panel */}
      {showProgress && uploadProgress.length > 0 &&
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Icon name="ArrowUpTrayIcon" size={16} className="text-primary-600" />
              进度详情
            </h2>
            <button
            onClick={() => {setShowProgress(false);setUploadProgress([]);}}
            className="text-gray-400 hover:text-gray-600">
            
              <Icon name="XMarkIcon" size={16} />
            </button>
          </div>
          <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
            {uploadProgress.map((p, i) =>
          <div key={i} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-shrink-0">
                  {p.status === 'pending' && <div className="w-4 h-4 rounded-full bg-gray-200" />}
                  {p.status === 'uploading' && <Icon name="ArrowPathIcon" size={16} className="text-blue-500 animate-spin" />}
                  {p.status === 'done' && <Icon name="CheckCircleIcon" size={16} className="text-emerald-500" />}
                  {p.status === 'error' && <Icon name="ExclamationCircleIcon" size={16} className="text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.hotelName}</p>
                  {p.message &&
              <p className={`text-xs truncate ${p.status === 'error' ? 'text-red-500' : 'text-gray-400'}`}>
                      {p.message}
                    </p>
              }
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            p.status === 'done' ? 'bg-emerald-50 text-emerald-700' :
            p.status === 'error' ? 'bg-red-50 text-red-700' :
            p.status === 'uploading' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`
            }>
                  {p.status === 'pending' ? '等待' : p.status === 'uploading' ? '处理中' : p.status === 'done' ? '完成' : '失败'}
                </span>
              </div>
          )}
          </div>
        </div>
      }

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['generate', 'preview'] as TabType[]).map((tab) =>
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
          activeTab === tab ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`
          }>
          
            {tab === 'generate' ? '⚡ Jana & Import' : '👁️ Pratonton Data'}
          </button>
        )}
      </div>

      {/* Result Banner */}
      {result &&
      <div className={`rounded-xl border p-4 ${result.failed === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-start gap-3">
            <Icon
            name={result.failed === 0 ? 'CheckCircleIcon' : 'ExclamationTriangleIcon'}
            size={20}
            className={result.failed === 0 ? 'text-emerald-600' : 'text-amber-600'} />
          
            <div className="flex-1">
              <p className={`font-semibold text-sm ${result.failed === 0 ? 'text-emerald-800' : 'text-amber-800'}`}>
                Import selesai: {result.success} berjaya, {result.failed} gagal
              </p>
              {result.errors.length > 0 &&
            <ul className="mt-2 space-y-1">
                  {result.errors.map((err, i) =>
              <li key={i} className="text-xs text-amber-700">• {err}</li>
              )}
                </ul>
            }
            </div>
            <button onClick={() => setResult(null)} className="text-gray-400 hover:text-gray-600">
              <Icon name="XMarkIcon" size={16} />
            </button>
          </div>
        </div>
      }

      {/* Generate Tab */}
      {activeTab === 'generate' &&
      <div className="space-y-4">
          {/* Filters + Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex flex-wrap items-center gap-4">
              {/* Filter by city */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bandar</label>
                <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-300">
                
                  {cities.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Filter by bonus */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bonus Eligible</label>
                <select
                value={filterBonus}
                onChange={(e) => setFilterBonus(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-300">
                
                  <option>All</option>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>

              <div className="flex-1" />

              {/* Select all */}
              <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">
              
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selectAll ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}`}>
                  {selectAll && <Icon name="CheckIcon" size={10} className="text-white" />}
                </div>
                Pilih Semua ({filteredHotels.length})
              </button>

              {/* Import selected with image upload */}
              <button
              onClick={handleImport}
              disabled={selectedHotels.size === 0 || importing}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              
                {importing ?
              <><Icon name="ArrowPathIcon" size={15} className="animate-spin" /> 处理中...</> :

              <><Icon name="CloudArrowUpIcon" size={15} /> 上传并导入 ({selectedHotels.size})</>
              }
              </button>

              {/* Import all with image upload */}
              <button
              onClick={handleImportAll}
              disabled={importing}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              
                {importing ?
              <><Icon name="ArrowPathIcon" size={15} className="animate-spin" /> 处理中...</> :

              <><Icon name="BoltIcon" size={15} /> 全部上传并导入 ({SAMPLE_HOTELS.length})</>
              }
              </button>
            </div>
          </div>

          {/* Hotel Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredHotels.map((hotel) => {
            const originalIndex = SAMPLE_HOTELS.indexOf(hotel);
            const isSelected = selectedHotels.has(originalIndex);

            return (
              <div
                key={originalIndex}
                onClick={() => toggleSelect(originalIndex)}
                className={`relative bg-white rounded-2xl border-2 cursor-pointer transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md ${
                isSelected ? 'border-primary-500 ring-2 ring-primary-100' : 'border-gray-100 hover:border-gray-200'}`
                }>
                
                  {/* Selection indicator */}
                  <div className={`absolute top-3 right-3 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                isSelected ? 'bg-primary-500 border-primary-500' : 'bg-white border-gray-300'}`
                }>
                    {isSelected && <Icon name="CheckIcon" size={12} className="text-white" />}
                  </div>

                  {/* Hotel image */}
                  <div className="relative h-40 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                    src={hotel.image_url}
                    alt={`${hotel.name} - hotel halal di ${hotel.city}`}
                    className="w-full h-full object-cover" />
                  
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-2 left-3 flex items-center gap-1">
                      <Icon name="StarIcon" size={12} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-white text-xs font-semibold">{hotel.rating}</span>
                      <span className="text-white/70 text-xs">({hotel.total_reviews})</span>
                    </div>
                  </div>

                  {/* Hotel info */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm leading-tight">{hotel.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <Icon name="MapPinIcon" size={11} />
                        {hotel.location}
                      </p>
                    </div>

                    {/* Pricing row */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-primary-600">RM {hotel.price_per_night}</span>
                        <span className="text-xs text-gray-400">/malam</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Komisen</div>
                        <div className="text-sm font-bold text-emerald-600">{hotel.commission_rate}%</div>
                      </div>
                    </div>

                    {/* Min days + bonus */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        Min {hotel.min_days} malam
                      </span>
                      {hotel.bonus_eligible &&
                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          ⭐ Bonus
                        </span>
                    }
                    </div>

                    {/* Halal tags */}
                    <div className="flex flex-wrap gap-1">
                      {hotel.halal_tags.slice(0, 3).map((tag) =>
                    <span key={tag} className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                          🌙 {tag}
                        </span>
                    )}
                      {hotel.halal_tags.length > 3 &&
                    <span className="text-[10px] text-gray-400">+{hotel.halal_tags.length - 3}</span>
                    }
                    </div>
                  </div>
                </div>);

          })}
          </div>
        </div>
      }

      {/* Preview Tab */}
      {activeTab === 'preview' &&
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Pratonton Data Hotel Sampel</h2>
            <span className="text-xs text-gray-400">{SAMPLE_HOTELS.length} rekod</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama Hotel</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bandar</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Harga/Malam</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Min Hari</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Komisen</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rating</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bonus</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Halal Tags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {SAMPLE_HOTELS.map((hotel, i) =>
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{hotel.name}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[200px]">{hotel.description}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{hotel.city}</td>
                    <td className="px-4 py-3 font-semibold text-primary-600">RM {hotel.price_per_night}</td>
                    <td className="px-4 py-3 text-gray-600">{hotel.min_days}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-emerald-600">{hotel.commission_rate}%</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Icon name="StarIcon" size={12} className="text-yellow-400 fill-yellow-400" />
                        <span className="font-medium">{hotel.rating}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {hotel.bonus_eligible ?
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">Ya</span> :

                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Tidak</span>
                  }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {hotel.halal_tags.map((tag) =>
                    <span key={tag} className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                    )}
                      </div>
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>);

}