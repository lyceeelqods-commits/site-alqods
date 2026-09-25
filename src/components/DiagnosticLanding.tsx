import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Clock, BookOpen, ClipboardList, Users, RefreshCw,
  Play, ChevronLeft, GraduationCap, UserCheck, Sparkles,
} from 'lucide-react';
import { LANDING_LEVELS, LANDING_TRACKS, QUESTION_TYPES, type LandingLevel, type LandingTrack } from '../data/landingTracks';

/* خلفية بنقوش هندسية عربية */
function PatternBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="islamic" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M40 0 L80 40 L40 80 L0 40 Z M40 20 L60 40 L40 60 L20 40 Z" fill="none" stroke="#0f5132" strokeWidth="1" />
            <circle cx="40" cy="40" r="6" fill="none" stroke="#0f5132" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#islamic)" />
      </svg>
    </div>
  );
}

function StatCard({ icon: Icon, value, sub, delay }: { icon: any; value: string; sub: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 22 }}
      className="bg-white rounded-3xl border border-emerald-100 shadow-sm px-6 py-6 text-center"
    >
      <Icon className="w-6 h-6 text-emerald-800/70 mx-auto mb-3" />
      <div className="font-display text-3xl font-black text-emerald-950">{value}</div>
      <div className="text-xs font-bold text-emerald-800/70 mt-1">{sub}</div>
    </motion.div>
  );
}

function TypePill({ label, delay }: { label: string; delay: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 + delay * 0.05 }}
      className="px-3.5 py-1.5 rounded-full bg-white border border-emerald-200/70 text-[12px] font-black text-emerald-900 shadow-sm"
    >
      {label}
    </motion.span>
  );
}

