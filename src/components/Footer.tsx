import { MapPin, Phone, Mail, Settings, ExternalLink, Landmark, CalendarDays, HardDrive, ShieldCheck } from 'lucide-react';
import LogoMark from './LogoMark';
import type { PageKey } from './Header';
import type { SiteConfig } from '../lib/site';
import { PLATFORM_PATH, PLATFORM_LABEL } from '../lib/site';

export default function Footer({
  onNavigate,
  cfg,
}: {
  onNavigate: (p: PageKey) => void;
  cfg: SiteConfig;
}) {
  const links: { label: string; page: PageKey }[] = [
    { label: 'الرئيسية', page: 'home' },
    { label: 'عن المؤسسة', page: 'about' },
    { label: 'الإدارة والأطر', page: 'administration' },
    { label: 'المستويات الدراسية', page: 'levels' },
    { label: 'الأنشطة التربوية', page: 'activities' },
    { label: 'التقويم الشخصي', page: 'personal' },
    { label: 'الموارد التعليمية', page: 'resources' },
    { label: 'فضاء التلاميذ', page: 'students' },
    { label: 'فضاء الأساتذة', page: 'teachers' },
    { label: 'الأخبار والإعلانات', page: 'news' },
    { label: 'معرض الصور', page: 'gallery' },
    { label: 'المشاريع والتطلعات', page: 'projects' },
    { label: 'تواصل معنا', page: 'contact' },
  ];

  return (
    <footer className="bg-navy text-white">
      <div className="max-w-7xl mx-auto px-5 md:px-6 py-14">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <LogoMark className="w-12 h-12 rounded-2xl" />
              <div>
                <div className="font-display font-extrabold text-lg leading-tight">{cfg.schoolName}</div>
                <div className="text-[11px] text-white/50">الموقع الرسمي — {cfg.city}</div>
              </div>
            </div>
            <p className="text-white/55 text-sm leading-relaxed">{cfg.description}</p>
          </div>

          <div>
            <h4 className="font-display font-extrabold mb-4 text-gold">روابط سريعة</h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {links.map((l) => (
                <li key={l.page}>
                  <button onClick={() => onNavigate(l.page)} className="text-white/55 hover:text-gold transition-colors">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-display font-extrabold text-gold">معلومات</h4>
            <div className="space-y-3 text-sm text-white/55">
              <div className="flex items-center gap-2.5">
                <Landmark className="w-4 h-4 text-gold shrink-0" />
                {cfg.sector}
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-gold shrink-0" />
                مدينة {cfg.city} — المملكة المغربية
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-gold shrink-0" />
                {cfg.phone || 'رقم الهاتف سيُحدَّد من لوحة الإعدادات'}
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-gold shrink-0" />
                {cfg.email || 'البريد الإلكتروني سيُحدَّد من لوحة الإعدادات'}
              </div>
              <button onClick={() => onNavigate('news')} className="flex items-center gap-2.5 text-white/55 hover:text-gold transition-colors">
                <CalendarDays className="w-4 h-4 text-gold shrink-0" />
                العطل المدرسية وفق المقرر الوزاري
              </button>
              <a href={cfg.mapsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-gold/90 hover:text-gold transition-colors">
                <ExternalLink className="w-4 h-4 shrink-0" />
                الموقع على خرائط Google
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-display font-extrabold text-gold">خدمة</h4>
            <p className="text-sm text-white/55 leading-relaxed">
              هذا الموقع منصة رقمية تمثيلية وتعليمية، تتيح للأطر المتعلمين والأطر التربوية والمرتفقين الولوج إلى خدمات المؤسسة ومواردها.
            </p>
            <div className="flex flex-col gap-2">
              <a
                href={PLATFORM_PATH}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/30 text-gold text-sm font-bold transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                {PLATFORM_LABEL} — فضاء الإدارة
              </a>
              <button
                onClick={() => onNavigate('backup')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-sm font-bold transition-colors"
              >
                <HardDrive className="w-4 h-4 text-gold" />
                تحميل نسخة احتياطية (Sauvegarde)
              </button>
              <button
                onClick={() => onNavigate('settings')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-sm font-bold transition-colors"
              >
                <Settings className="w-4 h-4 text-gold" />
                لوحة إعدادات المؤسسة
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/35">
          <span>© 2025 {cfg.schoolName} — {cfg.city} — المملكة المغربية. جميع الحقوق محفوظة.</span>
          <span>صُمِّم لخدمة المتعلم والمؤسسة — تقويم، تعلم، تواصل</span>
        </div>
      </div>
    </footer>
  );
}
