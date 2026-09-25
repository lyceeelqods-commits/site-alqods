import { useEffect, useRef, useState } from 'react';
import {
  Menu, X, ChevronDown, Moon, Sun, Settings, Landmark, Newspaper,
  MessageCircle, Users, School, Building2, ClipboardList,
  Sparkles, Images, Rocket, ClipboardCheck, FileText as FxIcon, HardDrive,
  ShieldCheck,
} from 'lucide-react';
import LogoMark from './LogoMark';
import { PLATFORM_PATH, PLATFORM_LABEL } from '../lib/site';

export type PageKey =
  | 'home' | 'about' | 'administration' | 'levels'
  | 'activities' | 'gallery' | 'projects'
  | 'resources' | 'students' | 'teachers' | 'personal' | 'exams'
  | 'news' | 'contact' | 'settings' | 'backup';

const MENU: { label: string; page: PageKey; icon: any; children?: { label: string; page: PageKey; icon: any }[] }[] = [
  { label: 'الرئيسية', page: 'home', icon: Landmark },
  {
    label: 'عن المؤسسة', page: 'about', icon: Landmark,
    children: [
      { label: 'عن المؤسسة', page: 'about', icon: School },
      { label: 'الإدارة والأطر', page: 'administration', icon: Building2 },
      { label: 'المستويات الدراسية', page: 'levels', icon: ClipboardList },
    ],
  },
  {
    label: 'الحياة المدرسية', page: 'activities', icon: Users,
    children: [
      { label: 'الأنشطة التربوية', page: 'activities', icon: Sparkles },
      { label: 'معرض الصور', page: 'gallery', icon: Images },
      { label: 'المشاريع والتطلعات', page: 'projects', icon: Rocket },
    ],
  },
  { label: 'التقويم الشخصي', page: 'personal', icon: ClipboardCheck },
  { label: 'الموارد التعليمية', page: 'resources', icon: FxIcon },
  { label: 'الأخبار والإعلانات', page: 'news', icon: Newspaper },
  { label: 'تواصل معنا', page: 'contact', icon: MessageCircle },
];

const ALL_PAGES: { label: string; page: PageKey; icon: any }[] = [
  ...MENU.flatMap((m) => (m.children ? m.children : [{ label: m.label, page: m.page, icon: m.icon }])),
];

