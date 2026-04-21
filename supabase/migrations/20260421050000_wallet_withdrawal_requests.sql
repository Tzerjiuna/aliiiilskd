-- ─── Wallet Withdrawal Requests ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  amount          NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  bank_name       TEXT NOT NULL DEFAULT '',
  account_no      TEXT NOT NULL DEFAULT '',
  account_holder  TEXT NOT NULL DEFAULT '',
  notes           TEXT,
  reference_no    TEXT,
  remarks         TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at     TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id   ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status    ON public.withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_requested ON public.withdrawal_requests(requested_at DESC);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own withdrawal requests
DROP POLICY IF EXISTS "users_select_own_withdrawal_requests" ON public.withdrawal_requests;
CREATE POLICY "users_select_own_withdrawal_requests"
  ON public.withdrawal_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own withdrawal requests
DROP POLICY IF EXISTS "users_insert_own_withdrawal_requests" ON public.withdrawal_requests;
CREATE POLICY "users_insert_own_withdrawal_requests"
  ON public.withdrawal_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can manage all withdrawal requests
DROP POLICY IF EXISTS "admins_manage_all_withdrawal_requests" ON public.withdrawal_requests;
CREATE POLICY "admins_manage_all_withdrawal_requests"
  ON public.withdrawal_requests
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