/* بطاقة المسلك */
function TrackCard({ t, index, onStart }: { t: LandingTrack; index: number; onStart: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: (index % 3) * 0.08, type: 'spring', stiffness: 180, damping: 22 }}
      whileHover={{ y: -6 }}
      className={`relative bg-white rounded-[1.75rem] border-2 p-6 flex flex-col h-full transition-shadow duration-300 ${
        t.featured
          ? 'border-[#c9a24b] shadow-[0_20px_50px_-24px_rgba(201,162,75,0.55)] ring-2 ring-[#c9a24b]/25'
          : 'border-emerald-100 shadow-sm hover:shadow-xl'
      }`}
    >
      {/* شارة أعلى يمين */}
      {t.featured ? (
        <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-l from-[#c9a24b] to-[#a8822f] text-white text-[10.5px] font-black shadow">
          الأكثر إجراءً
        </span>
      ) : (
        <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10.5px] font-black">
          تقويم متاح
        </span>
      )}

      {/* أيقونة التخرج */}
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-10 ${
        t.featured ? 'bg-[#f6efdc] text-[#8c6d20]' : 'bg-emerald-50 text-emerald-800'
      }`}>
        <GraduationCap className="w-6 h-6" />
      </div>

      <h3 className="font-display font-black text-[17px] text-emerald-950 leading-snug mb-2">{t.title}</h3>
      <p className="text-[12.5px] text-emerald-900/55 leading-relaxed flex-1">{t.desc}</p>

      <div className="flex flex-wrap gap-1.5 my-4">
        {t.tags.map((tag) => (
          <span key={tag} className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-[10.5px] font-bold">{tag}</span>
        ))}
      </div>

      <button
        onClick={() => onStart(t.levelId)}
        className={`mt-auto inline-flex items-center gap-1.5 text-[13px] font-black self-start ${
          t.featured ? 'text-[#8c6d20]' : 'text-emerald-800'
        } hover:gap-2.5 transition-all`}
      >
        ابدأ التقويم
        <ChevronLeft className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export default function DiagnosticLanding({ onStart, initialName = '', initialClass = '', onProfile }: {
  onStart: (levelId: string) => void;
  initialName?: string;
  initialClass?: string;
  onProfile?: (p: { name: string; clazz: string }) => void;
}) {
  const [activeLevel, setActiveLevel] = useState<LandingLevel>('jc');
  const grouped = useMemo(
    () => LANDING_LEVELS.map((lv) => ({ ...lv, tracks: LANDING_TRACKS.filter((t) => t.level === lv.id) })),
    []
  );

  return (
    <div className="relative min-h-screen bg-[#f7f6f0] dark:bg-[#0b1410] text-emerald-950 dark:text-emerald-50 pt-24 pb-20 overflow-hidden">
      <PatternBg />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* رابط تغيير المستوى */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => {
            const el = document.getElementById('levels-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="mx-auto flex items-center gap-1.5 text-[13px] font-black text-emerald-800 dark:text-emerald-300 mb-6 hover:gap-2.5 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          تغيير المستوى / المسلك
        </motion.button>

        {/* العنوان الرئيسي */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-300/60 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[12px] font-black mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            التقويم التشخيصي في الاجتماعيات
          </div>
          <h1 className="font-display font-black text-3xl md:text-5xl leading-tight text-emerald-950 dark:text-white">
            التقويم التشخيصي في الاجتماعيات
          </h1>

          {/* شارات المستوى */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
            <span className="px-4 py-2 rounded-full bg-white border border-stone-200 text-[12.5px] font-black text-stone-700 shadow-sm">
              {LANDING_TRACKS.find((t) => t.level === activeLevel) ? LANDING_LEVELS.find((l) => l.id === activeLevel)?.title : ''}
            </span>
            <span className="px-4 py-2 rounded-full bg-emerald-800 text-white text-[12.5px] font-black shadow">
              المدة: 60 دقيقة
            </span>
            <span className="px-4 py-2 rounded-full bg-white border border-[#c9a24b]/50 text-[#8c6d20] text-[12.5px] font-black shadow-sm">
              النقطة: /20
            </span>
          </div>
        </motion.div>

        {/* الإحصائيات الأربع */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-10">
          <StatCard icon={ClipboardList} value="20" sub="سؤالاً متنوعًا" delay={0.1} />
          <StatCard icon={Clock} value="60" sub="دقيقة" delay={0.18} />
          <StatCard icon={BookOpen} value="10 + 10" sub="تاريخ + جغرافيا" delay={0.26} />
          <StatCard icon={BarChart3} value="20" sub="النقطة العامة /20" delay={0.34} />
        </div>

        {/* أنواع الأسئلة */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="text-center mt-8"
        >
          <div className="text-[12.5px] font-black text-emerald-900/60 mb-3">أنواع الأسئلة:</div>
          <div className="flex flex-wrap justify-center gap-2">
            {QUESTION_TYPES.map((t, i) => <TypePill key={t} label={t} delay={i} />)}
          </div>
          <div className="mt-4 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-[12.5px] font-bold text-emerald-800 dark:text-emerald-200">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            محاور هذا التقويم: وثائق وزمنيات · تطور العالم 15–18م · طبوغرافية وسكان · كتابة فقرة بشبكة تنقيط
          </div>
        </motion.div>

        {/* بطاقة التلميذ العائمة */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 160, damping: 22 }}
          className="max-w-md mx-auto mt-12"
        >
          <StudentForm
            initialName={initialName}
            initialClass={initialClass}
            onProfile={onProfile}
            onStart={(id) => { setActiveLevel(LANDING_TRACKS.find((t) => t.levelId === id)?.level || 'jc'); onStart(id); }}
          />
        </motion.div>

        <p className="text-center text-[11.5px] text-emerald-900/50 mt-4 flex items-center justify-center gap-1.5">
          <ClipboardList className="w-3.5 h-3.5" />
          20 سؤالًا · 10 تاريخ + 10 جغرافيا · مدة 60 دقيقة
        </p>

        <button
          onClick={() => document.getElementById('levels-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="mx-auto mt-3 flex items-center gap-1.5 text-[13px] font-black text-emerald-800 dark:text-emerald-300 hover:gap-2.5 transition-all"
        >
          <Users className="w-4 h-4" />
          تتوفر أيضًا تقويمات لسبع مستويات ومسالك أخرى — اختر مستوى آخر
        </button>

        {/* أقسام المستويات والبطاقات */}
        <div id="levels-section" className="mt-16 space-y-14">
          {grouped.map((lv) => (
            <section key={lv.id}>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-display font-black text-base shadow">
                  {lv.num}
                </span>
                <h2 className="font-display font-black text-2xl md:text-3xl text-emerald-950 dark:text-white">{lv.title}</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {lv.tracks.map((t, i) => (
                  <TrackCard key={t.levelId} t={t} index={i} onStart={onStart} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

/* بطاقة التلميذ العائمة (نموذج مطابق للصور) */
function StudentForm({ onStart, initialName = '', initialClass = '', onProfile }: {
  onStart: (levelId: string) => void;
  initialName?: string;
  initialClass?: string;
  onProfile?: (p: { name: string; clazz: string }) => void;
}) {
  const [name, setName] = useState(initialName);
  const [section, setSection] = useState(initialClass);
  const [levelId] = useState('jc_adab');

  const begin = () => {
    if (!name.trim()) return;
    onProfile?.({ name: name.trim(), clazz: section });
    onStart(levelId);
  };

  const sections = [
    'الجذع المشترك آداب وعلوم إنسانية',
    'الجذع المشترك العلمي',
    'الجذع المشترك التعليم الأصيل',
    'الأولى باكالوريا آداب وعلوم إنسانية',
    'الأولى باكالوريا علوم',
    'الأولى باكالوريا علوم تجريبية',
    'الثانية باكالوريا آداب',
    'الثانية باكالوريا علوم',
    'قسم آخر',
  ];

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="bg-white dark:bg-[#0f1d16] rounded-[1.75rem] shadow-[0_30px_70px_-30px_rgba(15,81,50,0.4)] overflow-hidden border border-emerald-100 dark:border-emerald-900/40"
    >
      {/* رأس البطاقة */}
      <div className="bg-gradient-to-l from-[#14532d] to-[#0f5132] px-7 py-5 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full"><defs><pattern id="headpat" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="white" strokeWidth="0.6" /></pattern></defs><rect width="100%" height="100%" fill="url(#headpat)" /></svg>
        </div>
        <div className="relative flex items-center justify-center gap-2.5">
          <UserCheck className="w-5 h-5 text-[#e6c878]" />
          <div className="text-center">
            <div className="font-display font-black text-base">بطاقة التلميذ(ة)</div>
            <div className="text-[11px] text-emerald-100/80">املأ المعطيات التالية قبل بداية الاختبار</div>
          </div>
        </div>
      </div>

      <div className="p-7 space-y-5">
        {/* الاسم */}
        <div>
          <label className="block text-[12px] font-black text-emerald-950 dark:text-emerald-100 mb-1.5">
            الاسم الكامل <span className="text-rose-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: أمين العلوى"
            className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-emerald-900/50 bg-indigo-50/40 dark:bg-white/5 text-sm font-bold text-center placeholder:text-stone-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 transition-all"
          />
        </div>

        {/* رقم التلميذ + القسم */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-black text-emerald-950 dark:text-emerald-100 mb-1.5">
              رقم التلميذ <span className="font-normal text-stone-400">(اختياري)</span>
            </label>
            <input
              placeholder="مثال: 12"
              className="w-full px-3 py-3 rounded-xl border border-stone-200 dark:border-emerald-900/50 bg-indigo-50/40 dark:bg-white/5 text-sm font-bold text-center placeholder:text-stone-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[12px] font-black text-emerald-950 dark:text-emerald-100 mb-1.5">
              القسم <span className="text-rose-500">*</span>
            </label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border border-stone-200 dark:border-emerald-900/50 bg-white dark:bg-white/5 text-sm font-bold focus:outline-none focus:border-emerald-500"
            >
              <option value="" disabled>اختر القسم</option>
              {sections.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* تعليمات مهمة */}
        <div className="bg-stone-50 dark:bg-white/5 rounded-2xl p-4 text-[12px] text-stone-600 dark:text-stone-300 leading-relaxed text-right">
          <div className="font-black text-stone-800 dark:text-stone-100 mb-1.5">تعليمات مهمة:</div>
          <ul className="space-y-1">
            <li>• سيتوفر لديك <b>60 دقيقة</b> وتُرسل الورقة آليًا عند انتهاء الوقت.</li>
            <li>• يمكنك التنقل بين الأسئلة بحرية ومراجعة إجاباتك قبل الإرسال.</li>
            <li>• السؤال الأخير كتابة فقرة، ويُقيَّم وفق شبكة تنقيط خاصة تظهر في النتائج.</li>
          </ul>
        </div>

        {/* زر البداية الذهبي */}
        <button
          onClick={begin}
          disabled={!name.trim()}
          className="w-full py-4 rounded-2xl bg-gradient-to-l from-[#d4a84a] to-[#b8902f] text-emerald-950 font-display font-black text-[15px] inline-flex items-center justify-center gap-2 shadow-[0_14px_30px_-10px_rgba(184,144,47,0.6)] hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4" />
          ابدأ التقويم التشخيصي
        </button>
      </div>
    </motion.div>
  );
}
