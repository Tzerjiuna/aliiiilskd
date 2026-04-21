-- App Settings table for storing configurable key-value settings
DROP TABLE IF EXISTS public.app_settings CASCADE;

CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Public read (so frontend can fetch settings without auth)
DROP POLICY IF EXISTS "public_read_app_settings" ON public.app_settings;
CREATE POLICY "public_read_app_settings"
  ON public.app_settings
  FOR SELECT
  TO public
  USING (true);

-- Only authenticated users (admins) can write
DROP POLICY IF EXISTS "authenticated_write_app_settings" ON public.app_settings;
CREATE POLICY "authenticated_write_app_settings"
  ON public.app_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed default low-rep withdrawal message
INSERT INTO public.app_settings (key, value)
VALUES (
  'low_rep_withdrawal_message',
  '由于您的账户信誉评分低于80分，当前提款功能已被系统暂时限制。如需恢复提款权限，请联系相关部门进行审核处理。'
)
ON CONFLICT (key) DO NOTHING;
