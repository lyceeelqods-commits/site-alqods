import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Clock, CheckCircle2, Loader2,
  Shuffle, X, ListChecks, PenLine, Flag, Send,
} from 'lucide-react';
import { levels } from '../data/levels';
import type { Question } from '../types';
import { diagnose, type AnswerValue, type Diagnosis } from '../lib/diagnosis';
import type { AssessmentKind } from '../lib/store';

const SESSION_KEY = 'quds_test_session_v1';
const TOTAL_SECONDS = 60 * 60;
const AR_LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح'];

function sampleOnePerSkill(pool: Question[]): Question[] {
  const bySkill = new Map<string, Question>();
  pool.forEach((q) => {
    const k = `${q.sujet}|${q.competence}`;
    if (!bySkill.has(k)) bySkill.set(k, q);
  });
  return shuffle(Array.from(bySkill.values())).slice(0, 10);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeRetestSet(questions: Question[]): Question[] {
  const hist = questions.filter((q) => q.sujet === 'histoire');
  const geo = questions.filter((q) => q.sujet === 'geographie');
  const mixed = [...shuffle(hist), ...shuffle(geo)];
  return mixed.map((q, idx) => {
    const base: Question = { ...q, id: 1000 + idx };
    if (q.type === 'lien') {
      const opts = q.options || [];
      const left = opts.slice(0, 4);
      const right = opts.slice(4);
      base.options = [...shuffle(left), ...shuffle(right)];
      return base;
    }
    if (q.options && q.type !== 'correct') {
      base.options = shuffle(q.options);
    }
    if (q.type === 'correct') {
      const items = q.options || [];
      const newItems = shuffle(items);
      base.options = newItems;
      const oldOrder = q.reponse as number[];
      const oldToNew = new Map<string, number>();
      newItems.forEach((it, i) => oldToNew.set(it, i));
      base.reponse = oldOrder.map((oldIdx) => oldToNew.get(items[oldIdx]) as number);
    }
    return base;
  });
}

const TYPE_LABELS: Record<string, string> = {
  qcm: 'اختيار من متعدد',
  vrai_faux: 'صح / خطأ',
  correct: 'ترتيب أحداث',
  lien: 'ربط مفاهيم',
  tableau: 'قراءة جدول ومبيان',
  document: 'تحليل وثيقة',
  short_answer: 'إجابة قصيرة',
  essay: 'كتابة فقرة',
};

export default function TestEngine({
  levelId,
  code,
  retest,
  domain = 'both',
  variant = 'diagnostic',
  onComplete,
  onExit,
}: {
  levelId: string;
  code: string;
  retest?: boolean;
  domain?: 'histoire' | 'geographie' | 'both';
  variant?: AssessmentKind;
  onComplete: (d: Diagnosis, ctx: { questions: Question[]; answers: Record<number, AnswerValue> }) => void;
  onExit: () => void;
}) {
  const base = levels.find((l) => l.id === levelId);
  const questions = useMemo(() => {
    if (!base) return [];
    let pool = domain === 'both' ? base.questions : base.questions.filter((q) => q.sujet === domain);
    if (variant === 'skills') pool = sampleOnePerSkill(pool);
    else if (variant === 'review') pool = shuffle(pool).slice(0, 10);
    return retest ? makeRetestSet(pool) : pool;
  }, [base, retest, domain, variant]);

  const restored = useMemo(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.levelId === levelId && s.domain === domain && s.variant === variant && !s.retest) return s;
      }
    } catch { /* ignore */ }
    return null;
  }, [levelId, domain, variant, questions]);

  const [current, setCurrent] = useState<number>(() => (restored && typeof restored.current === 'number' ? Math.min(restored.current, Math.max(questions.length - 1, 0)) : 0));
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>(() => (restored?.answers ? restored.answers : {}));
  const [restoredFlash, setRestoredFlash] = useState(() => !!(restored && Object.keys(restored.answers || {}).length > 0));
  const [elapsed, setElapsed] = useState<number>(() => (restored && typeof restored.elapsed === 'number' ? restored.elapsed : 0));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  const remaining = Math.max(TOTAL_SECONDS - elapsed, 0);

  const goTo = (n: number) => {
    setDirection(n > current ? 1 : -1);
    setCurrent(Math.max(0, Math.min(questions.length - 1, n)));
  };
  const next = () => {
    if (current < questions.length - 1) goTo(current + 1);
    else setConfirmOpen(true);
  };
  const prev = () => {
    if (current > 0) goTo(current - 1);
  };

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (retest || finishing) return;
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ levelId, domain, variant, retest, current, answers, elapsed }));
    } catch { /* ignore */ }
  }, [levelId, domain, variant, retest, current, answers, finishing, elapsed]);

  useEffect(() => {
    if (!restoredFlash) return;
    const t = setTimeout(() => setRestoredFlash(false), 3500);
    return () => clearTimeout(t);
  }, [restoredFlash]);

  const clearSession = () => {
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  };

  const submit = () => {
    clearSession();
    setConfirmOpen(false);
    setFinishing(true);
    setTimeout(() => {
      onComplete(diagnose(questions, answers), { questions, answers });
    }, 1400);
  };

  // auto submit on timeout
  useEffect(() => {
    if (remaining <= 0 && !finishing) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (confirmOpen || exitOpen || finishing) return;
      if (e.key === 'ArrowLeft') goTo(Math.min(questions.length - 1, current + 1));
      if (e.key === 'ArrowRight') goTo(Math.max(0, current - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmOpen, exitOpen, finishing, questions.length, current]);

  if (!base) return null;

  const q = questions[current];
  const isAnswered = (x: Question) => {
    const v = answers[x.id];
    if (v === undefined) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    if (v && typeof v === 'object') return Object.values(v).some((val) => val !== '' && val !== undefined);
    return true;
  };
  const answeredCount = questions.filter(isAnswered).length;

  const setAns = (val: AnswerValue) => setAnswers((a) => ({ ...a, [q.id]: val }));

  const fmtClock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const urgent = remaining < 5 * 60;

  const renderBody = () => {
    switch (q.type) {
      case 'qcm':
      case 'vrai_faux':
      case 'tableau':
      case 'document': {
        return (
          <div className={q.type === 'vrai_faux' ? 'grid sm:grid-cols-2 gap-3' : 'grid gap-3'}>
            {(q.options || []).map((opt, i) => {
              const sel = answers[q.id] === opt;
              return (
                <motion.button
                  key={opt}
                  onClick={() => setAns(opt)}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.06, type: 'spring', stiffness: 300, damping: 24 }}
                  whileTap={{ scale: 0.99 }}
                  className={`group flex items-center gap-3 text-right px-4 py-4 rounded-2xl border-2 transition-all duration-200 ${
                    sel
                      ? 'border-[#14532d] bg-[#eef7f0] shadow-[0_8px_24px_-12px_rgba(20,83,45,0.4)]'
                      : 'border-stone-200 bg-white hover:border-[#14532d]/40 hover:bg-stone-50/60'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[13px] font-black shrink-0 transition-colors ${
                    sel ? 'bg-[#14532d] text-white' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {AR_LETTERS[i] || String.fromCharCode(65 + i)}
                  </span>
                  <span className={`flex-1 text-[15px] font-bold leading-relaxed ${sel ? 'text-[#0f5132]' : 'text-stone-700'}`}>{opt}</span>
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    sel ? 'border-[#14532d] bg-[#14532d]' : 'border-stone-300'
                  }`}>
                    {sel && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                </motion.button>
              );
            })}
          </div>
        );
      }
      case 'correct': {
        const order = (answers[q.id] as number[] | undefined) || [];
        return (
          <div>
            <p className="text-[13px] text-stone-500 mb-4 flex items-center gap-2">
              <ListChecks className="w-4 h-4" />
              انقر على العناصر بالترتيب الزمني الصحيح (انقر العنصر مجدداً لإلغائه)
            </p>
            <div className="grid gap-2.5">
              {(q.options || []).map((opt, idx) => {
                const pos = order.indexOf(idx);
                return (
                  <motion.button
                    key={opt}
                    onClick={() => setAns(pos >= 0 ? order.filter((p) => p !== idx) : [...order, idx])}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + idx * 0.06 }}
                    whileTap={{ scale: 0.99 }}
                    layout
                    className={`flex items-center gap-3 text-right px-4 py-3.5 rounded-2xl border-2 font-bold text-[14px] transition-colors ${
                      pos >= 0 ? 'border-[#14532d] bg-[#eef7f0] text-[#0f5132]' : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                      pos >= 0 ? 'bg-[#14532d] text-white' : 'bg-stone-100 text-stone-400'
                    }`}>
                      {pos >= 0 ? pos + 1 : ''}
                    </span>
                    {opt}
                  </motion.button>
                );
              })}
            </div>
            {order.length > 0 && (
              <button onClick={() => setAns([])} className="mt-3 text-xs font-bold text-stone-500 hover:text-rose-600 transition-colors flex items-center gap-1">
                <Shuffle className="w-3.5 h-3.5" /> إعادة ضبط الترتيب
              </button>
            )}
          </div>
        );
      }
      case 'lien': {
        const opts = q.options || [];
        const left = opts.slice(0, 4);
        const right = opts.slice(4);
        const rightDisplay = [...right.slice(1), right[0]];
        const pairs = (answers[q.id] as Record<string, string> | undefined) || {};
        return (
          <div className="grid gap-2.5">
            {left.map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
                className="flex items-center gap-3 p-3 rounded-2xl border-2 border-stone-200 bg-white"
              >
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 font-black flex items-center justify-center shrink-0">
                  {AR_LETTERS[i] || String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm font-bold text-stone-800 flex-1">{item}</span>
                <select
                  value={pairs[item] ?? ''}
                  onChange={(e) => setAns({ ...pairs, [item]: e.target.value })}
                  className="text-sm bg-stone-50 border-2 border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-600 font-bold max-w-[48%]"
                >
                  <option value="">اختر…</option>
                  {rightDisplay.map((o2) => (
                    <option key={o2} value={o2}>{o2}</option>
                  ))}
                </select>
              </motion.div>
            ))}
          </div>
        );
      }
      case 'short_answer': {
        const val = (answers[q.id] as string | undefined) || '';
        return (
          <div className="grid gap-3">
            <textarea
              value={val}
              onChange={(e) => setAns(e.target.value)}
              rows={2}
              placeholder="اكتب إجابتك القصيرة هنا (مصطلح، تاريخ، اسم…)…"
              className="w-full rounded-2xl border-2 border-stone-200 bg-white px-5 py-4 font-bold text-stone-800 placeholder:font-normal placeholder:text-stone-400 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 transition-all resize-none"
            />
            <p className="text-[11.5px] text-stone-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              سيُعتمد التقويم الذاتي على الكلمات المفتاحية بعد الإنهاء.
            </p>
          </div>
        );
      }
      case 'essay': {
        const val = (answers[q.id] as string | undefined) || '';
        const lines = q.expectedLines || 6;
        return (
          <div className="grid gap-3">
            <div className="flex items-center gap-2 text-sm font-black text-stone-600">
              <PenLine className="w-4 h-4" />
              سؤال التعبير الكتابي — اكتب فقرة منظمة
            </div>
            <textarea
              value={val}
              onChange={(e) => setAns(e.target.value)}
              rows={lines}
              placeholder="اكتب فقرة متكاملة تتضمن مقدمة وعرضاً وخاتمة…"
              className="w-full rounded-2xl border-2 border-stone-200 bg-white px-5 py-4 font-bold text-stone-800 placeholder:font-normal placeholder:text-stone-400 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 transition-all resize-y leading-loose"
            />
            <div className="flex items-center justify-between text-[11.5px] text-stone-500">
              <span className="flex items-center gap-1.5">
                <ListChecks className="w-3.5 h-3.5 text-emerald-700" />
                تُقيَّم على التنظيم والمفاهيم والربط المنطقي.
              </span>
              <span className={`font-black ${val.trim().split(/\s+/).filter(Boolean).length >= 30 ? 'text-emerald-700' : ''}`}>
                {val.trim() ? val.trim().split(/\s+/).filter(Boolean).length : 0} كلمة
              </span>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#f7f6f0] dark:bg-[#0b1410] pt-24 pb-16 relative overflow-hidden"
    >
      {/* نقش هندسي خفيف */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="diagpat" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M40 0 L80 40 L40 80 L0 40 Z" fill="none" stroke="#0f5132" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagpat)" />
        </svg>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-5">
        {/* ===== الشريط العلوي ===== */}
        <motion.div
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white dark:bg-[#101d16] rounded-[1.75rem] border border-stone-200/80 dark:border-emerald-900/40 shadow-sm p-4 sm:p-5 mb-5"
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* يمين: معلومات السؤال */}
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Flag className="w-5 h-5" />
              </span>
              <div>
                <div className="font-display font-black text-[15px] sm:text-base text-stone-900 dark:text-white">
                  السؤال <span className="text-emerald-700 dark:text-emerald-300">{current + 1}</span> من {questions.length}
                </div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 font-bold">
                  {base.label} · {answeredCount} مجاب عنها · {code}
                </div>
              </div>
            </div>

            {/* وسط: المؤقت */}
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-display font-black tabular-nums text-base ${
              urgent ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
            }`}>
              <Clock className="w-4 h-4" />
              {fmtClock(remaining)}
            </div>

            {/* يسار: إرسال + خروج */}
            <div className="flex items-center gap-2">
              <button onClick={() => setExitOpen(true)} className="p-2.5 rounded-xl border border-stone-200 dark:border-white/10 text-stone-400 hover:text-rose-600 hover:border-rose-300 transition-colors" aria-label="خروج">
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={() => setConfirmOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#14532d] hover:bg-[#0f5132] text-white text-[13px] font-black shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.97]"
              >
                <Send className="w-4 h-4" />
                إرسال الاختبار
              </button>
            </div>
          </div>

          {/* شريط التقدم */}
          <div className="mt-4 h-2 bg-stone-100 dark:bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-l from-emerald-700 to-emerald-500 rounded-full"
              initial={false}
              animate={{ width: `${(answeredCount / questions.length) * 100}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
        </motion.div>

        {restoredFlash && (
          <div className="anim-pop mb-4 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            تم استرجاع إجاباتك المحفوظة تلقائياً — واصل من حيث توقفت.
          </div>
        )}

        {/* ===== السؤال + قائمة الأسئلة ===== */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* بطاقة السؤال (يمين في RTL) */}
          <div className="flex-1 w-full min-w-0 order-1">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={q.id}
                custom={direction}
                initial={{ opacity: 0, x: direction * 60, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: direction * -60, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30, duration: 0.35 }}
                className="bg-white dark:bg-[#101d16] rounded-[1.75rem] border border-stone-200/80 dark:border-emerald-900/40 shadow-sm overflow-hidden"
              >
                <div className="p-6 md:p-8">
                  <div className="flex flex-wrap items-center gap-2 mb-5">
                    <span className="text-[11.5px] font-black px-3 py-1.5 rounded-full border border-emerald-600/40 text-emerald-800 dark:text-emerald-300">
                      {TYPE_LABELS[q.type]}
                    </span>
                    <span className="text-[11.5px] font-bold px-3 py-1.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-300">
                      المهارة: {q.competence}
                    </span>
                    <span className="mr-auto text-[11.5px] font-black text-[#8c6d20] bg-[#faf3df] dark:bg-amber-950/40 dark:text-amber-300 px-3 py-1.5 rounded-full">
                      {q.points} {q.points > 1 ? 'نقطتين' : 'نقطة واحدة'}
                    </span>
                  </div>

                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="font-display font-extrabold text-lg md:text-[22px] text-stone-900 dark:text-white leading-relaxed mb-6 text-center"
                  >
                    {q.texte}
                  </motion.h2>

                  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
                    {renderBody()}
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* أزرار التنقل */}
            <div className="flex items-center justify-between gap-3 mt-4">
              <button
                onClick={next}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#14532d] hover:bg-[#0f5132] text-white text-sm font-black shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.97]"
              >
                <ChevronLeft className="w-4 h-4" />
                {current === questions.length - 1 ? 'مراجعة وإرسال' : 'السؤال التالي'}
              </button>
              <button
                onClick={prev}
                disabled={current === 0}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 text-sm font-black text-stone-600 dark:text-stone-300 hover:border-stone-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                السؤال السابق
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* قائمة الأسئلة (يسار في RTL) */}
          <aside className="w-full lg:w-[270px] shrink-0 order-2 bg-white dark:bg-[#101d16] rounded-[1.75rem] border border-stone-200/80 dark:border-emerald-900/40 shadow-sm p-5 lg:sticky lg:top-24">
            <h3 className="font-display font-black text-[15px] text-stone-900 dark:text-white mb-1">قائمة الأسئلة</h3>
            <p className="text-[11.5px] text-stone-500 dark:text-stone-400 leading-relaxed mb-4">
              انتقل بين الأسئلة بحرية لمراجعة إجاباتك قبل الإرسال.
            </p>
            <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
              {questions.map((qq, i) => {
                const done = isAnswered(qq);
                const isCur = i === current;
                return (
                  <button
                    key={qq.id}
                    onClick={() => goTo(i)}
                    aria-label={`سؤال ${i + 1}`}
                    className={`aspect-square rounded-xl text-[13px] font-black flex items-center justify-center transition-all ${
                      isCur
                        ? 'border-2 border-[#c9a24b] bg-[#fdf8e8] dark:bg-amber-950/40 text-[#8c6d20] dark:text-amber-300 shadow-md scale-105'
                        : done
                        ? 'bg-[#14532d] text-white shadow'
                        : 'bg-stone-100 dark:bg-white/5 text-stone-500 hover:bg-stone-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-stone-100 dark:border-white/10 space-y-2 text-[11px] font-bold text-stone-500 dark:text-stone-400">
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#14532d]" /> مجاب عنه</div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full border-2 border-[#c9a24b]" /> السؤال الحالي</div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-stone-200 dark:bg-white/10" /> غير مجاب عنه</div>
            </div>
          </aside>
        </div>

        <p className="text-center text-[11px] text-stone-400 mt-5">
          تلميح: استخدم أسهم لوحة المفاتيح للتنقل — تُحفظ إجاباتك تلقائياً
        </p>
      </div>

      {/* نافذة تأكيد الإرسال */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-5 bg-[#0b1f16]/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#101d16] rounded-[2rem] shadow-2xl max-w-md w-full p-8 anim-pop max-h-[88vh] overflow-y-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="font-display font-black text-2xl text-center mb-2">راجع إجاباتك قبل الإرسال</h3>
            <p className="text-sm text-stone-500 text-center leading-relaxed mb-4">
              أجبت على <b className="text-stone-900">{answeredCount}</b> من {questions.length} أسئلة.
              {answeredCount < questions.length && <span className="block mt-1 text-rose-600 font-bold">الأسئلة غير المجابة تُحتسب صفرًا.</span>}
            </p>
            <div className="grid grid-cols-10 gap-1.5 mb-3">
              {questions.map((qq, i) => {
                const done = isAnswered(qq);
                return (
                  <button
                    key={qq.id}
                    onClick={() => { goTo(i); setConfirmOpen(false); }}
                    className={`h-8 rounded-lg text-[11px] font-black flex items-center justify-center transition-colors ${
                      done ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-700 hover:text-white' : 'bg-stone-100 text-stone-400 hover:bg-rose-50 hover:text-rose-600'
                    } ${i === current ? 'ring-2 ring-emerald-700 ring-offset-1' : ''}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-4 text-[11px] font-bold text-stone-500 mb-6">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-100" /> مُجاب</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-stone-100" /> بدون إجابة</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmOpen(false)} className="flex-1 px-4 py-3.5 rounded-2xl border-2 border-stone-200 font-bold hover:bg-stone-50 transition-colors">
                متابعة المراجعة
              </button>
              <button onClick={submit} className="flex-1 px-4 py-3.5 rounded-2xl bg-[#14532d] hover:bg-[#0f5132] text-white font-display font-black transition-all">
                إرسال والحصول على التشخيص
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة الخروج */}
      {exitOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-5 bg-[#0b1f16]/70 backdrop-blur-sm" onClick={() => setExitOpen(false)}>
          <div className="bg-white dark:bg-[#101d16] rounded-[2rem] shadow-2xl max-w-sm w-full p-7 anim-pop" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-black text-xl mb-2">الخروج من الاختبار؟</h3>
            <p className="text-sm text-stone-500 leading-relaxed mb-6">سيتم إلغاء إجاباتك الحالية. هل أنت متأكد؟</p>
            <div className="flex gap-3">
              <button onClick={() => setExitOpen(false)} className="flex-1 px-4 py-3 rounded-2xl border-2 border-stone-200 font-bold hover:bg-stone-50 transition-colors">
                البقاء في الاختبار
              </button>
              <button onClick={() => { clearSession(); onExit(); }} className="flex-1 px-4 py-3 rounded-2xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors">
                خروج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* شاشة الإنهاء */}
      <AnimatePresence>
        {finishing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-[#0b1f16]/92 backdrop-blur-md flex flex-col items-center justify-center gap-6 text-white"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}>
              <Loader2 className="w-14 h-14 text-[#c9a24b]" />
            </motion.div>
            <div className="text-center space-y-2">
              <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="font-display font-black text-2xl">
                جارٍ تحليل إجاباتك…
              </motion.div>
              <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }} className="text-white/60 text-sm">
                تشخيص المهارات وبناء خطة الدعم الفردية
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
