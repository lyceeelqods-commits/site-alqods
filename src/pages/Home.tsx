import {
  Compass, BookOpen, Newspaper, MessageCircle, ClipboardCheck,
  ArrowLeft, Sparkles, CalendarDays, Megaphone, MapPin,
} from 'lucide-react';
import Reveal from '../components/Reveal';
import LogoMark from '../components/LogoMark';
import { SectionHead, Chip, Stat, IMG, TopoLines } from '../components/ui';
import type { PageKey } from '../components/Header';
import type { SiteConfig } from '../lib/site';
import { NEWS_ITEMS } from '../lib/site';
import { levels } from '../data/levels';
import { formatDate } from '../lib/store';

const ACTIVITY_TEASERS = [
  { icon: '🎭', title: 'نادي المسرح والفنون', desc: 'تفعيل الحس الإبداعي عبر الورشات والعروض المدرسية', img: IMG.brightClass, cat: 'ثقافي' },
  { icon: '⚽', title: 'الأنشطة الرياضية', desc: 'دورات وبطولات داخلية في عدة ألعاب جماعية وفردية', img: IMG.uniformClass, cat: 'رياضي' },
  { icon: '', title: 'المسابقات العلمية', desc: 'تأطير التلاميذ المتفوقين في الأولمبياد الوطني للعلوم', img: IMG.lessonBoard, cat: 'علمي' },
  { icon: '🌍', title: 'المواطنة والبيئة', desc: 'حس المواطنة والحفاظ على المحيط من خلال محطات توعوية', img: IMG.classroomHands, cat: 'مواطنة' },
];