export default function Header({
  page,
  onNavigate,
  dark,
  onToggleDark,
}: {
  page: string;
  onNavigate: (p: PageKey) => void;
  dark: boolean;
  onToggleDark: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [drop, setDrop] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const today = new Intl.DateTimeFormat('ar-MA-u-ca-gregory', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  const go = (p: PageKey) => {
    setOpen(false);
    setDrop(null);
    onNavigate(p);
  };

  const keepDrop = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setDrop(null), 180);
  };

  const isActive = (p: PageKey, children?: { page: PageKey }[]) =>
    page === p || (children?.some((c) => c.page === page) ?? false);

  return (
    <>
      {/* utility bar */}
      <div className="hidden md:block bg-navy text-white/70 text-xs">
        <div className="max-w-7xl mx-auto px-5 md:px-6 h-9 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Landmark className="w-3.5 h-3.5 text-gold" />
            المملكة المغربية — الأكاديمية الجهوية للتربية والتكوين — المديرية الإقليمية بالقنيطرة
          </span>
          <span className="flex items-center gap-4">
            <span>{today}</span>
            <button
              onClick={onToggleDark}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="تبديل الوضع الليلي"
            >
              {dark ? <Sun className="w-3.5 h-3.5 text-gold" /> : <Moon className="w-3.5 h-3.5 text-gold" />}
              {dark ? 'الوضع النهاري' : 'الوضع الليلي'}
            </button>
          </span>
        </div>
      </div>

      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-[0_10px_30px_-12px_rgba(12,35,64,0.25)]' : ''}`}>
        <div className={`transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-[#0c1a30]/90 backdrop-blur-xl border-b border-line dark:border-white/10' : 'bg-white dark:bg-[#0c1a30] border-b border-line dark:border-white/10'}`}>
          <div className="max-w-7xl mx-auto px-5 md:px-6">
            <div className="h-[68px] flex items-center justify-between gap-4">
              <button onClick={() => go('home')} className="flex items-center gap-3 group shrink-0">
                <LogoMark className="w-11 h-11" />
                <div className="text-right">
                  <div className="font-display font-black leading-tight text-ink dark:text-white text-[15px]">الثانوية التأهيلية القدس</div>
                  <div className="text-[11px] t-muted leading-tight">الموقع الرسمي — القنيطرة، المغرب</div>
                </div>
              </button>

              {/* desktop nav */}
              <nav className="hidden lg:flex items-center gap-0.5">
                {MENU.map((m) => (
                  <div
                    key={m.label}
                    className="relative"
                    onMouseEnter={() => { keepDrop(); if (m.children) setDrop(m.label); }}
                    onMouseLeave={scheduleClose}
                  >
                    <button
                      onClick={() => go(m.page)}
                      className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[13.5px] font-bold transition-colors ${
                        isActive(m.page, m.children)
                          ? 'text-azure bg-sky-soft dark:text-gold dark:bg-white/10'
                          : 'text-ink/80 dark:text-white/80 hover:text-azure dark:hover:text-gold hover:bg-sky-soft dark:hover:bg-white/5'
                      }`}
                    >
                      {m.label}
                      {m.children && <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${drop === m.label ? 'rotate-180' : ''}`} />}
                    </button>

                    {m.children && drop === m.label && (
                      <div className="absolute top-full right-0 pt-2 anim-pop-in">
                        <div className="w-60 bg-white dark:bg-[#101d33] border border-line dark:border-white/10 rounded-2xl shadow-2xl shadow-navy/15 dark:shadow-black/50 p-2">
                          {m.children.map((c) => (
                            <button
                              key={c.page}
                              onClick={() => go(c.page)}
                              className={`w-full text-right px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                                page === c.page
                                  ? 'bg-sky-soft text-azure dark:bg-white/10 dark:text-gold'
                                  : 'text-ink/80 dark:text-white/80 hover:bg-sky-soft dark:hover:bg-white/5'
                              }`}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              <div className="flex items-center gap-2">
                <a
                  href={PLATFORM_PATH}
                  className="btn-gold hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-[13px]"
                  title="فضاء الإدارة والحراسة — دخول محمي"
                >
                  <ShieldCheck className="w-4 h-4" />
                  منصة الحراسة
                </a>
                <button
                  onClick={onToggleDark}
                  className="lg:hidden md:hidden p-2.5 rounded-xl border border-line dark:border-white/15 text-ink dark:text-white hover:bg-sky-soft dark:hover:bg-white/10 transition-colors"
                  aria-label="الوضع الليلي"
                >
                  {dark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
                </button>
                <button
                  onClick={() => go('backup')}
                  className="hidden md:flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-line dark:border-white/15 text-[13px] font-bold text-ink dark:text-white hover:bg-sky-soft dark:hover:bg-white/10 transition-colors"
                  title="Télécharger la sauvegarde du projet"
                >
                  <HardDrive className="w-4 h-4 text-[#8c5f1f] dark:text-[#e0b256]" />
                  نسخة احتياطية
                </button>
                <button
                  onClick={() => go('settings')}
                  className="hidden md:flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-line dark:border-white/15 text-[13px] font-bold text-ink dark:text-white hover:bg-sky-soft dark:hover:bg-white/10 transition-colors"
                >
                  <Settings className="w-4 h-4 text-azure dark:text-gold" />
                  لوحة الإعدادات
                </button>
                <button
                  onClick={() => setOpen(!open)}
                  className="lg:hidden p-2.5 rounded-xl border border-line dark:border-white/15 text-ink dark:text-white"
                  aria-label="القائمة"
                >
                  {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* mobile drawer */}
        {open && (
          <div className="lg:hidden absolute top-full inset-x-0 bg-white dark:bg-[#0c1a30] border-b border-line dark:border-white/10 shadow-2xl anim-pop-in max-h-[calc(100vh-68px)] overflow-y-auto">
            <div className="p-5 space-y-1">
              {ALL_PAGES.map((p) => (
                <button
                  key={p.page}
                  onClick={() => go(p.page)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-right font-bold text-sm transition-colors ${
                    page === p.page ? 'bg-sky-soft text-azure dark:bg-white/10 dark:text-gold' : 'text-ink/85 dark:text-white/85 hover:bg-sky-soft dark:hover:bg-white/5'
                  }`}
                >
                  <p.icon className="w-4.5 h-4.5 w-5 h-5" />
                  {p.label}
                </button>
              ))}
              <a
                href={PLATFORM_PATH}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-right font-bold text-sm bg-gold-soft text-gold-deep"
              >
                <ShieldCheck className="w-5 h-5" />
                {PLATFORM_LABEL} — فضاء الإدارة
              </a>
              <button
                onClick={() => go('backup')}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-right font-bold text-sm bg-sky-soft text-azure dark:bg-white/10 dark:text-gold"
              >
                <HardDrive className="w-5 h-5" />
                نسخة احتياطية (Sauvegarde)
              </button>
              <button
                onClick={() => go('settings')}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-right font-bold text-sm bg-gold-soft text-gold-deep"
              >
                <Settings className="w-5 h-5" />
                لوحة الإعدادات
              </button>
              <button
                onClick={onToggleDark}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-right font-bold text-sm surface-tint t-muted"
              >
                {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                {dark ? 'الوضع النهاري' : 'الوضع الليلي'}
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
