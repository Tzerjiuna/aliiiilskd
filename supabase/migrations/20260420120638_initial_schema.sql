-- ============================================================
-- Islamic Booking App — Initial Schema Migration
-- Tables: user_profiles, hotels, orders, wallet_logs,
--         bonus_orders, app_settings, notifications
-- ============================================================

-- 1. ENUM TYPES
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'super_admin');

DROP TYPE IF EXISTS public.order_status CASCADE;
CREATE TYPE public.order_status AS ENUM ('pending', 'active', 'completed', 'cancelled', 'blocked');

DROP TYPE IF EXISTS public.wallet_log_type CASCADE;
CREATE TYPE public.wallet_log_type AS ENUM ('credit', 'debit', 'bonus', 'withdrawal', 'refund');

DROP TYPE IF EXISTS public.bonus_order_status CASCADE;
CREATE TYPE public.bonus_order_status AS ENUM ('pending', 'dispatched', 'cancelled');

-- 2. CORE TABLES

-- user_profiles: linked to auth.users
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT '',
    username TEXT UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    role public.user_role DEFAULT 'user'::public.user_role,
    is_active BOOLEAN DEFAULT true,
    wallet_balance DECIMAL(12, 2) DEFAULT 0.00,
    total_orders INTEGER DEFAULT 0,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- hotels
CREATE TABLE IF NOT EXISTS public.hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    city TEXT,
    country TEXT DEFAULT 'Malaysia',
    image_url TEXT,
    price_per_night DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    rating DECIMAL(3, 1) DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    amenities JSONB DEFAULT '[]'::JSONB,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- orders (bookings)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    nights INTEGER NOT NULL DEFAULT 1,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status public.order_status DEFAULT 'pending'::public.order_status,
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- wallet_logs
CREATE TABLE IF NOT EXISTS public.wallet_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    log_type public.wallet_log_type NOT NULL,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    balance_before DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    balance_after DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- bonus_orders (福利订单)
CREATE TABLE IF NOT EXISTS public.bonus_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status public.bonus_order_status DEFAULT 'pending'::public.bonus_order_status,
    dispatched_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    dispatched_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- app_settings
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB,
    description TEXT,
    updated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- notifications (站内消息)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    title TEXT,
    message TEXT NOT NULL,
    image_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_hotels_is_active ON public.hotels(is_active);
CREATE INDEX IF NOT EXISTS idx_hotels_city ON public.hotels(city);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_hotel_id ON public.orders(hotel_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_logs_user_id ON public.wallet_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_logs_created_at ON public.wallet_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bonus_orders_user_id ON public.bonus_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_bonus_orders_status ON public.bonus_orders(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- 4. FUNCTIONS

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Handle new user registration: auto-create user_profiles row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url, role, username)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')::public.user_role,
        COALESCE(NEW.raw_user_meta_data->>'username', NULL)
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Admin check function (reads from auth metadata — no recursion risk)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (
        au.raw_user_meta_data->>'role' IN ('admin', 'super_admin')
        OR au.raw_app_meta_data->>'role' IN ('admin', 'super_admin')
    )
)
$$;

-- 5. ENABLE RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES

-- user_profiles
DROP POLICY IF EXISTS "users_manage_own_profile" ON public.user_profiles;
CREATE POLICY "users_manage_own_profile"
ON public.user_profiles FOR ALL TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "admins_manage_all_profiles" ON public.user_profiles;
CREATE POLICY "admins_manage_all_profiles"
ON public.user_profiles FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- hotels: public read, admin write
DROP POLICY IF EXISTS "public_read_hotels" ON public.hotels;
CREATE POLICY "public_read_hotels"
ON public.hotels FOR SELECT TO public
USING (is_active = true);

DROP POLICY IF EXISTS "admins_manage_hotels" ON public.hotels;
CREATE POLICY "admins_manage_hotels"
ON public.hotels FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- orders: users see own, admins see all
DROP POLICY IF EXISTS "users_manage_own_orders" ON public.orders;
CREATE POLICY "users_manage_own_orders"
ON public.orders FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_manage_all_orders" ON public.orders;
CREATE POLICY "admins_manage_all_orders"
ON public.orders FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- wallet_logs: users see own, admins see all
DROP POLICY IF EXISTS "users_view_own_wallet_logs" ON public.wallet_logs;
CREATE POLICY "users_view_own_wallet_logs"
ON public.wallet_logs FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_manage_wallet_logs" ON public.wallet_logs;
CREATE POLICY "admins_manage_wallet_logs"
ON public.wallet_logs FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- bonus_orders: users see own, admins manage all
DROP POLICY IF EXISTS "users_view_own_bonus_orders" ON public.bonus_orders;
CREATE POLICY "users_view_own_bonus_orders"
ON public.bonus_orders FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_manage_bonus_orders" ON public.bonus_orders;
CREATE POLICY "admins_manage_bonus_orders"
ON public.bonus_orders FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- app_settings: admins only
DROP POLICY IF EXISTS "admins_manage_settings" ON public.app_settings;
CREATE POLICY "admins_manage_settings"
ON public.app_settings FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- notifications: users see own, admins manage all
DROP POLICY IF EXISTS "users_manage_own_notifications" ON public.notifications;
CREATE POLICY "users_manage_own_notifications"
ON public.notifications FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_manage_notifications" ON public.notifications;
CREATE POLICY "admins_manage_notifications"
ON public.notifications FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 7. TRIGGERS

-- Auto-create user_profiles on new auth user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_hotels_updated_at ON public.hotels;
CREATE TRIGGER update_hotels_updated_at
    BEFORE UPDATE ON public.hotels
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_bonus_orders_updated_at ON public.bonus_orders;
CREATE TRIGGER update_bonus_orders_updated_at
    BEFORE UPDATE ON public.bonus_orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. DEFAULT APP SETTINGS
DO $$
BEGIN
    INSERT INTO public.app_settings (setting_key, setting_value, description)
    VALUES
        ('site_name', '"Islamic Booking"'::JSONB, 'Application display name'),
        ('maintenance_mode', 'false'::JSONB, 'Enable/disable maintenance mode'),
        ('booking_commission_rate', '0.05'::JSONB, 'Commission rate for bookings (5%)'),
        ('min_withdrawal_amount', '50'::JSONB, 'Minimum withdrawal amount in MYR'),
        ('welcome_bonus', '10'::JSONB, 'Welcome bonus amount for new users in MYR')
    ON CONFLICT (setting_key) DO NOTHING;
END $$;
