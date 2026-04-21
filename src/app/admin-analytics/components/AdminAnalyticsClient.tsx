'use client';
import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,  } from 'recharts';

interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bg: string;
  sub?: string;
}

interface DailyReg {
  date: string;
  users: number;
}

interface OrderStatus {
  name: string;
  value: number;
  color: string;
}

interface RecentUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  wallet_balance: number;
  created_at: string;
}

const ORDER_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  active: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444',
  blocked: '#6b7280',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs">
        <p className="font-semibold text-gray-600 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-mono font-bold">
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminAnalyticsClient() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatCard[]>([]);
  const [dailyRegs, setDailyRegs] = useState<DailyReg[]>([]);
  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [totalWallet, setTotalWallet] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      // Parallel fetches
      const [
        { count: totalUsers },
        { count: activeUsers },
        { count: totalOrders },
        { count: pendingOrders },
        { data: profilesData },
        { data: ordersData },
        { data: recentUsersData },
      ] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('user_profiles').select('wallet_balance, created_at').order('created_at', { ascending: true }),
        supabase.from('orders').select('status, created_at'),
        supabase.from('user_profiles')
          .select('id, full_name, email, role, wallet_balance, created_at')
          .order('created_at', { ascending: false })
          .limit(8),
      ]);

      // Total wallet balance
      const walletSum = profilesData?.reduce((acc, p) => acc + (parseFloat(p.wallet_balance) || 0), 0) ?? 0;
      setTotalWallet(walletSum);

      // Stats cards — frozen users = is_frozen = true (new column)
      const [{ count: frozenUsers }] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('is_frozen', true),
      ]);

      setStats([
        {
          label: '总用户数 / Total Users',
          value: totalUsers ?? 0,
          icon: 'UsersIcon',
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          sub: `${activeUsers ?? 0} 活跃`,
        },
        {
          label: '总订单数 / Total Orders',
          value: totalOrders ?? 0,
          icon: 'ShoppingBagIcon',
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
          sub: `${pendingOrders ?? 0} 待处理`,
        },
        {
          label: '总钱包余额 / Total Wallet',
          value: `RM ${walletSum.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`,
          icon: 'CurrencyDollarIcon',
          color: 'text-amber-600',
          bg: 'bg-amber-50',
        },
        {
          label: '冻结用户 / Frozen Users',
          value: frozenUsers ?? 0,
          icon: 'LockClosedIcon',
          color: 'text-red-600',
          bg: 'bg-red-50',
        },
      ]);

      // Daily registrations (last 7 days)
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().slice(0, 10);
      });
      const regMap: Record<string, number> = {};
      last7.forEach(d => (regMap[d] = 0));
      profilesData?.forEach(p => {
        const day = p.created_at?.slice(0, 10);
        if (day && regMap[day] !== undefined) regMap[day]++;
      });
      setDailyRegs(last7.map(d => ({ date: d.slice(5), users: regMap[d] })));

      // Order status distribution
      const statusMap: Record<string, number> = {};
      ordersData?.forEach(o => {
        statusMap[o.status] = (statusMap[o.status] || 0) + 1;
      });
      setOrderStatuses(
        Object.entries(statusMap).map(([name, value]) => ({
          name,
          value,
          color: ORDER_COLORS[name] ?? '#94a3b8',
        }))
      );

      setRecentUsers((recentUsersData as RecentUser[]) ?? []);
    } catch (err: any) {
      setError(err?.message ?? '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">加载分析数据中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Icon name="ExclamationCircleIcon" size={40} className="text-red-400 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={fetchAnalytics} className="mt-4 px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-lg text-sm">
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">管理员分析仪表板</h1>
          <p className="text-sm text-gray-500 mt-0.5">Admin Analytics Dashboard — 实时数据</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Icon name="ArrowPathIcon" size={16} />
          刷新
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
              <Icon name={s.icon as any} size={20} className={s.color} />
            </div>
            <div>
              <p className="text-xs text-gray-500 leading-tight">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{s.value}</p>
              {s.sub && <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily Registrations */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">近7天新用户注册</h2>
          {dailyRegs.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyRegs} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="users" name="新用户" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">暂无注册数据</div>
          )}
        </div>

        {/* Order Status Pie */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">订单状态分布</h2>
          {orderStatuses.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={orderStatuses}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {orderStatuses.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any, n: any) => [v, n]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">暂无订单数据</div>
          )}
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">最新注册用户</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">用户</th>
                <th className="px-4 py-3 text-left">邮箱</th>
                <th className="px-4 py-3 text-left">角色</th>
                <th className="px-4 py-3 text-right">钱包余额</th>
                <th className="px-4 py-3 text-left">注册时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">暂无用户数据</td>
                </tr>
              ) : (
                recentUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center text-xs font-bold text-[hsl(var(--primary))]">
                          {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="font-medium text-gray-800 truncate max-w-[140px]">{u.full_name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 truncate max-w-[180px]">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'admin' || u.role === 'super_admin' ?'bg-purple-100 text-purple-700' :'bg-green-100 text-green-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">
                      RM {parseFloat(String(u.wallet_balance || 0)).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(u.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