export default function Home({ cfg, onNavigate }: { cfg: SiteConfig; onNavigate: (p: PageKey) => void }) {
  const latestNews = NEWS_ITEMS.slice(0, 3);

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-navy">
        <img src={IMG.heroBuilding} alt="المؤسسة" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-l from-navy via-navy/85 to-navy/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-navy/60" />
        <TopoLines className="absolute -left-48 -top-48 w-[680px] h-[680px] opacity-80" />

        <div className="relative max-w-7xl mx-auto px-5 md:px-6 w-full py-28">
          <div className="max-w-3xl space-y-7">
            <Reveal>
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-gold/40 bg-gold/10 text-gold text-sm font-bold">
                <MapPin className="w-4 h-4" />
                {cfg.city} — المملكة المغربية
              </div>
            </Reveal>

            <Reveal delay={100}>
              <LogoMark className="w-24 h-24 md:w-28 md:h-28 mb-7 drop-shadow-[0_16px_30px_rgba(12,35,64,0.5)]" />
              <h1 className="font-display font-black text-4xl md:text-6xl leading-[1.3] text-white">
                {cfg.schoolName}
                <span className="block text-2xl md:text-4xl text-gold mt-3 font-extrabold">
                  بالقنيطرة — حيث يبدأ التميز بالتعليم
                </span>
              </h1>
            </Reveal>

            <Reveal delay={200}>
              <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-2xl">
                مؤسسة تأهيلية رائدة تكرّس رسالتها التربوية في تكوين متعلمين متمكنين ومبادرين،
                وبناء مواطنين أوفياء للوطن — من خلال بيئة تعليمية رقمية متجددة، وحياة مدرسية نابضة،
                ودعم مستمر للتعلم الذاتي.
              </p>
            </Reveal>

            <Reveal delay={300}>
              <div className="flex flex-wrap gap-4 pt-2">
                <button onClick={() => onNavigate('about')} className="btn-gold px-8 py-4 rounded-2xl font-display font-extrabold text-base inline-flex items-center gap-2.5">
                  تعرّف على المؤسسة
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button onClick={() => onNavigate('students')} className="px-8 py-4 rounded-2xl border-2 border-white/25 text-white font-bold hover:bg-white/10 transition-all inline-flex items-center gap-2.5">
                  <Compass className="w-5 h-5 text-gold" />
                  فضاء التلاميذ
                </button>
              </div>
            </Reveal>

            <Reveal delay={400}>
              <div className="grid grid-cols-3 max-w-md gap-4 pt-8">
                <Stat value={7} label="مسلكاً تأهيلياً" />
                <Stat value={20} suffix="+" label="مواد وتخصصات" />
                <Stat value={12} label="نادياً ونشاطاً" />
              </div>
            </Reveal>
          </div>
        </div>

        {/* bottom wave */}
        <div className="absolute bottom-0 inset-x-0 h-14 bg-[var(--c-bg)] [clip-path:polygon(0_65%,100%_100%,100%_100%,0_100%)]" />
      </section>

      {/* ================= TICKER ================= */}
      <div className="bg-azure text-white overflow-hidden py-3 relative">
        <div className="absolute right-0 inset-y-0 z-10 flex items-center gap-2 bg-navy px-5 font-display font-extrabold text-sm text-gold">
          <Megaphone className="w-4 h-4" />
          إعلانات
        </div>
        <div className="ticker-track" style={{ paddingRight: '180px' }}>
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0">
              {cfg.announcements.map((a, i) => (
                <span key={i} className="flex items-center gap-3 px-8 text-sm font-medium whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                  {a}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ================= QUICK ACCESS ================= */}
      <section className="py-16 -mt-2">
        <div className="max-w-7xl mx-auto px-5 md:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Compass, title: 'التقويم الشخصي', desc: 'اكتشف مستواك، شخّص مكتسباتك، وتتبع تطورك في التاريخ والجغرافيا', page: 'personal' as PageKey, accent: 'bg-sky-soft text-azure' },
              { icon: BookOpen, title: 'الموارد التعليمية', desc: 'ملفات PDF، عروض، خرائط، جداول، مبيانات، تمارين، فروض وامتحانات وطنية', page: 'resources' as PageKey, accent: 'bg-gold-soft text-gold-deep' },
              { icon: Newspaper, title: 'الأخبار والإعلانات', desc: 'آخر المستجدات والتنظيمات الرسمية والعطل المدرسية', page: 'news' as PageKey, accent: 'bg-leaf-soft text-leaf' },
              { icon: MessageCircle, title: 'تواصل معنا', desc: 'راسل الإدارة أو افتح موقع المؤسسة على الخريطة', page: 'contact' as PageKey, accent: 'bg-terra-soft text-terra' },
            ].map((c, i) => (
              <Reveal key={c.title} delay={i * 80}>
                <button onClick={() => onNavigate(c.page)} className="card-surface w-full text-right rounded-3xl p-6 group h-full">
                  <div className={`w-12 h-12 rounded-2xl ${c.accent} flex items-center justify-center mb-5 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}>
                    <c.icon className="w-6 h-6" strokeWidth={2} />
                  </div>
                  <h3 className="font-display font-extrabold text-lg mb-1.5">{c.title}</h3>
                  <p className="text-sm t-muted leading-relaxed">{c.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-azure mt-4 group-hover:gap-3 transition-all">
                    ادخل <ArrowLeft className="w-4 h-4" />
                  </span>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= ABOUT TEASER ================= */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-5 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className="relative">
              <img src={IMG.classroomHands} alt="حياة مدرسية" className="rounded-[2rem] shadow-2xl shadow-navy/20 w-full h-[420px] object-cover" />
              <div className="absolute -bottom-6 -left-4 md:-left-8 surface rounded-2xl shadow-xl p-5 max-w-[240px] anim-floaty border border-line">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardCheck className="w-5 h-5 text-azure" />
                  <div className="font-display font-extrabold text-sm">رسالتنا التربوية</div>
                </div>
                <p className="text-xs t-muted leading-relaxed">مدرسة التعلّم، المواطنة، والإبداع — رقمية وحديثة</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="space-y-6">
              <div>
                <Chip tone="gold">عن المؤسسة</Chip>
                <h2 className="font-display font-black text-3xl md:text-4xl mt-4 mb-4">مؤسسة تتجدد في خدمة المتعلم</h2>
                <p className="t-muted text-lg leading-relaxed">{cfg.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { t: 'رسالة تربوية واضحة', d: 'بناء شخصية المتعلم معرفياً وقيمياً' },
                  { t: 'رقمنة الخدمات', d: 'موقع وموارد رقمية مفتوحة للتلاميذ' },
                  { t: 'حياة مدرسية غنية', d: 'أنشطة نوادي ومشاريع مواطنة' },
                  { t: 'شراكة مع الأسر', d: 'قناة تواصل دائمة مع أولياء الأمور' },
                ].map((f) => (
                  <div key={f.t} className="surface-tint rounded-2xl p-4">
                    <div className="font-display font-extrabold text-sm mb-1">{f.t}</div>
                    <div className="text-xs t-muted leading-relaxed">{f.d}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => onNavigate('about')} className="btn-primary px-7 py-3.5 rounded-2xl font-display font-extrabold inline-flex items-center gap-2">
                اقرأ المزيد عن المؤسسة
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= LEVELS ================= */}
      <section className="py-20 bg-[var(--c-tint)] dark:bg-[#0d1830]">
        <div className="max-w-7xl mx-auto px-5 md:px-6">
          <SectionHead eyebrow="المسار الدراسي" title="المستويات الدراسية" desc="من الجذع المشترك إلى الباكالوريا — مسالك الآداب والعلوم الإنسانية والعلوم التجريبية" />
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'الجذع المشترك',
                items: ['آداب', 'علوم'],
                desc: 'سنة توطئة لتعميق المنهجية الدراسية وبناء المكتسبات الأساسية قبل التخصص',
                ids: ['jc_adab', 'jc_sciences'],
              },
              {
                title: 'الأولى باكالوريا',
                items: ['آداب', 'علوم إنسانية', 'علوم تجريبية'],
                desc: 'سنة تعميق التخصص الدراسي ومراكمة الكفايات مع تمارين التقويم المستمر',
                ids: ['bac1_adab', 'bac1_sciences', 'bac1_sciences_exp'],
              },
              {
                title: 'الثانية باكالوريا',
                items: ['آداب', 'علوم إنسانية'],
                desc: 'سنة الإعداد النهائي لاختبارات الباكالوريا الوطنية بأدقّ ما يكون',
                ids: ['bac2_adab', 'bac2_sciences_humaines'],
              },
            ].map((lv, i) => (
              <Reveal key={lv.title} delay={i * 100}>
                <div className="card-surface rounded-3xl p-7 h-full flex flex-col">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-azure to-navy text-gold flex items-center justify-center font-display font-black text-xl mb-5 shadow-lg shadow-azure/25">
                    {i + 1}
                  </div>
                  <h3 className="font-display font-extrabold text-xl mb-2">{lv.title}</h3>
                  <p className="text-sm t-muted leading-relaxed mb-5">{lv.desc}</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {lv.items.map((it) => (
                      <Chip key={it} tone="blue">{it}</Chip>
                    ))}
                  </div>
                  <div className="mt-auto flex gap-3">
                    <button onClick={() => onNavigate('levels')} className="flex-1 px-4 py-2.5 rounded-xl border border-line hover:border-azure/50 font-bold text-sm transition-colors">
                      التفاصيل
                    </button>
                    <button onClick={() => onNavigate('personal')} className="flex-1 px-4 py-2.5 rounded-xl bg-sky-soft text-azure hover:bg-azure hover:text-white font-bold text-sm transition-colors">
                      التقويم الشخصي
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="text-center text-xs t-muted mt-6">
              {levels.length} مستويات متاحة في التقويم الشخصي الرقمي — داخل فضاء التقويم الشخصي
            </p>
          </Reveal>
        </div>
      </section>

      {/* ================= NEWS TEASER ================= */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-5 md:px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <Chip tone="blue">آخر المستجدات</Chip>
              <h2 className="font-display font-black text-3xl md:text-4xl mt-4">أخبار وإعلانات المؤسسة</h2>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <button onClick={() => onNavigate('news')} className="inline-flex items-center gap-2 text-sm font-bold text-azure hover:gap-3 transition-all">
                كل الأخبار <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="w-px h-5 bg-line" />
              <button onClick={() => onNavigate('news')} className="inline-flex items-center gap-2 text-sm font-bold text-forest dark:text-gold hover:underline">
                إعلانات وزارة التربية الوطنية
              </button>
              <span className="w-px h-5 bg-line" />
              <button onClick={() => onNavigate('news')} className="inline-flex items-center gap-2 text-sm font-bold text-gold-deep hover:underline">
                العطل المدرسية
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {latestNews.map((n, i) => (
              <Reveal key={n.id} delay={i * 100}>
                <button onClick={() => onNavigate('news')} className="card-surface text-right rounded-3xl overflow-hidden w-full h-full group">
                  <div className="relative h-40 overflow-hidden">
                    <img src={IMG.facadeBlue} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute top-3 right-3">
                      <Chip tone={n.type === 'إعلان' ? 'gold' : 'green'}>{n.type}</Chip>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-xs t-muted mb-3">
                      <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />{formatDate(n.date)}</span>
                      <span>·</span>
                      <span>{n.tag}</span>
                    </div>
                    <h3 className="font-display font-extrabold text-lg mb-2 leading-snug group-hover:text-azure transition-colors">{n.title}</h3>
                    <p className="text-sm t-muted line-clamp-2 leading-relaxed">{n.excerpt}</p>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= ACTIVITIES TEASER ================= */}
      <section className="py-20 bg-navy relative overflow-hidden">
        <TopoLines className="absolute -right-52 -top-40 w-[560px] h-[560px] opacity-40" />
        <div className="relative max-w-7xl mx-auto px-5 md:px-6">
          <SectionHead light eyebrow="الحياة المدرسية" title="أنشطة تربوية وإبداعية" desc="بيئة مدرسية نابضة بالحياة: نوادي، مسابقات، توعية، وتميّز" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ACTIVITY_TEASERS.map((a, i) => (
              <Reveal key={a.title} delay={i * 90}>
                <button onClick={() => onNavigate('activities')} className="w-full text-right rounded-3xl overflow-hidden bg-white/5 border border-white/10 hover:border-gold/40 group h-full transition-all duration-300 hover:-translate-y-1.5">
                  <div className="relative h-36 overflow-hidden">
                    <img src={a.img} alt={a.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/80 to-transparent" />
                    <span className="absolute bottom-3 right-4 text-3xl">{a.icon}</span>
                  </div>
                  <div className="p-5">
                    <Chip tone="gold">{a.cat}</Chip>
                    <h3 className="font-display font-extrabold text-white text-lg mt-3 mb-1.5">{a.title}</h3>
                    <p className="text-sm text-white/55 leading-relaxed">{a.desc}</p>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="text-center mt-10">
              <button onClick={() => onNavigate('activities')} className="btn-gold px-8 py-4 rounded-2xl font-display font-extrabold inline-flex items-center gap-2.5">
                <Sparkles className="w-5 h-5" />
                اكتشف كل الأنشطة
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-5 md:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-l from-azure to-navy text-white p-10 md:p-14 shadow-2xl shadow-azure/30">
              <TopoLines className="absolute -left-32 -bottom-40 w-[480px] h-[480px] opacity-50" />
              <div className="relative text-center space-y-6 max-w-2xl mx-auto">
                <h2 className="font-display font-black text-3xl md:text-4xl leading-snug">
                  تعلم ذكياً، وقدِّر مستواك قبل أن تبدأ
                </h2>
                <p className="text-white/70 text-lg leading-relaxed">
                  التقويم الشخصي متاح لجميع مستويات الثانوي التأهيلي في مادة الاجتماعيات —
                  ابدأ الآن مجاناً بدون تسجيل.
                </p>
                <button onClick={() => onNavigate('personal')} className="btn-gold px-9 py-4 rounded-2xl font-display font-extrabold text-lg inline-flex items-center gap-2.5">
                  <Compass className="w-5 h-5" />
                  ابدأ التقويم الشخصي
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
