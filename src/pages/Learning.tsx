import { useState } from 'react';
import {
  BookOpen, FileText, Video, Compass, Library, Lightbulb,
  Megaphone, ClipboardCheck, FolderOpen, ArrowLeft,
  LayoutDashboard, ScrollText, MessagesSquare, Calendar, Landmark,
  ShieldCheck, Search, Sparkles,
} from 'lucide-react';
import Reveal from '../components/Reveal';
import { PageHeader, SectionHead, Chip, Modal } from '../components/ui';
import type { PageKey } from '../components/Header';
import LevelSelect from '../components/LevelSelect';
import TestEngine from '../components/TestEngine';
import ResultPage from '../components/ResultPage';
import Dashboard from '../components/Dashboard';
import { levels } from '../data/levels';
import type { Diagnosis } from '../lib/diagnosis';
import { saveRecord } from '../lib/store';
import { DIGITAL_RESOURCES, PLATFORM_GUIDES } from '../data/resources';
import DocLibrary from '../components/DocLibrary';

const TYPE_ICON: Record<string, any> = {
  'منصة رسمية': Landmark,
  'دروس ومذكرات': BookOpen,
  'امتحانات': FileText,
  'فيديو': Video,
  'مكتبة': Library,
  'أداة': Compass,
};

/* ==================== الموارد التعليمية الرقمية ==================== */
export function ResourcesPage({ cfg, onNavigate }: { cfg: any; onNavigate: (p: PageKey) => void }) {
  void cfg;
  const [filter, setFilter] = useState<'official' | 'social' | 'all'>('all');
  const [query, setQuery] = useState('');
  const [openGuide, setOpenGuide] = useState<typeof PLATFORM_GUIDES[number] | null>(null);

  const shown = DIGITAL_RESOURCES.filter((r) => {
    const byCat = filter === 'all' ? true : filter === 'official' ? r.official : r.subject === 'الاجتماعيات';
    const byQuery =
      !query.trim() ||
      r.name.includes(query) ||
      r.desc.includes(query) ||
      r.tags.some((t) => t.includes(query));
    return byCat && byQuery;
  });

  const officialCount = DIGITAL_RESOURCES.filter((r) => r.official).length;

  return (
    <>
      <PageHeader
        eyebrow="خزانة المؤسسة الرقمية"
        title="الموارد التعليمية"
        subtitle="مكتبة منظمة لجميع الوثائق المصاحبة للدروس: ملفات PDF، عروض، خرائط، جداول، مبيانات، تمارين، فروض وامتحانات وطنية."
        crumb="الموارد التعليمية"
      />

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-5 md:px-6 space-y-16">

          {/* ===== مكتبة الوثائق (المحتوى الأساسي) ===== */}
          <DocLibrary />

          {/* أداة المؤسسة: التقويم الشخصي */}
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] bg-navy text-white p-8 md:p-10">
              <div className="absolute -top-20 -right-16 w-64 h-64 bg-gold/15 blur-3xl rounded-full" />
              <div className="relative grid md:grid-cols-[1fr_auto] gap-8 items-center">
                <div className="space-y-4">
                  <Chip tone="gold"><Sparkles className="w-3.5 h-3.5" /> أداة المؤسسة</Chip>
                  <h2 className="font-display font-black text-2xl md:text-3xl leading-snug">
                    التقويم الشخصي في التاريخ والجغرافيا
                  </h2>
                  <p className="text-white/70 leading-relaxed max-w-xl">
                    أداة تفاعلية من إعداد الأستاذ عماد طليل: 140 سؤالاً لكل مستويات الثانوي التأهيلي،
                    تصحيح آلي فوري، تشخيص لكل مهارة، وخطة دعم فردية — مجاناً وبدون تسجيل.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['7 مستويات', 'تصحيح فوري', 'تشخيص 30+ مهارة', 'خطة دعم فردية'].map((t) => (
                      <span key={t} className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 border border-white/15">{t}</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('personal')}
                  className="btn-gold px-8 py-4 rounded-2xl font-display font-extrabold text-base inline-flex items-center gap-2.5 justify-center shrink-0"
                >
                  <Compass className="w-5 h-5" />
                  ابدأ التقويم
                </button>
              </div>
            </div>
          </Reveal>

          {/* البحث والفلاتر */}
          <Reveal>
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 t-muted" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث عن مورد: تلميذ تيس، مسار، امتحانات، خرائط…"
                  className="w-full pr-11 pl-4 py-3.5 rounded-2xl border-2 border-[var(--c-border)] bg-transparent focus:border-azure focus:outline-none text-sm"
                />
              </div>
              <div className="inline-flex p-1.5 rounded-2xl surface-tint self-start">
                {(
                  [
                    { k: 'all' as const, label: `الكل (${DIGITAL_RESOURCES.length})` },
                    { k: 'official' as const, label: `رسمية (${officialCount})` },
                    { k: 'social' as const, label: 'للأجتماعيات' },
                  ]
                ).map((f) => (
                  <button
                    key={f.k}
                    onClick={() => setFilter(f.k)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      filter === f.k ? 'bg-azure text-white shadow-lg shadow-azure/25' : 't-muted hover:text-azure'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ===== أدلة المحتوى الكاملة (داخل الموقع) ===== */}
          <div>
            <Reveal className="mb-6">
              <Chip tone="gold"><BookOpen className="w-3.5 h-3.5" /> محتوى كامل داخل الموقع</Chip>
              <h2 className="font-display font-black text-2xl md:text-3xl mt-4">أدلة منهجية — اقرأها هنا مباشرة</h2>
              <p className="t-muted mt-2 max-w-2xl">
                شروحات عملية وجاهزة للمراجعة: كيف تستعمل المنصات الرسمية، كيف تدرس الكتاب المدرسي،
                منهجية الجواب، والمفاهيم الأساسية — بدون مغادرة الموقع.
              </p>
            </Reveal>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {PLATFORM_GUIDES.map((g, i) => (
                <Reveal key={g.id} delay={(i % 3) * 80}>
                  <button
                    onClick={() => setOpenGuide(g)}
                    className="card-surface rounded-3xl p-6 h-full text-right w-full flex flex-col group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-sky-soft text-azure dark:bg-white/10 dark:text-gold flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                      {g.icon}
                    </div>
                    <h3 className="font-display font-extrabold text-lg mb-1.5 leading-snug group-hover:text-azure dark:group-hover:text-gold transition-colors">
                      {g.title}
                    </h3>
                    <p className="text-xs t-muted mb-4 flex-1 leading-relaxed">{g.subtitle}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-[var(--c-border)]">
                      <span className="text-[11px] font-bold t-muted">{g.steps.length} خطوات · {g.services.length} محاور</span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-azure dark:text-gold group-hover:gap-2.5 transition-all">
                        اقرأ الدليل
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                </Reveal>
              ))}
            </div>
          </div>

          {/* ===== منبر الموارد (معلومات مرجعية داخل الموقع) ===== */}
          <div>
            <Reveal className="mb-6">
              <Chip tone="blue"><Library className="w-3.5 h-3.5" /> الخزانة المرجعية</Chip>
              <h2 className="font-display font-black text-2xl md:text-3xl mt-4">ماذا تجد في كل مورد؟</h2>
              <p className="t-muted mt-2 max-w-2xl">
                جدول مرجعي يشرح محتوى كل مورد رسمي أو منصة دعم، ولمن هو مخصص، وكيف تستثمره في مراجعتك.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {shown.map((r, i) => {
                const Icon = TYPE_ICON[r.type] ?? BookOpen;
                return (
                  <Reveal key={r.name} delay={(i % 3) * 70}>
                    <div className="card-surface rounded-3xl p-6 h-full flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                          r.official ? 'bg-leaf-soft text-leaf' : 'bg-sky-soft text-azure dark:bg-white/10 dark:text-gold'
                        }`}>
                          <Icon className="w-5 h-5" strokeWidth={2} />
                        </div>
                        {r.official && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-leaf-soft text-leaf">
                            <ShieldCheck className="w-3 h-3" />
                            رسمي
                          </span>
                        )}
                      </div>

                      <h3 className="font-display font-extrabold text-base mb-2 leading-snug">{r.name}</h3>
                      <p className="text-sm t-muted leading-relaxed mb-4 flex-1">{r.desc}</p>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {r.tags.map((t) => (
                          <span key={t} className="text-[10.5px] font-bold px-2 py-1 rounded-lg surface-tint t-muted">{t}</span>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-[var(--c-border)] flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold t-muted">{r.level}</span>
                        <span className="text-[11px] font-black text-azure dark:text-gold">{r.free}</span>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            {shown.length === 0 && (
              <div className="text-center py-16 t-muted">لا توجد موارد مطابقة لبحثك.</div>
            )}
          </div>

          {/* تنبيه منهجي */}
          <Reveal>
            <div className="flex items-start gap-3 p-5 rounded-2xl bg-gold-soft border border-gold/30">
              <ShieldCheck className="w-5 h-5 text-gold-deep shrink-0 mt-0.5" />
              <div className="text-sm text-gold-deep leading-relaxed">
                <b>تنبيه:</b> المحتوى المعروض في الأدلة أعلاه أُعدّ داخل المؤسسة ليكون مطابقاً للمنهاج المغربي.
                أسماء المنصات الرسمية مذكورة للتعريف بمحتواها فقط — التلميذ لا يحتاج لترك الموقع للاستفادة من الأدلة المنهجية.
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* نافذة الدليل الكامل */}
      {openGuide && (
        <Modal title={openGuide.title} onClose={() => setOpenGuide(null)} wide>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-soft text-azure dark:bg-white/10 dark:text-gold flex items-center justify-center text-2xl shrink-0">
                {openGuide.icon}
              </div>
              <div>
                <p className="t-muted text-sm leading-relaxed">{openGuide.subtitle}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {openGuide.services.map((s) => (
                    <span key={s} className="text-[11px] font-bold px-2.5 py-1 rounded-lg surface-tint t-muted">{s}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {openGuide.steps.map((s, i) => (
                <div key={s.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-azure to-navy text-gold font-display font-black text-sm flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    {i < openGuide.steps.length - 1 && <span className="w-0.5 flex-1 bg-[var(--c-border)] my-1" />}
                  </div>
                  <div className="pb-2">
                    <h4 className="font-display font-extrabold text-base mb-1.5">{s.title}</h4>
                    <p className="text-sm t-muted leading-relaxed">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-leaf-soft border border-leaf/30 text-sm text-leaf leading-relaxed flex items-start gap-3">
              <Lightbulb className="w-5 h-5 shrink-0 mt-0.5" />
              <div><b>نصيحة الأستاذ عماد طليل:</b> {openGuide.tip}</div>
            </div>

            <button
              onClick={() => { setOpenGuide(null); onNavigate('personal'); }}
              className="w-full btn-primary px-5 py-3.5 rounded-2xl font-display font-extrabold inline-flex items-center justify-center gap-2"
            >
              <Compass className="w-4.5 h-4.5 w-5 h-5" />
              اختبر مستواك الآن في التقويم الشخصي
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ==================== فضاء التلاميذ ==================== */
const TIPS = [
  { t: 'كيف تذاكر بذكاء؟', d: 'قسّم المادة إلى وحدات قصيرة، وأشر على المفاهيم الجديدة، وأعد الصياغة بكلماتك الخاصة، ثم اختبر نفسك بعد كل وحدة.' },
  { t: 'كيف تستثمر التقويم التشخيصي؟', d: 'أنجزه بصدق وبدون بحث، ثم اقرأ التشخيص بعناية: ركّز أسبوعك الأول على «مواطن الضعف» فقط، وابدأ «خطة الدعم» من أول نقطة.' },
  { t: 'كيف تقرأ المبيان أو الخريطة؟', d: 'ابدأ بالعنوان والمقياس والمفتاح، ثم اجمع كل المعطيات قبل الاستنتاج، ونهِ الجواب بجملة استنتاجية واضحة.' },
  { t: 'كيف تبني خطاً زمنياً؟', d: 'رتب الأحداث على شريط (قرن، عقد، سنة)، واكتب تحت كل حدث كلمتين للسياق، ثم اختبر الترتيب غداً بدون الرجوع.' },
];

export function StudentsPage({ cfg, onNavigate }: { cfg: any; onNavigate: (p: PageKey) => void }) {
  void cfg;
  const [flow, setFlow] = useState<'intro' | 'select' | 'test' | 'results'>('intro');
  const [levelId, setLevelId] = useState('');
  const [code, setCode] = useState('');
  const [isRetest, setIsRetest] = useState(false);
  const [diag, setDiag] = useState<Diagnosis | null>(null);
  const [prev, setPrev] = useState<{ score: number; percent: number } | null>(null);
  const [showTip, setShowTip] = useState<number | null>(0);

  const startTest = (lv: string, c: string) => {
    setLevelId(lv);
    setCode(c);
    setIsRetest(false);
    setDiag(null);
    setPrev(null);
    setFlow('test');
    window.scrollTo({ top: 0 });
  };

  const level = levels.find((l) => l.id === levelId);

  const handleComplete = (d: Diagnosis) => {
    saveRecord({
      code,
      levelId,
      levelLabel: level ? (isRetest ? `${level.label} (إعادة)` : level.label) : levelId,
      historyScore: d.historyScore,
      geoScore: d.geoScore,
      totalScore: d.totalScore,
      percent: d.percent,
      skills: d.skills,
      support: d.support,
      isRetest: isRetest || undefined,
      previousScore: isRetest && prev ? prev.score : undefined,
    });
    setDiag(d);
    setFlow('results');
    window.scrollTo({ top: 0 });
  };

  if (flow === 'test' && level) {
    return <TestEngine levelId={level.id} code={code} retest={isRetest} onComplete={handleComplete} onExit={() => setFlow('intro')} />;
  }

  if (flow === 'results' && diag && level) {
    return (
      <ResultPage
        code={code}
        levelLabel={level.label}
        date={new Date().toISOString().split('T')[0]}
        isRetest={isRetest}
        previousScore={prev?.score}
        previousPercent={prev?.percent}
        diag={diag}
        onRetest={() => {
          setPrev({ score: diag.totalScore, percent: diag.percent });
          setIsRetest(true);
          setFlow('test');
          window.scrollTo({ top: 0 });
        }}
        onHome={() => {
          setFlow('intro');
          setDiag(null);
          setPrev(null);
          setIsRetest(false);
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="للمتعلمين والمتعلمات"
        title="فضاء التلاميذ"
        subtitle="أدوات التعلم الذاتي، التقويم التشخيصي الرقمي، نصائح المذاكرة، ولوحة الإعلانات — كل ما تحتاجه في مكان واحد"
        crumb="فضاء التلاميذ"
      />

      <section className="py-14">
        <div className="max-w-6xl mx-auto px-5 md:px-6 grid md:grid-cols-3 gap-5">
          <Reveal>
            <button
              onClick={() => setFlow('select')}
              className="relative w-full text-right rounded-3xl overflow-hidden bg-gradient-to-l from-azure to-navy text-white p-7 h-full shadow-2xl shadow-azure/30 group"
            >
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-gold/20 blur-3xl rounded-full" />
              <Compass className="w-9 h-9 text-gold mb-4" strokeWidth={1.8} />
              <h3 className="font-display font-extrabold text-2xl mb-2">التقويم التشخيصي الذاتي</h3>
              <p className="text-white/70 text-sm leading-relaxed mb-5">
                اختبر مكتسباتك في مادة الاجتماعيات، واحصل فوراً على تشخيص لكل مهارة
                وخطة دعم فردية — مجاناً وبدون تسجيل.
              </p>
              <span className="inline-flex items-center gap-2 text-gold font-display font-extrabold group-hover:gap-3.5 transition-all">
                ابدأ الآن <ArrowLeft className="w-4 h-4" />
              </span>
            </button>
          </Reveal>

          <Reveal delay={90}>
            <button onClick={() => onNavigate('resources')} className="card-surface w-full text-right rounded-3xl p-7 h-full">
              <FolderOpen className="w-8 h-8 text-azure dark:text-gold mb-4" strokeWidth={1.8} />
              <h3 className="font-display font-extrabold text-xl mb-2">الموارد التعليمية</h3>
              <p className="text-sm t-muted leading-relaxed">دروس ومذكرات وتمارين موجهة حسب كل مادة ومستوى.</p>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-azure mt-4 group-hover:gap-3 transition-all">استعرض الخزانة <ArrowLeft className="w-4 h-4" /></span>
            </button>
          </Reveal>

          <Reveal delay={180}>
            <button onClick={() => onNavigate('teachers')} className="card-surface w-full text-right rounded-3xl p-7 h-full">
              <LayoutDashboard className="w-8 h-8 text-azure dark:text-gold mb-4" strokeWidth={1.8} />
              <h3 className="font-display font-extrabold text-xl mb-2">متابعة نتائجي</h3>
              <p className="text-sm t-muted leading-relaxed">تتبع نتائج التقويمات السابقة والتطور في «لوحة المتابعة».</p>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-azure mt-4 group-hover:gap-3 transition-all">افتح اللوحة <ArrowLeft className="w-4 h-4" /></span>
            </button>
          </Reveal>
        </div>
      </section>

      {flow === 'select' && (
        <div className="pb-10">
          <div className="max-w-6xl mx-auto px-5 md:px-6 mb-6">
            <button onClick={() => setFlow('intro')} className="flex items-center gap-2 text-sm font-bold text-azure hover:gap-3 transition-all mb-4">
              <ArrowLeft className="w-4 h-4 rotate-180" />
              العودة لفضاء التلاميذ
            </button>
          </div>
          <LevelSelect onConfirm={startTest} />
        </div>
      )}

      {/* study tips */}
      <section className="py-14 bg-[var(--c-tint)] dark:bg-[#0d1830]">
        <div className="max-w-6xl mx-auto px-5 md:px-6">
          <SectionHead eyebrow="دليل المذاكرة" title="نصائح للتعلم بذكاء" />
          <div className="space-y-3 max-w-3xl mx-auto">
            {TIPS.map((tip, i) => (
              <Reveal key={tip.t} delay={i * 60}>
                <div className={`rounded-2xl overflow-hidden transition-all ${showTip === i ? 'surface shadow-lg' : 'surface-tint'}`}>
                  <button onClick={() => setShowTip(showTip === i ? null : i)} className="w-full flex items-center justify-between gap-3 px-6 py-4 text-right">
                    <span className="font-display font-extrabold flex items-center gap-3">
                      <Lightbulb className="w-5 h-5 text-gold-deep" />
                      {tip.t}
                    </span>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${showTip === i ? 'bg-azure text-white rotate-180' : 'surface-tint t-muted'}`}>
                      <ArrowLeft className="w-4 h-4" />
                    </span>
                  </button>
                  {showTip === i && (
                    <div className="px-6 pb-5 anim-pop-in">
                      <p className="t-muted leading-relaxed">{tip.d}</p>
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* quick links */}
      <section className="py-14">
        <div className="max-w-6xl mx-auto px-5 md:px-6 grid md:grid-cols-3 gap-5">
          {[
            { icon: Library, t: 'المكتبة والقراءة', d: 'فضاء القراءة مفتوح يوميًا بعد استشارة الأساتذة' },
            { icon: Megaphone, t: 'لوحة الإعلانات', d: 'تابع التنبيهات والتنظيمات من صفحة الأخبار' },
            { icon: ClipboardCheck, t: 'الواجبات والتقارير', d: 'استشر أستاذ(ة) المادة حول مواعيد الواجبات والتقارير' },
          ].map((c, i) => (
            <Reveal key={c.t} delay={i * 80}>
              <div className="surface-tint rounded-3xl p-6 h-full">
                <c.icon className="w-7 h-7 text-azure dark:text-gold mb-3" strokeWidth={1.8} />
                <h4 className="font-display font-extrabold mb-1.5">{c.t}</h4>
                <p className="text-sm t-muted leading-relaxed">{c.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}

/* ==================== فضاء الأساتذة ==================== */
export function TeachersPage({ cfg, onNavigate }: { cfg: any; onNavigate: (p: PageKey) => void }) {
  void cfg;
  const [tab, setTab] = useState<'services' | 'dashboard'>('services');

  const services = [
    { icon: FileText, t: 'مذكرات تحضير الدروس', d: 'نماذج مذكرات تحضير (هدف، مكتسبات، أنشطة، تقويم) قابلة للتكييف مع كل درس.', chip: 'قيد الإغناء' },
    { icon: Calendar, t: 'نموذج حصص الأسبوع', d: 'جدول تنظيمي أسبوعي نموذجي يراعي توزيع الحصص على اليومين/الأسبوع.', chip: 'نموذج' },
    { icon: ScrollText, t: 'النصوص المنهجية والتنظيمية', d: 'خلاصات من المذكرات التنظيمية: تقييم المتعلمين، الحياة المدرسية، والمواكبة.', chip: 'مرجع' },
    { icon: Compass, t: 'التقويم التشخيصي الرقمي', d: 'أداة جاهزة لمادة الاجتماعيات: 140 سؤالاً + تشخيص آلي + خطة دعم — استعملها في بداية الموسم.', chip: 'متاح الآن' },
    { icon: LayoutDashboard, t: 'لوحة متابعة النتائج', d: 'إحصائيات حية: متوسطات كل مستوى، نسبة التلاميذ الحائزين على الدعم، أكثر نقاط الضعف انتشاراً.', chip: 'متاح الآن' },
    { icon: MessagesSquare, t: 'تواصل مع الإدارة', d: 'مقترحات، طلبات، وتنبيهات — عبر صفحة التواصل أو مباشرة لدى الإدارة.', chip: 'خدمة' },
  ];

  return (
    <>
      <PageHeader
        eyebrow="للكادر التربوي"
        title="فضاء الأساتذة"
        subtitle="خدمات رقمية في خدمة الممارسة التربوية: مذكرات، تنظيم، وتقويم ذكي"
        crumb="فضاء الأساتذة"
      />

      <section className="py-14">
        <div className="max-w-6xl mx-auto px-5 md:px-6">
          <div className="flex gap-2 mb-8">
            <button onClick={() => setTab('services')} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === 'services' ? 'bg-azure text-white shadow-lg shadow-azure/25' : 'surface-tint t-muted'}`}>
              الخدمات
            </button>
            <button onClick={() => setTab('dashboard')} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === 'dashboard' ? 'bg-azure text-white shadow-lg shadow-azure/25' : 'surface-tint t-muted'}`}>
              لوحة متابعة التقويم
            </button>
          </div>

          {tab === 'services' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((s, i) => (
                <Reveal key={s.t} delay={(i % 3) * 80}>
                  <div className="card-surface rounded-3xl p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 rounded-2xl bg-sky-soft text-azure dark:bg-white/10 dark:text-gold flex items-center justify-center">
                        <s.icon className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <Chip tone={s.chip === 'متاح الآن' ? 'green' : s.chip === 'نموذج' || s.chip === 'مرجع' ? 'gold' : 'muted'}>{s.chip}</Chip>
                    </div>
                    <h3 className="font-display font-extrabold text-lg mb-2">{s.t}</h3>
                    <p className="text-sm t-muted leading-relaxed flex-1">{s.d}</p>
                    {(s.t.includes('التقويم') || s.t.includes('لوحة')) && (
                      <button
                        onClick={() => (s.t.includes('لوحة') ? setTab('dashboard') : onNavigate('students'))}
                        className="mt-4 btn-primary px-4 py-2.5 rounded-xl font-display font-extrabold text-sm inline-flex items-center gap-2 justify-center"
                      >
                        افتح الأداة
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal>
              <div>
                <p className="text-sm t-muted mb-6">
                  بيانات تجريبية + نتائج اختبارات المنصة المحفوظة محلياً على هذا الجهاز.
                  اللوحة تُحدَّث تلقائياً بعد كل تقويم يُنجز من فضاء التلاميذ.
                </p>
                <Dashboard />
              </div>
            </Reveal>
          )}
        </div>
      </section>
    </>
  );
}
