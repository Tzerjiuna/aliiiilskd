import { createClient } from '@/lib/supabase/client';
import type { Hotel } from '@/types/hotel';

// ─── Field Mapping ────────────────────────────────────────────────────────────

function mapDbRowToHotel(row: Record<string, unknown>): Hotel {
  return {
    id: row.id as string,
    name: row.name as string,
    location: (row.location ?? row.city ?? '') as string,
    pricePerNight: Number(row.price_per_night ?? 0),
    minDays: Number(row.min_days ?? 1),
    rating: Number(row.rating ?? 0),
    image: (row.image_url ?? '') as string,
    imageAlt: (row.name as string) ?? '',
    halalTags: Array.isArray(row.halal_tags) ? (row.halal_tags as string[]) : [],
    active: Boolean(row.is_active ?? true),
    bonusEligible: Boolean(row.bonus_eligible ?? false),
    commission: String(row.commission_rate ?? '10'),
  };
}

// ─── Hotel Service ────────────────────────────────────────────────────────────

export async function fetchActiveHotels(): Promise<Hotel[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('hotels')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapDbRowToHotel);
}

export async function fetchAllHotels(): Promise<Hotel[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('hotels')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapDbRowToHotel);
}

export async function createHotel(hotel: Omit<Hotel, 'id'>): Promise<Hotel> {
  const supabase = createClient();
  const dbRow = {
    name: hotel.name,
    location: hotel.location,
    price_per_night: hotel.pricePerNight,
    min_days: hotel.minDays,
    rating: hotel.rating,
    image_url: hotel.image,
    halal_tags: hotel.halalTags,
    is_active: hotel.active,
    bonus_eligible: hotel.bonusEligible,
    commission_rate: parseFloat(hotel.commission),
  };
  const { data, error } = await supabase
    .from('hotels')
    .insert(dbRow)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapDbRowToHotel(data as Record<string, unknown>);
}

export async function updateHotel(
  id: string,
  updates: Partial<Hotel>
): Promise<void> {
  const supabase = createClient();
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.location !== undefined) dbUpdates.location = updates.location;
  if (updates.pricePerNight !== undefined) dbUpdates.price_per_night = updates.pricePerNight;
  if (updates.minDays !== undefined) dbUpdates.min_days = updates.minDays;
  if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
  if (updates.image !== undefined) dbUpdates.image_url = updates.image;
  if (updates.halalTags !== undefined) dbUpdates.halal_tags = updates.halalTags;
  if (updates.active !== undefined) dbUpdates.is_active = updates.active;
  if (updates.bonusEligible !== undefined) dbUpdates.bonus_eligible = updates.bonusEligible;
  if (updates.commission !== undefined) dbUpdates.commission_rate = parseFloat(updates.commission);

  const { error } = await supabase
    .from('hotels')
    .update(dbUpdates)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function deleteHotel(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('hotels').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export async function uploadHotelImage(file: File, hotelId?: string): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split('.').pop() ?? 'jpg';
  const fileName = `${hotelId ?? Date.now()}-${Date.now()}.${ext}`;
  const filePath = `hotels/${fileName}`;

  const { error } = await supabase.storage
    .from('hotel-images')
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('hotel-images').getPublicUrl(filePath);
  return data.publicUrl;
}
