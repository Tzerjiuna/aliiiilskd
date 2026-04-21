'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

type Lang = 'ms' | 'en' | 'ar' | 'zh';
type Mode = 'login' | 'register';

const translations = {
  ms: {
    welcome: 'Selamat Datang',
    subtitle: 'Platform Tempahan Hotel Halal Premium',
    login: 'Log Masuk',
    register: 'Daftar',
    email: 'Emel',
    password: 'Kata Laluan',
    fullname: 'Nama Penuh',
    phone: 'Nombor Telefon',
    referral: 'Kod Rujukan (pilihan)',
    loginBtn: 'Log Masuk',
    registerBtn: 'Buat Akaun',
    noAccount: 'Belum ada akaun?',
    hasAccount: 'Sudah ada akaun?',
    registerLink: 'Daftar sekarang',
    loginLink: 'Log masuk di sini',
    rememberMe: 'Ingat saya',
    forgotPass: 'Lupa kata laluan?',
    demoTitle: 'Akaun Demo',
    demoUse: 'Guna',
    terms: 'Dengan mendaftar, anda bersetuju dengan',
    termsLink: 'Terma & Syarat',
    privacy: 'Dasar Privasi',
    and: 'dan',
    loading: 'Memproses...',
    tagline: 'Tempah. Earn. Grow.',
    feature1: 'Hotel Halal Bersertifikasi',
    feature2: 'Komisen Harian Dijamin',
    feature3: 'Sistem Level & Ganjaran',
    invalidCred: 'Kelayakan tidak sah — gunakan akaun demo di bawah',
  },
  en: {
    welcome: 'Welcome',
    subtitle: 'Premium Halal Hotel Booking Platform',
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    fullname: 'Full Name',
    phone: 'Phone Number',
    referral: 'Referral Code (optional)',
    loginBtn: 'Sign In',
    registerBtn: 'Create Account',
    noAccount: "Don\'t have an account?",
    hasAccount: 'Already have an account?',
    registerLink: 'Register now',
    loginLink: 'Sign in here',
    rememberMe: 'Remember me',
    forgotPass: 'Forgot password?',
    demoTitle: 'Demo Accounts',
    demoUse: 'Use',
    terms: 'By registering, you agree to our',
    termsLink: 'Terms & Conditions',
    privacy: 'Privacy Policy',
    and: 'and',
    loading: 'Processing...',
    tagline: 'Book. Earn. Grow.',
    feature1: 'Certified Halal Hotels',
    feature2: 'Guaranteed Daily Commission',
    feature3: 'Level & Reward System',
    invalidCred: 'Invalid credentials — use the demo accounts below to sign in',
  },
  ar: {
    welcome: 'أهلاً وسهلاً',
    subtitle: 'منصة حجز فنادق حلال المميزة',
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    fullname: 'الاسم الكامل',
    phone: 'رقم الهاتف',
    referral: 'رمز الإحالة (اختياري)',
    loginBtn: 'دخول',
    registerBtn: 'إنشاء حساب',
    noAccount: 'ليس لديك حساب؟',
    hasAccount: 'لديك حساب بالفعل؟',
    registerLink: 'سجل الآن',
    loginLink: 'سجل الدخول هنا',
    rememberMe: 'تذكرني',
    forgotPass: 'نسيت كلمة المرور؟',
    demoTitle: 'حسابات تجريبية',
    demoUse: 'استخدام',
    terms: 'بالتسجيل، أنت توافق على',
    termsLink: 'الشروط والأحكام',
    privacy: 'سياسة الخصوصية',
    and: 'و',
    loading: 'جاري المعالجة...',
    tagline: 'احجز. اكسب. انمو.',
    feature1: 'فنادق حلال معتمدة',
    feature2: 'عمولة يومية مضمونة',
    feature3: 'نظام المستويات والمكافآت',
    invalidCred: 'بيانات غير صحيحة — استخدم الحسابات التجريبية أدناه',
  },
  zh: {
    welcome: '欢迎',
    subtitle: '清真酒店预订高级平台',
    login: '登录',
    register: '注册',
    email: '电子邮件',
    password: '密码',
    fullname: '全名',
    phone: '电话号码',
    referral: '推荐码（可选）',
    loginBtn: '登录',
    registerBtn: '创建账户',
    noAccount: '没有账户？',
    hasAccount: '已有账户？',
    registerLink: '立即注册',
    loginLink: '点击登录',
    rememberMe: '记住我',
    forgotPass: '忘记密码？',
    demoTitle: '演示账户',
    demoUse: '使用',
    terms: '注册即表示您同意',
    termsLink: '条款和条件',
    privacy: '隐私政策',
    and: '和',
    loading: '处理中...',
    tagline: '预订。赚取。成长。',
    feature1: '认证清真酒店',
    feature2: '保证每日佣金',
    feature3: '等级与奖励系统',
    invalidCred: '凭证无效 — 请使用下方演示账户登录',
  },
};

