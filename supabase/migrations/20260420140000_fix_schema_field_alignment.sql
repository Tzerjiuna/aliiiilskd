-- ============================================================
-- Fix Schema Field Alignment
-- Adds missing columns to hotels, orders, user_profiles, bonus_orders
-- to match what the frontend components expect
-- ============================================================

-- 1. HOTELS TABLE — add missing columns used by frontend
ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS min_days INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 2) DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS halal_tags JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS bonus_eligible BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_full BOOLEAN DEFAULT false;

-- 2. ORDERS TABLE — add missing columns used by frontend
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS is_bonus BOOLEAN DEFAULT false;

-- 3. USER_PROFILES TABLE — add missing columns used by frontend
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS reputation INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT false;

-- 4. BONUS_ORDERS TABLE — add missing commission column
ALTER TABLE public.bonus_orders
  ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(12, 2) DEFAULT 0.00;

-- 5. NOTIFICATIONS TABLE — add missing columns to align with messageStore.ts
--    DB already has: title, message, image_url, is_read, sender_id
--    messageStore uses: text (→ message), imageUrl (→ image_url), read (→ is_read), fromAdmin (→ sender metadata)
--    No schema change needed — field mapping is handled in application layer

-- 6. Update indexes for new columns
CREATE INDEX IF NOT EXISTS idx_hotels_bonus_eligible ON public.hotels(bonus_eligible);
CREATE INDEX IF NOT EXISTS idx_orders_is_bonus ON public.orders(is_bonus);
CREATE INDEX IF NOT EXISTS idx_user_profiles_level ON public.user_profiles(level);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_frozen ON public.user_profiles(is_frozen);
