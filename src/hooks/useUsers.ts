'use client';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { fetchUsers } from '@/services/userService';
import type { User } from '@/types/user';

// ─── useUsers Hook ────────────────────────────────────────────────────────────

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch {
      toast.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { users, loading, refetch: load };
}
