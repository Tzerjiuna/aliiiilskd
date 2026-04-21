-- ─── Wallet Top-Up Requests ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.topup_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  amount         NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  method         TEXT NOT NULL DEFAULT 'Bank Transfer',
  reference      TEXT,
  receipt_url    TEXT,
  bank_info      TEXT,
  status         TEXT NOT NULL DEFAULT 'pending',
  submitted_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_topup_requests_user_id    ON public.topup_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_topup_requests_status     ON public.topup_requests(status);
CREATE INDEX IF NOT EXISTS idx_topup_requests_submitted  ON public.topup_requests(submitted_at DESC);

ALTER TABLE public.topup_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own top-up requests
DROP POLICY IF EXISTS "users_select_own_topup_requests" ON public.topup_requests;
CREATE POLICY "users_select_own_topup_requests"
  ON public.topup_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own top-up requests
DROP POLICY IF EXISTS "users_insert_own_topup_requests" ON public.topup_requests;
CREATE POLICY "users_insert_own_topup_requests"
  ON public.topup_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can view all top-up requests (using auth metadata to avoid recursion)
DROP POLICY IF EXISTS "admins_select_all_topup_requests" ON public.topup_requests;
CREATE POLICY "admins_select_all_topup_requests"
  ON public.topup_requests
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'role' = 'admin')
    OR (auth.jwt() ->> 'role' = 'super_admin')
    OR user_id = auth.uid()
  )
  WITH CHECK (
    (auth.jwt() ->> 'role' = 'admin')
    OR (auth.jwt() ->> 'role' = 'super_admin')
    OR user_id = auth.uid()
  );
