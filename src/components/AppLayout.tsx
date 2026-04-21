'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';
import { useLanguage, Lang } from '@/context/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  getMessagesForUser,
  getUnreadCountForUser,
  markAllReadForUser,
  subscribeToMessages,
  InternalMessage,
} from '@/lib/messageStore';

interface NavItem {
  labelKey: string;
  href: string;
  icon: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { labelKey: 'nav.dashboard', href: '/user-dashboard', icon: 'HomeIcon' },
  { labelKey: 'nav.hotelBooking', href: '/hotel-booking', icon: 'BuildingOfficeIcon' },
  { labelKey: 'nav.pastBookings', href: '/past-bookings', icon: 'ClipboardDocumentListIcon' },
  { labelKey: 'nav.withdrawalTracker', href: '/withdrawal-tracker', icon: 'BanknotesIcon' },
  { labelKey: 'nav.walletTopup', href: '/wallet-topup', icon: 'ArrowDownTrayIcon' },
  { labelKey: 'nav.walletWithdrawal', href: '/wallet-withdrawal', icon: 'ArrowUpTrayIcon' },
  { labelKey: 'nav.userManagement', href: '/admin-user-management', icon: 'UsersIcon', adminOnly: true },
  { labelKey: 'nav.analytics', href: '/admin-analytics', icon: 'ChartBarIcon', adminOnly: true },
  { labelKey: 'nav.finance', href: '/admin-finance-management', icon: 'BanknotesIcon', adminOnly: true },
  { labelKey: 'nav.hotelManagement', href: '/admin-hotel-management', icon: 'BuildingStorefrontIcon', adminOnly: true },
  { labelKey: 'nav.hotelImport', href: '/admin-hotel-import', icon: 'ArrowDownTrayIcon', adminOnly: true },
  { labelKey: 'nav.adminAccounts', href: '/admin-accounts', icon: 'ShieldCheckIcon', adminOnly: true },
  { labelKey: 'nav.adminMessages', href: '/admin-messages', icon: 'ChatBubbleLeftRightIcon', adminOnly: true },
];

interface AppLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

const LANGS: { code: Lang; label: string }[] = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'EN' },
  { code: 'ms', label: 'BM' },
];

