'use client';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';
import { useLanguage } from '@/context/LanguageContext';
import { fetchUsers, updateReputation, updateWalletBalance } from '@/services/userService';
import type { OrderLifecycleStatus, ManagedOrder, ActiveBooking, LastOrderConfig,  } from '@/types/booking';
import type { User } from '@/types/user';
import type { BonusTemplate, WalletForm, RepForm, BonusTemplateForm } from '@/types/admin';
import { ORDER_STATUS_CONFIG, DEFAULT_LAST_ORDER_CONFIG, getNextStatuses,  } from '@/constants/orderStatus';

const LIFECYCLE_STEPS: OrderLifecycleStatus[] = ['pending', 'processing', 'completed', 'disputed'];

// ─── Sub-components ───────────────────────────────────────────────────────────

interface LastOrderEditorProps {
  lastOrderConfig: LastOrderConfig;
  onSave: (config: LastOrderConfig) => void;
}

function LastOrderEditor({ lastOrderConfig, onSave }: LastOrderEditorProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<LastOrderConfig>(lastOrderConfig);

  const handleSave = () => {
    if (!form.popupTitle || !form.popupMessage) {
      toast.error('请填写所有字段');
      return;
    }
    onSave(form);
    toast.success('最后订单弹窗内容已保存');
  };

  return (
    <div className="card-elevated overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--border))] bg-gradient-to-r from-purple-50 to-indigo-50 cursor-pointer"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
            <Icon name="StarIcon" size={16} className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800">最后订单编辑模块 / Last Order Editor</h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">编辑派发最后订单时前台弹窗显示的内容</p>
          </div>
        </div>
        <Icon name={open ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={16} className="text-gray-400" />
      </div>

      {open && (
        <div className="p-5 space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-start gap-2">
            <Icon name="InformationCircleIcon" size={15} className="text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-purple-700">以下内容将在用户完成订单后，若已被派发最后订单，则以弹窗形式展示给用户。</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">弹窗标题 / Popup Title</label>
              <input
                type="text"
                value={form.popupTitle}
                onChange={e => setForm(f => ({ ...f, popupTitle: e.target.value }))}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/30 bg-white"
                placeholder="弹窗标题"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">弹窗内容 / Popup Message</label>
              <textarea
                value={form.popupMessage}
                onChange={e => setForm(f => ({ ...f, popupMessage: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/30 bg-white resize-none"
                placeholder="弹窗显示的内容"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tutor 联系名称 / Tutor Contact Label</label>
              <input
                type="text"
                value={form.tutorContact}
                onChange={e => setForm(f => ({ ...f, tutorContact: e.target.value }))}
                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/30 bg-white"
                placeholder="Tutor"
              />
            </div>
          </div>
          <div className="border border-purple-200 rounded-xl p-4 bg-purple-50/50">
            <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-3">👁 弹窗预览</p>
            <div className="bg-white rounded-xl border border-purple-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Icon name="StarIcon" size={16} className="text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-800 text-sm">{form.popupTitle || '弹窗标题'}</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{form.popupMessage || '弹窗内容'}</p>
              {form.tutorContact && (
                <div className="mt-2 flex items-center gap-1.5 bg-purple-50 rounded-lg px-2.5 py-1.5">
                  <Icon name="UserIcon" size={12} className="text-purple-500" />
                  <span className="text-xs font-semibold text-purple-700">联系 {form.tutorContact}</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors"
          >
            <Icon name="CheckIcon" size={13} />
            保存弹窗内容
          </button>
        </div>
      )}
    </div>
  );
}

interface BonusTemplateManagerProps {
  templates: BonusTemplate[];
  onAdd: (tpl: Omit<BonusTemplate, 'id'>) => void;
  onEdit: (id: string, tpl: Omit<BonusTemplate, 'id'>) => void;
  onDelete: (id: string) => void;
}

function BonusTemplateManager({ templates, onAdd, onEdit, onDelete }: BonusTemplateManagerProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<BonusTemplateForm>({ hotel: '', amount: '', commission: '' });
  const [editing, setEditing] = useState<BonusTemplate | null>(null);

  const handleSave = () => {
    if (!form.hotel || !form.amount || !form.commission) {
      toast.error('请填写所有字段');
      return;
    }
    const data = { hotel: form.hotel, amount: parseFloat(form.amount), commission: parseFloat(form.commission) };
    if (editing) {
      onEdit(editing.id, data);
      toast.success('福利订单模板已更新');
    } else {
      onAdd(data);
      toast.success('福利订单模板已添加');
    }
    setForm({ hotel: '', amount: '', commission: '' });
    setEditing(null);
  };

  const startEdit = (tpl: BonusTemplate) => {
    setEditing(tpl);
    setForm({ hotel: tpl.hotel, amount: String(tpl.amount), commission: String(tpl.commission) });
  };

  return (
    <div className="card-elevated overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--border))] bg-gradient-to-r from-amber-50 to-orange-50 cursor-pointer"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
            <Icon name="GiftIcon" size={16} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800">福利订单模板管理 / Bonus Order Templates</h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">预先设置福利订单，派发时快速选择 · {templates.length} 个模板</p>
          </div>
        </div>
        <Icon name={open ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={16} className="text-gray-400" />
      </div>

      {open && (
        <div className="p-5 space-y-4">
          {templates.length > 0 && (
            <div className="space-y-2">
              {templates.map(tpl => (
                <div key={tpl.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-[hsl(var(--border))]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Icon name="BuildingOfficeIcon" size={14} className="text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-800 text-sm truncate">{tpl.hotel}</div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">金额: <span className="font-mono font-bold text-primary-600">RM {tpl.amount.toLocaleString()}</span></span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">利润: <span className="font-mono font-bold text-green-600">RM {tpl.commission.toLocaleString()}</span></span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => startEdit(tpl)} className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors">
                      <Icon name="PencilIcon" size={13} className="text-blue-600" />
                    </button>
                    <button onClick={() => { onDelete(tpl.id); toast.success('模板已删除'); }} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
                      <Icon name="TrashIcon" size={13} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="border border-dashed border-amber-300 rounded-xl p-4 bg-amber-50/50">
            <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">
              {editing ? '✏️ 编辑模板' : '➕ 添加新模板'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">酒店名称 / Hotel</label>
                <input
                  type="text"
                  value={form.hotel}
                  onChange={e => setForm(f => ({ ...f, hotel: e.target.value }))}
                  className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 bg-white"
                  placeholder="酒店名称"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">订单金额 (RM)</label>
                <input
                  type="number" min="1" step="0.01"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 bg-white"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">利润 / Commission (RM)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.commission}
                  onChange={e => setForm(f => ({ ...f, commission: e.target.value }))}
                  className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 bg-white"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={handleSave} className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-bold">
                {editing ? '保存更改' : '添加模板'}
              </button>
              {editing && (
                <button
                  onClick={() => { setEditing(null); setForm({ hotel: '', amount: '', commission: '' }); }}
                  className="px-4 py-2 rounded-lg border border-[hsl(var(--border))] text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  取消
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ActiveBookingMonitorProps {
  bookings: ActiveBooking[];
  users: User[];
  now: Date | null;
  onDispatchBonus: (booking: ActiveBooking) => void;
  onDispatchLastOrder: (booking: ActiveBooking) => void;
  onBlockTransaction: (booking: ActiveBooking) => void;
  t: (key: string) => string;
}

function ActiveBookingMonitor({ bookings, users, now, onDispatchBonus, onDispatchLastOrder, onBlockTransaction, t }: ActiveBookingMonitorProps) {
  const getElapsed = (startedAt: Date) => {
    if (!now) return '...';
    const diffMs = now.getTime() - startedAt.getTime();
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="card-elevated overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--border))] bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800">{t('admin.activeBookingMonitor')}</h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{t('admin.activeBookingSubtitle')}</p>
          </div>
        </div>
        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
          {bookings.length} {t('admin.activeNow')}
        </span>
      </div>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Icon name="CalendarDaysIcon" size={22} className="text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-500">{t('admin.noActiveBookings')}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{t('admin.noActiveBookingsDesc')}</p>
        </div>
      ) : (
        <div className="divide-y divide-[hsl(var(--border))]">
          {bookings.map((booking) => {
            const user = users.find(u => u.id === booking.userId);
            if (!user) return null;
            return (
              <div key={`active-${booking.userId}`} className="px-5 py-4 hover:bg-gray-50/60 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold">
                        {user.full_name.charAt(0)}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-gray-900 text-sm">{user.full_name}</div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">{user.email}</div>
                      <div className="text-xs text-primary-600 font-mono font-semibold">{user.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">{t('admin.bookingHotel')}</span>
                      <span className="text-xs font-semibold text-gray-800 truncate max-w-[200px]">{booking.hotel}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">{t('admin.bookingAmount')}</span>
                      <span className="text-xs font-bold font-mono text-primary-600">RM {booking.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">{t('admin.bookingElapsed')}</span>
                      <span className="text-xs font-mono font-semibold text-amber-600">{getElapsed(booking.startedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                    <span className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-1 text-xs font-semibold text-gray-700">
                      <Icon name="UserIcon" size={11} className="text-gray-500" />
                      {user.id} · {user.full_name}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      <Icon name="BuildingOfficeIcon" size={11} className="text-emerald-500" />
                      {booking.hotel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    <button
                      onClick={() => onDispatchBonus(booking)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-semibold transition-colors"
                    >
                      <Icon name="GiftIcon" size={13} />
                      {t('admin.dispatchBonus')}
                    </button>
                    <button
                      onClick={() => onDispatchLastOrder(booking)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-semibold transition-colors"
                    >
                      <Icon name="StarIcon" size={13} />
                      派发最后订单
                    </button>
                    <button
                      onClick={() => onBlockTransaction(booking)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-semibold transition-colors"
                    >
                      <Icon name="NoSymbolIcon" size={13} />
                      {t('admin.blockTransaction')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface OrderStatusManagerProps {
  orders: ManagedOrder[];
  onUpdateStatus: (orderId: string, newStatus: OrderLifecycleStatus, note: string) => void;
}

function OrderStatusManager({ orders, onUpdateStatus }: OrderStatusManagerProps) {
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | OrderLifecycleStatus>('all');
  const [historyModal, setHistoryModal] = useState<ManagedOrder | null>(null);
  const [updateModal, setUpdateModal] = useState<ManagedOrder | null>(null);
  const [updateNote, setUpdateNote] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OrderLifecycleStatus | ''>('');

  const filtered = orders.filter(o => statusFilter === 'all' || o.status === statusFilter);

  const confirmUpdate = () => {
    if (!updateModal || !selectedStatus) return;
    onUpdateStatus(updateModal.id, selectedStatus as OrderLifecycleStatus, updateNote);
    setUpdateModal(null);
    setUpdateNote('');
    setSelectedStatus('');
  };

  return (
    <>
      <div className="card-elevated overflow-hidden">
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--border))] bg-gradient-to-r from-blue-50 to-cyan-50 cursor-pointer"
          onClick={() => setOpen(v => !v)}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
              <Icon name="ClipboardDocumentListIcon" size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">Order Status Management / 订单状态管理</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Manage order lifecycle: pending → processing → completed → disputed</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-200">{orders.length} orders</span>
            <Icon name={open ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={16} className="text-gray-400" />
          </div>
        </div>

        {open && (
          <div className="p-5 space-y-4">
            <div className="bg-gray-50 border border-[hsl(var(--border))] rounded-xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Order Lifecycle</p>
              <div className="flex items-center gap-1 flex-wrap">
                {LIFECYCLE_STEPS.map((step, idx) => {
                  const cfg = ORDER_STATUS_CONFIG[step];
                  return (
                    <React.Fragment key={step}>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${cfg.bg} ${cfg.border}`}>
                        <Icon name={cfg.icon as any} size={13} className={cfg.text} />
                        <span className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</span>
                      </div>
                      {idx < LIFECYCLE_STEPS.length - 1 && (
                        <Icon name="ChevronRightIcon" size={14} className="text-gray-400 flex-shrink-0" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">* Any status can transition to <span className="font-semibold text-red-600">Disputed</span></p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(['all', 'pending', 'processing', 'completed', 'disputed'] as const).map(s => {
                const count = s === 'all' ? orders.length : orders.filter(o => o.status === s).length;
                const cfg = s !== 'all' ? ORDER_STATUS_CONFIG[s] : null;
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'border border-[hsl(var(--border))] hover:bg-gray-100'}`}
                  >
                    {cfg && <Icon name={cfg.icon as any} size={11} />}
                    {s === 'all' ? 'All' : ORDER_STATUS_CONFIG[s as OrderLifecycleStatus].label}
                    <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${statusFilter === s ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                  <Icon name="ClipboardDocumentListIcon" size={24} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No orders found</p>
                </div>
              ) : (
                filtered.map(order => {
                  const cfg = ORDER_STATUS_CONFIG[order.status];
                  const nextStatuses = getNextStatuses(order.status);
                  return (
                    <div key={order.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white border border-[hsl(var(--border))] rounded-xl hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} border ${cfg.border}`}>
                          <Icon name={cfg.icon as any} size={16} className={cfg.text} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-gray-500">{order.id}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                              <Icon name={cfg.icon as any} size={10} />
                              {cfg.label}
                            </span>
                          </div>
                          <p className="font-semibold text-gray-800 text-sm truncate">{order.hotel}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                              <Icon name="UserIcon" size={10} />
                              {order.userName}
                            </span>
                            <span className="font-mono text-xs font-bold text-primary-600">RM {order.amount.toLocaleString()}</span>
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">{order.orderDate}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setHistoryModal(order)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-[hsl(var(--border))] text-gray-600 text-xs font-semibold transition-colors"
                        >
                          <Icon name="ClockIcon" size={12} />
                          History ({order.statusHistory.length})
                        </button>
                        {nextStatuses.length > 0 && (
                          <button
                            onClick={() => { setUpdateModal(order); setSelectedStatus(''); setUpdateNote(''); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                          >
                            <Icon name="ArrowPathIcon" size={12} />
                            Update Status
                          </button>
                        )}
                        {nextStatuses.length === 0 && (
                          <span className="text-xs text-[hsl(var(--muted-foreground))] italic">Final state</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* History Modal */}
      {historyModal && (
        <div className="modal-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Status History</h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 font-mono">{historyModal.id}</p>
              </div>
              <button onClick={() => setHistoryModal(null)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <Icon name="XMarkIcon" size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-4">
                  {historyModal.statusHistory.map((h, idx) => {
                    const cfg = ORDER_STATUS_CONFIG[h.status as OrderLifecycleStatus] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', icon: 'ClockIcon', label: h.status };
                    return (
                      <div key={`hist-${idx}`} className="flex items-start gap-4 pl-2">
                        <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${cfg.bg} ${cfg.border}`}>
                          <Icon name={cfg.icon as any} size={11} className={cfg.text} />
                        </div>
                        <div className="flex-1 pb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>{cfg.label}</span>
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">{h.changedAt}</span>
                          </div>
                          {h.note && <p className="text-xs text-gray-600 mt-1">{h.note}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <button onClick={() => setHistoryModal(null)} className="w-full mt-5 py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {updateModal && (
        <div className="modal-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Update Order Status</h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 font-mono">{updateModal.id}</p>
              </div>
              <button onClick={() => setUpdateModal(null)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <Icon name="XMarkIcon" size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <Icon name="InformationCircleIcon" size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">Select a new status for this order. All transitions are logged.</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Select New Status</p>
                {getNextStatuses(updateModal.status).map(status => {
                  const cfg = ORDER_STATUS_CONFIG[status];
                  return (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left ${selectedStatus === status ? `${cfg.border} ${cfg.bg}` : 'border-[hsl(var(--border))] hover:border-amber-300 hover:bg-amber-50/50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedStatus === status ? cfg.bg : 'bg-gray-100'}`}>
                          <Icon name={cfg.icon as any} size={14} className={selectedStatus === status ? cfg.text : 'text-gray-500'} />
                        </div>
                        <span className={`font-semibold text-sm ${cfg.text}`}>{cfg.label}</span>
                        {selectedStatus === status && (
                          <div className="ml-auto w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                            <Icon name="CheckIcon" size={11} className="text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Note (optional)</label>
                <textarea
                  value={updateNote}
                  onChange={e => setUpdateNote(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 bg-white resize-none"
                  placeholder="Reason for status change..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setUpdateModal(null)} className="flex-1 py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={confirmUpdate} disabled={!selectedStatus} className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
                  <Icon name="ArrowPathIcon" size={15} />
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminUserManagementClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [levelFilter, setLevelFilter] = useState('Semua');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [walletModal, setWalletModal] = useState<User | null>(null);
  const [repModal, setRepModal] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>([]);
  const [now, setNow] = useState<Date | null>(null);
  const perPage = 8;
  const { t } = useLanguage();

  const [bonusTemplates, setBonusTemplates] = useState<BonusTemplate[]>([]);
  const [dispatchModal, setDispatchModal] = useState<ActiveBooking | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<BonusTemplate | null>(null);
  const [dispatchLastOrderModal, setDispatchLastOrderModal] = useState<ActiveBooking | null>(null);
  const [lastOrderConfig, setLastOrderConfig] = useState<LastOrderConfig>(DEFAULT_LAST_ORDER_CONFIG);
  const [orders, setOrders] = useState<ManagedOrder[]>([]);

  const walletForm = useForm<WalletForm>({ defaultValues: { amount: '', note: '', type: 'add' } });
  const repForm = useForm<RepForm>({ defaultValues: { reputation: '', reason: '' } });

  // Load users from Supabase on mount
  useEffect(() => {
    fetchUsers()
      .then(data => setUsers(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveLastOrderConfig = (config: LastOrderConfig) => {
    setLastOrderConfig(config);
    localStorage.setItem('lastOrderConfig', JSON.stringify(config));
  };

  const handleAddTemplate = (data: Omit<BonusTemplate, 'id'>) => {
    setBonusTemplates(prev => [...prev, { ...data, id: `tpl-${Date.now()}` }]);
  };

  const handleEditTemplate = (id: string, data: Omit<BonusTemplate, 'id'>) => {
    setBonusTemplates(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  };

  const handleDeleteTemplate = (id: string) => {
    setBonusTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderLifecycleStatus, note: string) => {
    const now = new Date();
    const changedAt = `${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      return { ...o, status: newStatus, statusHistory: [...o.statusHistory, { status: newStatus, changedAt, note: note || `Status updated to ${newStatus}` }] };
    }));
    const stored = JSON.parse(localStorage.getItem('orderStatusUpdates') || '{}');
    stored[orderId] = { status: newStatus, updatedAt: changedAt, note };
    localStorage.setItem('orderStatusUpdates', JSON.stringify(stored));
    toast.success(`Order ${orderId} status updated to ${newStatus}`);
  };

  const openDispatchModal = (booking: ActiveBooking) => {
    setSelectedTemplate(null);
    setDispatchModal(booking);
  };

  const confirmDispatch = () => {
    if (!dispatchModal || !selectedTemplate) return;
    const user = users.find(u => u.id === dispatchModal.userId);
    toast.success(`福利订单已派发给 ${user?.full_name} — ${selectedTemplate.hotel} RM${selectedTemplate.amount}`);
    setDispatchModal(null);
    setSelectedTemplate(null);
  };

  const confirmDispatchLastOrder = () => {
    if (!dispatchLastOrderModal) return;
    const user = users.find(u => u.id === dispatchLastOrderModal.userId);
    const trigger = { userId: dispatchLastOrderModal.userId, config: lastOrderConfig, dispatchedAt: Date.now() };
    localStorage.setItem('lastOrderTrigger', JSON.stringify(trigger));
    toast.success(`最后订单已派发给 ${user?.full_name}`);
    setDispatchLastOrderModal(null);
  };

  const blockTransaction = (booking: ActiveBooking) => {
    const user = users.find(u => u.id === booking.userId);
    setActiveBookings(prev => prev.filter(b => b.userId !== booking.userId));
    setUsers(prev => prev.map(u => u.id === booking.userId ? { ...u, is_frozen: true, status: 'Beku' } : u));
    toast.success(`${t('admin.transactionBlocked')}: ${user?.full_name}`);
  };

  const filtered = users.filter(u => {
    const matchSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.id.includes(search);
    const matchStatus = statusFilter === 'Semua' || u.status === statusFilter;
    const matchLevel = levelFilter === 'Semua' || u.level === parseInt(levelFilter);
    return matchSearch && matchStatus && matchLevel;
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const toggleFreeze = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_frozen: !u.is_frozen, status: u.is_frozen ? 'Aktif' : 'Beku' } : u));
    const user = users.find(u => u.id === userId);
    toast.success(`Akaun ${user?.full_name} ${user?.is_frozen ? 'diaktifkan' : 'dibekukan'}`);
  };

  const handleWalletUpdate = async (data: WalletForm) => {
    if (!walletModal) return;
    const amount = parseFloat(data.amount);
    try {
      await updateWalletBalance(walletModal.id, amount, data.type, data.note);
      setUsers(prev => prev.map(u =>
        u.id === walletModal.id
          ? { ...u, wallet_balance: data.type === 'add' ? u.wallet_balance + amount : Math.max(0, u.wallet_balance - amount) }
          : u
      ));
      toast.success(`Dompet ${walletModal.full_name} ${data.type === 'add' ? 'ditambah' : 'ditolak'} RM ${amount}`);
    } catch {
      toast.error('Gagal kemaskini dompet');
    }
    setWalletModal(null);
    walletForm.reset();
  };

  const handleRepUpdate = async (data: RepForm) => {
    if (!repModal) return;
    const rep = parseInt(data.reputation);
    const clamped = Math.min(100, Math.max(0, rep));
    try {
      await updateReputation(repModal.id, clamped);
      setUsers(prev => prev.map(u => u.id === repModal.id ? { ...u, reputation: clamped } : u));
      toast.success(`Reputasi ${repModal.full_name} dikemaskini kepada ${clamped}`);
    } catch {
      toast.error('Gagal kemaskini reputasi');
    }
    setRepModal(null);
    repForm.reset();
  };

  const toggleSelect = (id: string) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelectedUsers(selectedUsers.length === paginated.length ? [] : paginated.map(u => u.id));
  };

  const bulkFreeze = () => {
    setUsers(prev => prev.map(u => selectedUsers.includes(u.id) ? { ...u, is_frozen: true, status: 'Beku' } : u));
    toast.success(`${selectedUsers.length} akaun dibekukan`);
    setSelectedUsers([]);
  };

  const repColor = (rep: number) => {
    if (rep >= 90) return 'text-green-600 bg-green-50';
    if (rep >= 80) return 'text-blue-600 bg-blue-50';
    if (rep >= 70) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const levelBadge = (level: number) => {
    const colors = ['', 'bg-gray-100 text-gray-600', 'bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600', 'bg-gold-100 text-gold-700'];
    return colors[level] || colors[1];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('nav.userManagement')}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">{users.length} {t('admin.users_label')} · {users.filter(u => u.is_frozen).length} {t('admin.frozenAccounts').toLowerCase()}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            <Icon name="ExclamationTriangleIcon" size={14} className="text-red-500" />
            <span className="text-xs font-semibold text-red-600">{users.filter(u => u.reputation < 80).length} {t('admin.lowReputationBadge')}</span>
          </div>
          <button
            onClick={() => toast.info('Eksport data pengguna')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[hsl(var(--border))] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Icon name="ArrowDownTrayIcon" size={16} />
            {t('admin.export')}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('admin.totalMembers'), value: users.length, icon: 'UsersIcon', color: 'text-primary-600 bg-primary-50' },
          { label: t('admin.activeAccounts'), value: users.filter(u => !u.is_frozen).length, icon: 'CheckCircleIcon', color: 'text-green-600 bg-green-50' },
          { label: t('admin.frozenAccounts'), value: users.filter(u => u.is_frozen).length, icon: 'LockClosedIcon', color: 'text-red-600 bg-red-50' },
          { label: t('admin.lowReputation'), value: users.filter(u => u.reputation < 80).length, icon: 'ExclamationTriangleIcon', color: 'text-amber-600 bg-amber-50' },
        ].map((stat, i) => (
          <div key={`stat-${i}`} className="card-elevated p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
              <Icon name={stat.icon as any} size={18} />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-gray-800">{stat.value}</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <LastOrderEditor lastOrderConfig={lastOrderConfig} onSave={handleSaveLastOrderConfig} />

      <BonusTemplateManager
        templates={bonusTemplates}
        onAdd={handleAddTemplate}
        onEdit={handleEditTemplate}
        onDelete={handleDeleteTemplate}
      />

      <ActiveBookingMonitor
        bookings={activeBookings}
        users={users}
        now={now}
        onDispatchBonus={openDispatchModal}
        onDispatchLastOrder={b => setDispatchLastOrderModal(b)}
        onBlockTransaction={blockTransaction}
        t={t}
      />

      {/* Filters */}
      <div className="card-elevated p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder={t('admin.searchPlaceholder')}
            className="w-full pl-9 pr-4 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none bg-white text-gray-700"
        >
          <option value="Semua">{t('admin.allStatus')}</option>
          <option value="Aktif">{t('admin.active')}</option>
          <option value="Beku">{t('admin.frozen')}</option>
        </select>
        <select
          value={levelFilter}
          onChange={e => { setLevelFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none bg-white text-gray-700"
        >
          <option value="Semua">{t('admin.allLevel')}</option>
          {[1, 2, 3, 4].map(l => <option key={l} value={String(l)}>{t('admin.level')} {l}</option>)}
        </select>
      </div>

      {/* Bulk action bar */}
      {selectedUsers.length > 0 && (
        <div className="bg-primary-600 text-white rounded-xl px-4 py-3 flex items-center justify-between shadow-green animate-fade-in">
          <span className="text-sm font-semibold">{selectedUsers.length} {t('admin.selectedUsers')}</span>
          <div className="flex gap-2">
            <button onClick={bulkFreeze} className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1">
              <Icon name="LockClosedIcon" size={12} />
              {t('admin.freezeAll')}
            </button>
            <button onClick={() => setSelectedUsers([])} className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors">
              {t('admin.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card-elevated overflow-hidden">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Icon name="UsersIcon" size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">暂无用户数据</p>
            <p className="text-xs mt-1">用户数据将从数据库加载</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))] bg-gray-50">
                    <th className="p-3 text-left w-10">
                      <input type="checkbox" checked={selectedUsers.length === paginated.length && paginated.length > 0} onChange={selectAll} className="w-4 h-4 accent-primary-500 rounded" />
                    </th>
                    <th className="p-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.user')}</th>
                    <th className="p-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.level')}</th>
                    <th className="p-3 text-right font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.walletBalance')}</th>
                    <th className="p-3 text-center font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.reputation')}</th>
                    <th className="p-3 text-center font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.orders')}</th>
                    <th className="p-3 text-center font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.status')}</th>
                    <th className="p-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.joinDate')}</th>
                    <th className="p-3 text-center font-semibold text-gray-600 text-xs uppercase tracking-wider">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((user, idx) => {
                    const isBookingNow = activeBookings.some(b => b.userId === user.id);
                    return (
                      <tr key={user.id} className={`border-b border-[hsl(var(--border))] hover:bg-gray-50/60 transition-colors group ${idx % 2 === 0 ? '' : 'bg-gray-50/30'} ${user.is_frozen ? 'opacity-60' : ''}`}>
                        <td className="p-3">
                          <input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => toggleSelect(user.id)} className="w-4 h-4 accent-primary-500 rounded" />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {user.full_name.charAt(0)}
                              </div>
                              {isBookingNow && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-gray-800 truncate max-w-[140px]">{user.full_name}</span>
                                {isBookingNow && (
                                  <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                    {t('admin.bookingNow')}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-[hsl(var(--muted-foreground))] truncate max-w-[160px]">{user.email}</div>
                              <div className="font-mono text-[10px] text-gray-400">{user.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${levelBadge(user.level)}`}>{t('admin.level')} {user.level}</span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="font-mono font-bold text-gray-800">RM {user.wallet_balance.toFixed(2)}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded-lg ${repColor(user.reputation)}`}>{user.reputation}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-mono text-sm font-semibold text-gray-700">{user.total_orders}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${user.is_frozen ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                            {user.is_frozen ? t('admin.frozen') : t('admin.active')}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-[hsl(var(--muted-foreground))]">{user.joinDate}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setWalletModal(user); walletForm.reset({ amount: '', note: '', type: 'add' }); }} title={t('admin.editWallet')} className="w-7 h-7 rounded-lg bg-primary-50 hover:bg-primary-100 flex items-center justify-center transition-colors">
                              <Icon name="WalletIcon" size={13} className="text-primary-600" />
                            </button>
                            <button onClick={() => { setRepModal(user); repForm.reset({ reputation: String(user.reputation), reason: '' }); }} title={t('admin.editReputation')} className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors">
                              <Icon name="ShieldCheckIcon" size={13} className="text-blue-600" />
                            </button>
                            <button onClick={() => toggleFreeze(user.id)} title={user.is_frozen ? t('admin.activateAccount') : t('admin.freezeAccount')} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${user.is_frozen ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'}`}>
                              <Icon name={user.is_frozen ? 'LockOpenIcon' : 'LockClosedIcon'} size={13} className={user.is_frozen ? 'text-green-600' : 'text-red-500'} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-[hsl(var(--border))] bg-gray-50/50">
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                {t('admin.showing')} {Math.min((page - 1) * perPage + 1, filtered.length)}–{Math.min(page * perPage, filtered.length)} {t('admin.of')} {filtered.length} {t('admin.users_label')}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg border border-[hsl(var(--border))] flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <Icon name="ChevronLeftIcon" size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={`page-${p}`} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${page === p ? 'bg-primary-500 text-white' : 'border border-[hsl(var(--border))] hover:bg-gray-100 text-gray-600'}`}>{p}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 rounded-lg border border-[hsl(var(--border))] flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <Icon name="ChevronRightIcon" size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <OrderStatusManager orders={orders} onUpdateStatus={handleUpdateOrderStatus} />

      {/* Dispatch Last Order Modal */}
      {dispatchLastOrderModal && (
        <div className="modal-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">派发最后订单 / Dispatch Last Order</h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{users.find(u => u.id === dispatchLastOrderModal.userId)?.full_name}</p>
              </div>
              <button onClick={() => setDispatchLastOrderModal(null)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <Icon name="XMarkIcon" size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-start gap-2">
                <Icon name="InformationCircleIcon" size={15} className="text-purple-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-purple-700">派发后，该用户在完成当前订单结算时将收到最后订单弹窗通知。</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">弹窗内容预览</p>
                <div className="bg-gray-50 border border-[hsl(var(--border))] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
                      <Icon name="StarIcon" size={14} className="text-purple-600" />
                    </div>
                    <span className="font-bold text-gray-800 text-sm">{lastOrderConfig.popupTitle}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{lastOrderConfig.popupMessage}</p>
                  {lastOrderConfig.tutorContact && (
                    <div className="mt-2 flex items-center gap-1.5 bg-purple-50 rounded-lg px-2.5 py-1.5">
                      <Icon name="UserIcon" size={12} className="text-purple-500" />
                      <span className="text-xs font-semibold text-purple-700">联系 {lastOrderConfig.tutorContact}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setDispatchLastOrderModal(null)} className="flex-1 py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">取消</button>
                <button onClick={confirmDispatchLastOrder} className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
                  <Icon name="StarIcon" size={15} />
                  确认派发
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Bonus Order Modal */}
      {dispatchModal && (
        <div className="modal-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">派发福利订单</h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{users.find(u => u.id === dispatchModal.userId)?.full_name}</p>
              </div>
              <button onClick={() => setDispatchModal(null)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <Icon name="XMarkIcon" size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <Icon name="InformationCircleIcon" size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">请选择一个预设的福利订单模板派发给该用户。用户将在其订单页面收到该福利订单。</p>
              </div>
              {bonusTemplates.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Icon name="GiftIcon" size={22} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">暂无福利订单模板</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">请先在上方添加福利订单模板</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">选择福利订单模板</p>
                  {bonusTemplates.map(tpl => (
                    <button
                      key={tpl.id}
                      onClick={() => setSelectedTemplate(tpl)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left ${selectedTemplate?.id === tpl.id ? 'border-amber-400 bg-amber-50' : 'border-[hsl(var(--border))] hover:border-amber-300 hover:bg-amber-50/50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedTemplate?.id === tpl.id ? 'bg-amber-200' : 'bg-gray-100'}`}>
                          <Icon name="BuildingOfficeIcon" size={14} className={selectedTemplate?.id === tpl.id ? 'text-amber-700' : 'text-gray-500'} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800 text-sm truncate">{tpl.hotel}</div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">金额: <span className="font-mono font-bold text-primary-600">RM {tpl.amount.toLocaleString()}</span></span>
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">利润: <span className="font-mono font-bold text-green-600">RM {tpl.commission.toLocaleString()}</span></span>
                          </div>
                        </div>
                      </div>
                      {selectedTemplate?.id === tpl.id && (
                        <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                          <Icon name="CheckIcon" size={11} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button onClick={() => setDispatchModal(null)} className="flex-1 py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">取消</button>
                <button onClick={confirmDispatch} disabled={!selectedTemplate} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
                  <Icon name="GiftIcon" size={15} />
                  确认派发
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet edit modal */}
      {walletModal && (
        <div className="modal-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{t('admin.editWalletTitle')}</h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{walletModal.full_name}</p>
              </div>
              <button onClick={() => setWalletModal(null)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <Icon name="XMarkIcon" size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 mb-5 flex items-center gap-3">
              <Icon name="WalletIcon" size={18} className="text-primary-500" />
              <div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">{t('admin.currentBalance')}</div>
                <div className="font-mono font-bold text-primary-600 text-lg">RM {walletModal.wallet_balance.toFixed(2)}</div>
              </div>
            </div>
            <form onSubmit={walletForm.handleSubmit(handleWalletUpdate)} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('admin.operationType')}</label>
                <div className="flex gap-3">
                  {(['add', 'deduct'] as const).map(type => (
                    <label key={`wtype-${type}`} className="flex-1 cursor-pointer">
                      <input type="radio" value={type} {...walletForm.register('type')} className="sr-only" />
                      <div className={`border-2 rounded-xl p-3 text-center text-sm font-semibold transition-all ${walletForm.watch('type') === type ? (type === 'add' ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-600') : 'border-[hsl(var(--border))] text-gray-500'}`}>
                        {type === 'add' ? t('admin.addBalance') : t('admin.deductBalance')}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('admin.amount')}</label>
                <input type="number" step="0.01" min="0.01" {...walletForm.register('amount', { required: true, min: 0.01 })} className="w-full px-4 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('admin.adminNote')}</label>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1.5">{t('admin.noteDesc')}</p>
                <textarea {...walletForm.register('note', { required: true })} rows={3} className="w-full px-4 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none" placeholder={t('admin.notePlaceholder')} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setWalletModal(null)} className="flex-1 py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">{t('admin.cancel')}</button>
                <button type="submit" className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-bold">{t('admin.updateWallet')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reputation edit modal */}
      {repModal && (
        <div className="modal-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{t('admin.editReputationTitle')}</h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{repModal.full_name}</p>
              </div>
              <button onClick={() => setRepModal(null)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <Icon name="XMarkIcon" size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 flex items-center gap-3">
              <Icon name="ShieldCheckIcon" size={18} className="text-blue-500" />
              <div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">{t('admin.currentReputation')}</div>
                <div className="font-mono font-bold text-blue-600 text-lg">{repModal.reputation}/100</div>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-start gap-2">
              <Icon name="InformationCircleIcon" size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">{t('admin.reputationWarningAdmin')}</p>
            </div>
            <form onSubmit={repForm.handleSubmit(handleRepUpdate)} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('admin.newReputationValue')}</label>
                <input type="number" min="0" max="100" {...repForm.register('reputation', { required: true, min: 0, max: 100 })} className="w-full px-4 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400" placeholder="0–100" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('admin.reasonForChange')}</label>
                <textarea {...repForm.register('reason', { required: true })} rows={3} className="w-full px-4 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none" placeholder={t('admin.reasonPlaceholder')} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setRepModal(null)} className="flex-1 py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">{t('admin.cancel')}</button>
                <button type="submit" className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-bold">{t('admin.updateReputation')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}