type LoginForm = { email: string; password: string; remember: boolean };
type RegisterForm = { fullname: string; email: string; phone: string; password: string; referral: string };

export default function SignUpLoginClient() {
  const [lang, setLang] = useState<Lang>('ms');
  const [mode, setMode] = useState<Mode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = translations[lang];
  const { setLang: setGlobalLang } = useLanguage();
  const { signIn, signUp } = useAuth();

  const handleLangChange = (code: Lang) => {
    setLang(code);
    if (code !== 'ar') {
      setGlobalLang(code as 'ms' | 'en' | 'zh');
    }
  };

  const loginForm = useForm<LoginForm>({ defaultValues: { email: '', password: '', remember: false } });
  const registerForm = useForm<RegisterForm>({ defaultValues: { fullname: '', email: '', phone: '', password: '', referral: '' } });

  const handleLogin = async (data: LoginForm) => {
    setLoading(true);
    try {
      const result = await signIn(data.email, data.password);
      // Fetch the user's role from user_profiles
      const supabase = (await import('@/lib/supabase/client')).createClient();
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', result?.user?.id)
        .single();

      if (profile?.role === 'admin') {
        toast.success('Log masuk berjaya — Admin Panel');
        router.push('/admin-user-management');
      } else {
        toast.success('Log masuk berjaya — Selamat datang!');
        router.push('/user-dashboard');
      }
    } catch (err: any) {
      toast.error(err?.message ?? t.invalidCred);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await signUp(data.email, data.password, {
        fullName: data.fullname,
        phone: data.phone,
        referralCode: data.referral || undefined,
      });
      toast.success('Akaun berjaya didaftarkan! Sila log masuk.');
      setMode('login');
    } catch (err: any) {
      toast.error(err?.message ?? 'Pendaftaran gagal. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const langOptions: { code: Lang; label: string; flag: string }[] = [
    { code: 'ms', label: 'BM', flag: '🇲🇾' },
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'ar', label: 'AR', flag: '🇸🇦' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
  ];

  return (
    <div className={`min-h-screen flex ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Left panel — Islamic pattern */}
      <div className="hidden lg:flex lg:w-1/2 islamic-pattern relative flex-col items-center justify-center p-12">
        {/* Decorative star */}
        <div className="absolute top-8 right-8 opacity-20">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <polygon points="60,4 72,44 112,44 80,68 92,108 60,84 28,108 40,68 8,44 48,44" fill="#c9a84c" />
          </svg>
        </div>
        <div className="absolute bottom-12 left-8 opacity-10">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <polygon points="40,2 48,28 74,28 53,44 61,70 40,54 19,70 27,44 6,28 32,28" fill="#c9a84c" />
          </svg>
        </div>

        <div className="relative z-10 text-center max-w-sm">
          <div className="flex items-center justify-center gap-3 mb-8">
            <AppLogo size={56} />
            <div className="text-left">
              <div className="text-white font-bold text-2xl tracking-tight">IslamicBooking</div>
              <div className="font-mono text-gold-400 text-sm tracking-widest uppercase">Pro</div>
            </div>
          </div>

          <h1 className="text-white text-4xl font-bold mb-3">{t.tagline}</h1>
          <p className="text-white/70 text-base mb-10">{t.subtitle}</p>

          <div className="space-y-4">
            {[
              { icon: 'CheckBadgeIcon', text: t.feature1 },
              { icon: 'CurrencyDollarIcon', text: t.feature2 },
              { icon: 'TrophyIcon', text: t.feature3 },
            ].map((feat, i) => (
              <div key={`feat-${i}`} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-gold-500/30 flex items-center justify-center">
                  <Icon name={feat.icon as any} size={16} className="text-gold-300" />
                </div>
                <span className="text-white/90 text-sm font-medium">{feat.text}</span>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { value: '12,500+', label: 'Ahli Aktif' },
              { value: 'RM 2.4M', label: 'Komisen Dibayar' },
              { value: '850+', label: 'Hotel Halal' },
            ].map((stat, i) => (
              <div key={`stat-${i}`} className="text-center">
                <div className="text-gold-400 font-bold text-lg font-mono">{stat.value}</div>
                <div className="text-white/60 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — Form */}
      <div className="flex-1 flex flex-col min-h-screen bg-ivory">
        {/* Language switcher */}
        <div className="flex justify-end items-center gap-2 p-4">
          {langOptions.map(opt => (
            <button
              key={`lang-${opt.code}`}
              onClick={() => handleLangChange(opt.code)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                lang === opt.code
                  ? 'bg-primary-500 text-white shadow-green'
                  : 'bg-white border border-[hsl(var(--border))] text-gray-600 hover:border-primary-300'
              }`}
            >
              <span>{opt.flag}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
              <AppLogo size={40} />
              <div>
                <div className="font-bold text-xl text-primary-600">IslamicBooking Pro</div>
              </div>
            </div>

            {/* Card */}
            <div className="card-elevated p-8">
              {/* Mode toggle */}
              <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                {(['login', 'register'] as Mode[]).map(m => (
                  <button
                    key={`mode-${m}`}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                      mode === m ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {m === 'login' ? t.login : t.register}
                  </button>
                ))}
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-1">{t.welcome}</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">{t.subtitle}</p>

              {mode === 'login' ? (
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.email}</label>
                    <div className="relative">
                      <Icon name="EnvelopeIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        {...loginForm.register('email', { required: 'Emel diperlukan' })}
                        className="w-full pl-9 pr-4 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all bg-white"
                        placeholder="nama@email.com"
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.password}</label>
                    <div className="relative">
                      <Icon name="LockClosedIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...loginForm.register('password', { required: 'Kata laluan diperlukan' })}
                        className="w-full pl-9 pr-10 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all bg-white"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={16} />
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" {...loginForm.register('remember')} className="w-4 h-4 accent-primary-500 rounded" />
                      <span className="text-sm text-gray-600">{t.rememberMe}</span>
                    </label>
                    <button type="button" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                      {t.forgotPass}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                    style={{ minHeight: '44px' }}
                  >
                    {loading ? (
                      <>
                        <Icon name="ArrowPathIcon" size={16} className="animate-spin" />
                        {t.loading}
                      </>
                    ) : t.loginBtn}
                  </button>

                  <p className="text-center text-sm text-gray-500">
                    {t.noAccount}{' '}
                    <button type="button" onClick={() => setMode('register')} className="text-primary-500 font-semibold hover:underline">
                      {t.registerLink}
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.fullname}</label>
                    <div className="relative">
                      <Icon name="UserIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        {...registerForm.register('fullname', { required: 'Nama penuh diperlukan' })}
                        className="w-full pl-9 pr-4 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all bg-white"
                        placeholder="Ahmad bin Abdullah"
                      />
                    </div>
                    {registerForm.formState.errors.fullname && (
                      <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.fullname.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.email}</label>
                    <div className="relative">
                      <Icon name="EnvelopeIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        {...registerForm.register('email', { required: 'Emel diperlukan' })}
                        className="w-full pl-9 pr-4 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all bg-white"
                        placeholder="nama@email.com"
                      />
                    </div>
                    {registerForm.formState.errors.email && (
                      <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.phone}</label>
                    <div className="relative">
                      <Icon name="PhoneIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        {...registerForm.register('phone', { required: 'Nombor telefon diperlukan' })}
                        className="w-full pl-9 pr-4 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all bg-white"
                        placeholder="+60 12-345 6789"
                      />
                    </div>
                    {registerForm.formState.errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.password}</label>
                    <div className="relative">
                      <Icon name="LockClosedIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...registerForm.register('password', { required: 'Kata laluan diperlukan', minLength: { value: 8, message: 'Minimum 8 aksara' } })}
                        className="w-full pl-9 pr-10 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all bg-white"
                        placeholder="Minimum 8 aksara"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={16} />
                      </button>
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.referral}</label>
                    <div className="relative">
                      <Icon name="GiftIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        {...registerForm.register('referral')}
                        className="w-full pl-9 pr-4 py-2.5 border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all bg-white"
                        placeholder="IBP-XXXXX"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                    style={{ minHeight: '44px' }}
                  >
                    {loading ? (
                      <><Icon name="ArrowPathIcon" size={16} className="animate-spin" />{t.loading}</>
                    ) : t.registerBtn}
                  </button>

                  <p className="text-center text-xs text-gray-400">
                    {t.terms}{' '}
                    <span className="text-primary-500 cursor-pointer hover:underline">{t.termsLink}</span>
                    {' '}{t.and}{' '}
                    <span className="text-primary-500 cursor-pointer hover:underline">{t.privacy}</span>
                  </p>

                  <p className="text-center text-sm text-gray-500">
                    {t.hasAccount}{' '}
                    <button type="button" onClick={() => setMode('login')} className="text-primary-500 font-semibold hover:underline">
                      {t.loginLink}
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}