export default function AppLayout({ children, isAdmin: isAdminProp }: AppLayoutProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const { isAdmin: isAdminFromAuth } = useAuth();

  // Use auth-based role as source of truth; fall back to prop only if auth not yet resolved
  const isAdmin = isAdminFromAuth ?? isAdminProp ?? false;

  // Notification bell state (for non-admin users)
  const CURRENT_USER_ID = 'user-001'; // In real app, from auth context
  const [bellOpen, setBellOpen] = useState(false);
  const [userMessages, setUserMessages] = useState<InternalMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refresh = () => {
      setUserMessages(getMessagesForUser(CURRENT_USER_ID));
      setUnreadCount(getUnreadCountForUser(CURRENT_USER_ID));
    };
    refresh();
    const unsub = subscribeToMessages(refresh);
    return unsub;
  }, []);

  // Close bell panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleBellClick = () => {
    setBellOpen((prev) => !prev);
    if (!bellOpen) {
      markAllReadForUser(CURRENT_USER_ID);
      setUnreadCount(0);
      setUserMessages(getMessagesForUser(CURRENT_USER_ID));
    }
  };

  const filteredNav = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="flex min-h-screen bg-ivory">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          bg-white border-r border-[hsl(var(--border))]
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-16' : 'w-60'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          shadow-[2px_0_12px_rgba(0,0,0,0.06)]
        `}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 px-4 border-b border-[hsl(var(--border))] ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <AppLogo size={32} />
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm text-primary-500 tracking-tight">IslamicBooking</span>
              <span className="text-[10px] font-mono text-gold-600 tracking-widest uppercase">Pro</span>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {!collapsed && (
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))] px-3 py-2">
              {isAdmin ? t('nav.adminPanel') : t('nav.mainMenu')}
            </p>
          )}
          {filteredNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={`nav-${item.href}`}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  sidebar-item flex items-center gap-3 px-3 py-2.5 text-sm
                  ${isActive ? 'sidebar-item-active' : 'text-[hsl(var(--muted-foreground))]'}
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? t(item.labelKey) : undefined}
              >
                <Icon name={item.icon as any} size={18} className={isActive ? 'text-primary-500' : ''} />
                {!collapsed && (
                  <span className="flex-1">{t(item.labelKey)}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Language switcher */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-[hsl(var(--border))]">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-2">{t('lang.label')}</p>
            <div className="flex gap-1">
              {LANGS.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    lang === code
                      ? 'bg-primary-500 text-white' :'bg-gray-100 text-gray-600 hover:bg-primary-50 hover:text-primary-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
        {collapsed && (
          <div className="px-2 py-3 border-t border-[hsl(var(--border))] flex flex-col gap-1">
            {LANGS.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                title={code.toUpperCase()}
                className={`w-full py-1 rounded-lg text-[10px] font-bold transition-colors ${
                  lang === code
                    ? 'bg-primary-500 text-white' :'bg-gray-100 text-gray-600 hover:bg-primary-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Bottom user section */}
        <div className={`p-3 border-t border-[hsl(var(--border))]`}>
          <Link
            href="/sign-up-login-screen"
            className={`sidebar-item flex items-center gap-3 px-3 py-2.5 text-sm text-[hsl(var(--muted-foreground))] ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? t('nav.signOut') : undefined}
          >
            <Icon name="ArrowRightOnRectangleIcon" size={18} />
            {!collapsed && <span>{t('nav.signOut')}</span>}
          </Link>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-[hsl(var(--border))] shadow-sm items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <Icon name={collapsed ? 'ChevronRightIcon' : 'ChevronLeftIcon'} size={12} className="text-gray-500" />
        </button>
      </aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-60'}`}>
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-[hsl(var(--border))] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Icon name="Bars3Icon" size={20} />
            </button>
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                {isAdmin ? t('topbar.adminPanel') : t('topbar.islamicBooking')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Wallet quick view */}
            {!isAdmin && (
              <div className="hidden sm:flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-xl px-3 py-1.5">
                <Icon name="WalletIcon" size={14} className="text-primary-500" />
                <span className="font-mono text-sm font-semibold text-primary-600">RM 1,250.00</span>
              </div>
            )}

            {/* Language switcher (topbar - mobile) */}
            <div className="flex lg:hidden gap-1">
              {LANGS.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                    lang === code
                      ? 'bg-primary-500 text-white' :'bg-gray-100 text-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Notification bell — only for non-admin users */}
            {!isAdmin && (
              <div className="relative" ref={bellRef}>
                <button
                  onClick={handleBellClick}
                  className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <Icon name="BellIcon" size={20} className="text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                  {unreadCount === 0 && userMessages.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-gray-300 rounded-full" />
                  )}
                </button>

                {/* Bell dropdown panel */}
                {bellOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    {/* Panel header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-primary-50">
                      <div className="flex items-center gap-2">
                        <Icon name="BellIcon" size={16} className="text-primary-500" />
                        <span className="font-semibold text-sm text-gray-800">站内消息</span>
                        {userMessages.length > 0 && (
                          <span className="text-xs bg-primary-100 text-primary-600 px-1.5 py-0.5 rounded-full font-medium">
                            {userMessages.length}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setBellOpen(false)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors text-gray-400"
                      >
                        <Icon name="XMarkIcon" size={14} />
                      </button>
                    </div>

                    {/* Messages list */}
                    <div className="max-h-96 overflow-y-auto">
                      {userMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                          <Icon name="InboxIcon" size={36} className="mb-2 opacity-30" />
                          <p className="text-sm">暂无消息</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {userMessages.map((msg) => (
                            <div key={msg.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                                  <Icon name="ShieldCheckIcon" size={12} className="text-white" />
                                </div>
                                <span className="text-xs font-semibold text-primary-600">管理员</span>
                                <span className="ml-auto text-[10px] text-gray-400">
                                  {new Date(msg.sentAt).toLocaleString('zh-CN', {
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              {msg.text && (
                                <p className="text-sm text-gray-700 leading-relaxed">{msg.text}</p>
                              )}
                              {msg.imageUrl && (
                                <img
                                  src={msg.imageUrl}
                                  alt="消息图片"
                                  className="mt-2 max-h-40 w-full rounded-xl object-contain bg-gray-50"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Admin bell (no messages, just indicator) */}
            {isAdmin && (
              <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <Icon name="BellIcon" size={20} className="text-gray-600" />
              </button>
            )}

            {/* Avatar */}
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold">
                A
              </div>
              {!isAdmin && (
                <div className="hidden sm:flex flex-col leading-tight">
                  <span className="text-xs font-semibold text-gray-700">Ahmad Faris</span>
                  <span className="text-[10px] text-gold-600 font-medium">{t('dashboard.level')} 2</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 xl:p-8 max-w-screen-2xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}