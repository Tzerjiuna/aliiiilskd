-- ============================================================
-- Order Status Lifecycle Migration
-- Adds: processing, disputed to order_status enum
-- Creates: order_status_history table
-- ============================================================

-- 1. Add new values to existing order_status enum
-- PostgreSQL requires ALTER TYPE to add enum values
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'processing';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'disputed';

-- 2. Create order_status_history table
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    old_status public.order_status,
    new_status public.order_status NOT NULL,
    changed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_user_id ON public.order_status_history(user_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON public.order_status_history(created_at DESC);

-- 4. Enable RLS
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "users_view_own_order_status_history" ON public.order_status_history;
CREATE POLICY "users_view_own_order_status_history"
ON public.order_status_history FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_manage_order_status_history" ON public.order_status_history;
CREATE POLICY "admins_manage_order_status_history"
ON public.order_status_history FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6. Function: record status change and update order
CREATE OR REPLACE FUNCTION public.update_order_status(
    p_order_id UUID,
    p_new_status public.order_status,
    p_note TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_status public.order_status;
    v_user_id UUID;
BEGIN
    -- Get current status and user_id
    SELECT status, user_id INTO v_old_status, v_user_id
    FROM public.orders
    WHERE id = p_order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found: %', p_order_id;
    END IF;

    -- Update order status
    UPDATE public.orders
    SET status = p_new_status, updated_at = CURRENT_TIMESTAMP
    WHERE id = p_order_id;

    -- Insert history record
    INSERT INTO public.order_status_history (order_id, user_id, old_status, new_status, changed_by, note)
    VALUES (p_order_id, v_user_id, v_old_status, p_new_status, auth.uid(), p_note);
END;
$$;
