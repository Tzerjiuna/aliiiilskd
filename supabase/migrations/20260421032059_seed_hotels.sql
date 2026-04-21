-- ============================================================
-- Seed Hotels — Islamic Booking App
-- Inserts sample halal-certified hotels for the booking page
-- ============================================================

DO $$
BEGIN
  -- Hotel 1: The Majestic Kuala Lumpur
  INSERT INTO public.hotels (
    id, name, description, location, city, country,
    image_url, price_per_night, rating, total_reviews,
    is_active, min_days, commission_rate, halal_tags, bonus_eligible, is_full
  ) VALUES (
    gen_random_uuid(),
    'The Majestic Kuala Lumpur',
    'A heritage luxury hotel in the heart of KL with full halal dining and prayer facilities.',
    'Kuala Lumpur',
    'Kuala Lumpur',
    'Malaysia',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    320,
    4.8,
    1240,
    true,
    2,
    10.00,
    '["Halal Kitchen","Prayer Room","Qibla Direction","No Alcohol"]'::jsonb,
    true,
    false
  ) ON CONFLICT DO NOTHING;

  -- Hotel 2: Mandarin Oriental KL
  INSERT INTO public.hotels (
    id, name, description, location, city, country,
    image_url, price_per_night, rating, total_reviews,
    is_active, min_days, commission_rate, halal_tags, bonus_eligible, is_full
  ) VALUES (
    gen_random_uuid(),
    'Mandarin Oriental KL',
    'Five-star luxury overlooking KLCC Twin Towers with halal-certified restaurants.',
    'KLCC, KL',
    'Kuala Lumpur',
    'Malaysia',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80',
    450,
    4.9,
    2100,
    true,
    2,
    12.00,
    '["Halal Kitchen","Prayer Room","No Alcohol","Halal Certified"]'::jsonb,
    true,
    false
  ) ON CONFLICT DO NOTHING;

  -- Hotel 3: Putrajaya Marriott
  INSERT INTO public.hotels (
    id, name, description, location, city, country,
    image_url, price_per_night, rating, total_reviews,
    is_active, min_days, commission_rate, halal_tags, bonus_eligible, is_full
  ) VALUES (
    gen_random_uuid(),
    'Putrajaya Marriott Hotel',
    'Elegant hotel in Malaysia''s administrative capital with full halal amenities.',
    'Putrajaya',
    'Putrajaya',
    'Malaysia',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
    280,
    4.6,
    890,
    true,
    2,
    10.00,
    '["Halal Kitchen","Prayer Room","Qibla Direction","Family Friendly"]'::jsonb,
    false,
    false
  ) ON CONFLICT DO NOTHING;

  -- Hotel 4: Sunway Resort Hotel
  INSERT INTO public.hotels (
    id, name, description, location, city, country,
    image_url, price_per_night, rating, total_reviews,
    is_active, min_days, commission_rate, halal_tags, bonus_eligible, is_full
  ) VALUES (
    gen_random_uuid(),
    'Sunway Resort Hotel',
    'Award-winning resort adjacent to Sunway Lagoon with halal dining options.',
    'Petaling Jaya, Selangor',
    'Petaling Jaya',
    'Malaysia',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
    260,
    4.5,
    1560,
    true,
    2,
    10.00,
    '["Halal Kitchen","Prayer Room","Family Friendly","Pool"]'::jsonb,
    false,
    false
  ) ON CONFLICT DO NOTHING;

  -- Hotel 5: Pavilion Hotel Bukit Bintang
  INSERT INTO public.hotels (
    id, name, description, location, city, country,
    image_url, price_per_night, rating, total_reviews,
    is_active, min_days, commission_rate, halal_tags, bonus_eligible, is_full
  ) VALUES (
    gen_random_uuid(),
    'Pavilion Hotel Bukit Bintang',
    'Boutique luxury hotel connected to Pavilion Mall in the vibrant Bukit Bintang district.',
    'Bukit Bintang, KL',
    'Kuala Lumpur',
    'Malaysia',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
    380,
    4.7,
    1020,
    true,
    2,
    11.00,
    '["Halal Kitchen","Prayer Room","No Alcohol","City View"]'::jsonb,
    false,
    false
  ) ON CONFLICT DO NOTHING;

  -- Hotel 6: Makkah Hilton Towers
  INSERT INTO public.hotels (
    id, name, description, location, city, country,
    image_url, price_per_night, rating, total_reviews,
    is_active, min_days, commission_rate, halal_tags, bonus_eligible, is_full
  ) VALUES (
    gen_random_uuid(),
    'Makkah Hilton Towers',
    'Premium hotel steps from Masjidil Haram, ideal for Umrah and Hajj pilgrims.',
    'Makkah',
    'Makkah',
    'Saudi Arabia',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
    650,
    4.9,
    3400,
    true,
    3,
    8.00,
    '["Halal Kitchen","Prayer Room","Qibla Direction","Zamzam Water","No Alcohol"]'::jsonb,
    true,
    false
  ) ON CONFLICT DO NOTHING;

  -- Hotel 7: Bangkok Halal Suites
  INSERT INTO public.hotels (
    id, name, description, location, city, country,
    image_url, price_per_night, rating, total_reviews,
    is_active, min_days, commission_rate, halal_tags, bonus_eligible, is_full
  ) VALUES (
    gen_random_uuid(),
    'Bangkok Halal Suites',
    'Muslim-friendly hotel in Bangkok with halal breakfast and prayer facilities.',
    'Bangkok',
    'Bangkok',
    'Thailand',
    'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=800&q=80',
    180,
    4.3,
    720,
    true,
    2,
    10.00,
    '["Halal Kitchen","Prayer Room","Qibla Direction","Muslim Friendly"]'::jsonb,
    false,
    false
  ) ON CONFLICT DO NOTHING;

  -- Hotel 8: Istanbul Grand Mosque Hotel
  INSERT INTO public.hotels (
    id, name, description, location, city, country,
    image_url, price_per_night, rating, total_reviews,
    is_active, min_days, commission_rate, halal_tags, bonus_eligible, is_full
  ) VALUES (
    gen_random_uuid(),
    'Istanbul Grand Mosque Hotel',
    'Historic hotel near the Blue Mosque with full halal services and Bosphorus views.',
    'Turkey',
    'Istanbul',
    'Turkey',
    'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80',
    220,
    4.6,
    980,
    true,
    2,
    10.00,
    '["Halal Kitchen","Prayer Room","No Alcohol","Historic Location"]'::jsonb,
    false,
    false
  ) ON CONFLICT DO NOTHING;

  -- Hotel 9: Maldives Halal Resort
  INSERT INTO public.hotels (
    id, name, description, location, city, country,
    image_url, price_per_night, rating, total_reviews,
    is_active, min_days, commission_rate, halal_tags, bonus_eligible, is_full
  ) VALUES (
    gen_random_uuid(),
    'Maldives Halal Resort',
    'Overwater bungalows with halal dining and alcohol-free environment in the Maldives.',
    'Maldives',
    'Male',
    'Maldives',
    'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80',
    850,
    4.9,
    560,
    true,
    3,
    9.00,
    '["Halal Kitchen","Prayer Room","No Alcohol","Overwater Villa","Beach"]'::jsonb,
    true,
    false
  ) ON CONFLICT DO NOTHING;

  -- Hotel 10: Seoul Muslim Friendly Hotel
  INSERT INTO public.hotels (
    id, name, description, location, city, country,
    image_url, price_per_night, rating, total_reviews,
    is_active, min_days, commission_rate, halal_tags, bonus_eligible, is_full
  ) VALUES (
    gen_random_uuid(),
    'Seoul Muslim Friendly Hotel',
    'Centrally located hotel in Seoul with halal restaurant and prayer room for Muslim travelers.',
    'Korea',
    'Seoul',
    'South Korea',
    'https://images.unsplash.com/photo-1601621915196-2621bfb0cd6e?w=800&q=80',
    200,
    4.4,
    430,
    true,
    2,
    10.00,
    '["Halal Kitchen","Prayer Room","Qibla Direction","Muslim Friendly"]'::jsonb,
    false,
    false
  ) ON CONFLICT DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Hotel seed failed: %', SQLERRM;
END $$;
