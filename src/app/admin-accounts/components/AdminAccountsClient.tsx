'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

import type { AdminAccount } from '@/types/user';
import type { AddAdminForm } from '@/types/admin';

const defaultForm: AddAdminForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'admin',
};

export default function AdminAccountsClient() {
  const supabase = createClient();
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<AdminAccount | null>(null);
  const [editAdmin, setEditAdmin] = useState<AdminAccount | null>(null);
  const [form, setForm] = useState<AddAdminForm>(defaultForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role, is_active, created_at')
      .in('role', ['admin', 'super_admin'])
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('加载管理员列表失败');
    } else {
      setAdmins(
        (data ?? []).map((row) => ({
          id: row.id,
          name: row.full_name ?? row.email ?? '—',
          email: row.email ?? '—',
          role: row.role as 'super_admin' | 'admin',
          createdAt: row.created_at
            ? new Date(row.created_at).toLocaleDateString('en-GB')
            : '—',
          status: row.is_active ? 'active' : 'inactive',
        }))
      );
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const filtered = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditAdmin(null);
    setForm(defaultForm);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowAddModal(true);
  };

  const openEdit = (admin: AdminAccount) => {
    setEditAdmin(admin);
    setForm({
      name: admin.name,
      email: admin.email,
      password: '',
      confirmPassword: '',
      role: admin.role,
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowAddModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('请填写姓名和电子邮件');
      return;
    }
    if (!editAdmin && !form.password) {
      toast.error('请设置密码');
      return;
    }
    if (form.password && form.password !== form.confirmPassword) {
      toast.error('两次密码不一致');
      return;
    }

    setSubmitting(true);
    try {
      if (!editAdmin) {
        // Create new admin via Supabase Auth sign-up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.name, role: form.role } },
        });
        if (signUpError) throw signUpError;
        if (signUpData.user) {
          // Upsert profile with correct role
          const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({ id: signUpData.user.id, email: form.email, full_name: form.name, role: form.role, is_active: true }, { onConflict: 'id' });
          if (profileError) throw profileError;
        }
        toast.success(`管理员账户 "${form.name}" 已成功创建`);
      } else {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ full_name: form.name, role: form.role })
          .eq('id', editAdmin.id);
        if (updateError) throw updateError;
        toast.success(`管理员账户 "${form.name}" 已更新`);
      }
      await fetchAdmins();
      setShowAddModal(false);
      setForm(defaultForm);
      setEditAdmin(null);
    } catch (err: any) {
      toast.error(err?.message ?? '操作失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (admin: AdminAccount) => {
    const newStatus = admin.status !== 'active';
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_active: newStatus })
      .eq('id', admin.id);
    if (error) {
      toast.error('状态更新失败');
    } else {
      toast.success(newStatus ? `账户 "${admin.name}" 已启用` : `账户 "${admin.name}" 已停用`);
      await fetchAdmins();
    }
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;
    if (showDeleteConfirm.role === 'super_admin') {
      toast.error('无法删除超级管理员账户');
      setShowDeleteConfirm(null);
      return;
    }
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: 'user' })
      .eq('id', showDeleteConfirm.id);
    if (error) {
      toast.error('删除失败');
    } else {
      toast.success(`管理员账户 "${showDeleteConfirm.name}" 已删除`);
      await fetchAdmins();
    }
    setShowDeleteConfirm(null);
  };

  const stats = {
    total: admins.length,
    active: admins.filter((a) => a.status === 'active').length,
    inactive: admins.filter((a) => a.status === 'inactive').length,
    superAdmin: admins.filter((a) => a.role === 'super_admin').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            管理员账户管理
          </h1>
          <p className="text-sm text-gray-500 mt-1">管理后台管理员账户，控制后台访问权限</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg hover:from-primary-700 hover:to-primary-600 transition-all"
        >
          <Icon name="PlusIcon" size={16} />
          添加管理员
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '管理员总数', value: stats.total, icon: 'UsersIcon', color: 'bg-blue-50 text-blue-600 border-blue-100' },
          { label: '活跃账户', value: stats.active, icon: 'CheckCircleIcon', color: 'bg-green-50 text-green-600 border-green-100' },
          { label: '停用账户', value: stats.inactive, icon: 'XCircleIcon', color: 'bg-red-50 text-red-600 border-red-100' },
          { label: '超级管理员', value: stats.superAdmin, icon: 'ShieldCheckIcon', color: 'bg-amber-50 text-amber-600 border-amber-100' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-2xl border p-4 flex items-center gap-3 ${stat.color}`}>
            <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shadow-sm">
              <Icon name={stat.icon as any} size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs font-medium opacity-80">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="搜索管理员姓名或电子邮件..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
        />
      </div>

      {/* Admin Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-primary-600 to-primary-500 text-white">
                <th className="text-left px-4 py-3 font-semibold">管理员</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">电子邮件</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">角色</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">创建日期</th>
                <th className="text-left px-4 py-3 font-semibold">状态</th>
                <th className="text-right px-4 py-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <div className="w-6 h-6 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin mx-auto mb-2" />
                    <p>加载中…</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <Icon name="UsersIcon" size={32} className="mx-auto mb-2 opacity-30" />
                    <p>未找到管理员账户</p>
                  </td>
                </tr>
              ) : (
                filtered.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm ${admin.role === 'super_admin' ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-primary-400 to-primary-600'}`}>
                          {admin.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{admin.name}</p>
                          <p className="text-xs text-gray-400 md:hidden">{admin.email}</p>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full lg:hidden ${admin.role === 'super_admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            {admin.role === 'super_admin' ? '🛡️ 超级管理员' : '👤 管理员'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{admin.email}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${admin.role === 'super_admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {admin.role === 'super_admin' ? '🛡️ 超级管理员' : '👤 管理员'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{admin.createdAt}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${admin.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${admin.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {admin.status === 'active' ? '活跃' : '停用'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(admin)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                          title="编辑"
                        >
                          <Icon name="PencilSquareIcon" size={15} />
                        </button>
                        <button
                          onClick={() => toggleStatus(admin)}
                          className={`p-1.5 rounded-lg transition-colors ${admin.status === 'active' ? 'hover:bg-orange-50 text-orange-500' : 'hover:bg-green-50 text-green-500'}`}
                          title={admin.status === 'active' ? '停用' : '启用'}
                        >
                          <Icon name={admin.status === 'active' ? 'PauseCircleIcon' : 'PlayCircleIcon'} size={15} />
                        </button>
                        {admin.role !== 'super_admin' && (
                          <button
                            onClick={() => setShowDeleteConfirm(admin)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                            title="删除"
                          >
                            <Icon name="TrashIcon" size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-primary-700 to-primary-500 px-6 py-5 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <svg viewBox="0 0 200 200" className="w-full h-full"><polygon points="100,10 190,55 190,145 100,190 10,145 10,55" fill="none" stroke="white" strokeWidth="1"/><polygon points="100,30 170,65 170,135 100,170 30,135 30,65" fill="none" stroke="white" strokeWidth="1"/></svg>
              </div>
              <div className="relative flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">{editAdmin ? '编辑管理员账户' : '添加新管理员'}</h2>
                  <p className="text-primary-100 text-xs mt-0.5">{editAdmin ? '修改管理员账户信息' : '创建一个新的后台管理员账户'}</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-white/70 hover:text-white transition-colors">
                  <Icon name="XMarkIcon" size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">姓名 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="输入管理员姓名"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">电子邮件 <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="admin@islamicbooking.my"
                  disabled={!!editAdmin}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">角色</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['admin', 'super_admin'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, role }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${form.role === role ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                      <span>{role === 'super_admin' ? '🛡️' : '👤'}</span>
                      {role === 'super_admin' ? '超级管理员' : '管理员'}
                    </button>
                  ))}
                </div>
              </div>

              {!editAdmin && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">密码 <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        placeholder="设置登录密码"
                        className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={16} />
                      </button>
                    </div>
                  </div>

                  {form.password && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">确认密码 <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={form.confirmPassword}
                          onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                          placeholder="再次输入密码"
                          className={`w-full px-3 py-2.5 pr-10 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          <Icon name={showConfirmPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={16} />
                        </button>
                      </div>
                      {form.confirmPassword && form.password !== form.confirmPassword && (
                        <p className="text-xs text-red-500 mt-1">两次密码不一致</p>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex gap-2">
                <Icon name="InformationCircleIcon" size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">管理员账户可以访问后台管理面板，请谨慎授权。</p>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl text-sm font-semibold hover:from-primary-700 hover:to-primary-600 transition-all shadow-md disabled:opacity-60"
              >
                {submitting ? '处理中…' : editAdmin ? '保存修改' : '创建账户'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="TrashIcon" size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">确认删除</h3>
            <p className="text-sm text-gray-500 mb-6">
              确定要删除管理员账户 <span className="font-semibold text-gray-700">"{showDeleteConfirm.name}"</span> 吗？此操作无法撤销。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
