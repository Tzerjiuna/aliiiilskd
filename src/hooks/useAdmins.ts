'use client';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { fetchAdmins } from '@/services/adminService';
import type { AdminAccount } from '@/types/user';

// ─── useAdmins Hook ───────────────────────────────────────────────────────────

export function useAdmins() {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdmins();
      setAdmins(data);
    } catch {
      toast.error('加载管理员列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { admins, loading, refetch: load };
}
