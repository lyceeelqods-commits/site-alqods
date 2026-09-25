import { useMemo, useState } from 'react';
import {
  MapPin, Download, FileText, CheckCircle2, Copy, Check,
  X, Landmark,
} from 'lucide-react';
import Reveal from '../components/Reveal';
import {
  EXAMS, EXAM_CITIES, EXAM_YEARS, examToText,
  type ExamDoc, type ExamSession,
} from '../data/exams';

/* ---------- عارض الامتحان التفاعلي ---------- */
function ExamViewer({ exam, onClose }: { exam: ExamDoc; onClose: () => void }) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(examToText(exam));
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* ignore */ }
  };

  const download = () => {
    const blob = new Blob(['\ufeff' + examToText(exam)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `imtihan-${exam.year}-${exam.session === 'الدورة العادية' ? '3adiya' : 'istidrakiya'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const answered = Object.keys(picked).length;
  const correct = Object.entries(picked).filter(([i, v]) => exam.inline.questions[Number(i)].answer === v).length;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 md:p-6 bg-night/75 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#101d33] text-ink dark:text-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto anim-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* رأس */}
        <div className="sticky top-0 bg-white/95 dark:bg-[#101d33]/95 backdrop-blur border-b border-[var(--c-border)] px-6 py-5 z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-black px-3 py-1.5 rounded-full bg-leaf-soft text-leaf">{exam.session}</span>
                <span className="text-xs font-black px-3 py-1.5 rounded-full surface-tint t-muted">{exam.year}</span>
                <span className="text-[11px] font-bold t-muted">{exam.level}</span>
              </div>
              <h3 className="font-display font-black text-xl leading-snug">امتحان مادة الاجتماعيات</h3>
              <p className="text-[11px] t-muted mt-1">مركز: {exam.city} · {exam.branch}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0" aria-label="إغلاق">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={download} className="btn-primary px-4 py-2.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> تنزيل الامتحان
            </button>
            <button onClick={copy} className="px-4 py-2.5 rounded-xl border-2 border-[var(--c-border)] text-xs font-black inline-flex items-center gap-1.5 hover:border-azure/50 transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-leaf" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'تم النسخ' : 'نسخ النص'}
            </button>
            {answered > 0 && (
              <span className="self-center text-[11px] font-black px-3 py-2 rounded-xl bg-leaf-soft text-leaf">
                {correct} / {answered} صحيحة
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-7">
          <div className="p-4 rounded-2xl surface-tint text-sm leading-relaxed">{exam.inline.intro}</div>

          {exam.inline.questions.map((q, qi) => {
            const sel = picked[qi];
            return (
              <div key={q.q}>
                <div className="font-bold text-sm mb-3 flex items-start gap-2">
                  <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-azure to-navy text-gold font-display font-black text-xs flex items-center justify-center shrink-0">
                    {qi + 1}
                  </span>
                  <span className="flex-1 leading-relaxed">{q.q}</span>
                </div>
                <div className="grid gap-2 pr-9">
                  {q.options.map((opt, oi) => {
                    const isSel = sel === oi;
                    const isAns = oi === q.answer;
                    let cls = 'surface border-[var(--c-border)] hover:border-azure/50';
                    if (sel !== undefined) {
                      if (isAns) cls = 'border-leaf bg-leaf-soft text-leaf';
                      else if (isSel) cls = 'border-terra bg-terra-soft text-terra';
                      else cls = 'surface border-[var(--c-border)] opacity-50';
                    }
                    return (
                      <button
                        key={opt}
                        disabled={sel !== undefined}
                        onClick={() => setPicked({ ...picked, [qi]: oi })}
                        className={`flex items-center gap-3 text-right px-4 py-3 rounded-xl border-2 text-[13px] font-bold transition-all ${cls} ${sel === undefined ? 'active:scale-[0.99]' : ''}`}
                      >
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
                          sel !== undefined && isAns ? 'bg-leaf text-white' : sel !== undefined && isSel ? 'bg-terra text-white' : 'surface-tint'
                        }`}>
                          {sel !== undefined && isAns ? <CheckCircle2 className="w-3.5 h-3.5" /> : String.fromCharCode(65 + oi)}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {sel !== undefined && (
                  <div className={`anim-pop mt-3 mr-9 p-3.5 rounded-xl text-[13px] leading-relaxed ${
                    sel === q.answer ? 'bg-leaf-soft text-leaf' : 'bg-terra-soft text-terra'
                  }`}>
                    <b>التعليل:</b> {q.explain}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ==================== صفحة الامتحانات ==================== */
export default function ExamsPage() {
  const [city, setCity] = useState<string>('all');
  const [year, setYear] = useState<number | 'all'>('all');
  const [session, setSession] = useState<ExamSession | 'all'>('all');
  const [open, setOpen] = useState<ExamDoc | null>(null);

  const shown = useMemo(
    () =>
      EXAMS.filter((e) => {
        const byCity = city === 'all' || e.city === city;
        const byYear = year === 'all' || e.year === year;
        const bySession = session === 'all' || e.session === session;
        return byCity && byYear && bySession;
      }).sort((a, b) => (b.year - a.year) || a.city.localeCompare(b.city, 'ar')),
    [city, year, session]
  );

  const grouped = useMemo(() => {
    const m = new Map<number, ExamDoc[]>();
    shown.forEach((e) => {
      if (!m.has(e.year)) m.set(e.year, []);
      m.get(e.year)!.push(e);
    });
    return Array.from(m.entries()).sort((a, b) => b[0] - a[0]);
  }, [shown]);

  const sizeKb = (n: number) => `(KB ${n})`;

  return (
    <div className="min-h-screen bg-[#f5f4ef] dark:bg-[#081120] text-slate-900 dark:text-white pt-28 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">

        {/* ===== رأس الصفحة (Header) المطابق للصورة ===== */}
        <Reveal>
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-600/30 text-emerald-900 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 text-xs font-bold">
              <Landmark className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              أرشيف الامتحانات الرسمية
            </div>

            <h1 className="font-display font-black text-3xl md:text-5xl text-slate-900 dark:text-white tracking-tight leading-tight">
              الامتحانات الجهوية الموحدة — الأولى باكالوريا
            </h1>

            <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base max-w-3xl mx-auto leading-relaxed font-medium">
              94 امتحاناً (185 ملف PDF) من 8 جهات بين 2012 و2024: الموضوع الرسمي + عناصر الإجابة، مستضافة على المنصة للتحميل المباشر.
            </p>
          </div>
        </Reveal>

        {/* ===== بطاقة الفلاتر البيضاء (White Filter Card) ===== */}
        <Reveal>
          <div className="bg-white dark:bg-[#101d33] rounded-[2rem] border border-slate-200/90 dark:border-white/10 shadow-sm p-6 md:p-8 space-y-5">

            {/* السطر 1: المدن / الجهات */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCity('all')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all ${
                  city === 'all'
                    ? 'bg-[#0c3b2e] text-white shadow-sm'
                    : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400'
                }`}
              >
                الكل
                <MapPin className="w-3.5 h-3.5" />
              </button>

              {EXAM_CITIES.map((c) => {
                const sel = city === c.name;
                return (
                  <button
                    key={c.name}
                    onClick={() => setCity(c.name)}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
                      sel
                        ? 'bg-[#0c3b2e] text-white shadow-sm'
                        : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {c.name} <span className="opacity-70 font-bold">({c.count})</span>
                  </button>
                );
              })}
            </div>

            {/* السطر 2: السنوات */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setYear('all')}
                className={`px-4 py-2 rounded-full text-xs font-black transition-all ${
                  year === 'all'
                    ? 'bg-[#d9a441] text-white shadow-sm'
                    : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400'
                }`}
              >
                كل السنوات
              </button>

              {EXAM_YEARS.map((y) => {
                const sel = year === y;
                return (
                  <button
                    key={y}
                    onClick={() => setYear(y)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold tabular-nums transition-all ${
                      sel
                        ? 'bg-[#d9a441] text-white shadow-sm'
                        : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {y}
                  </button>
                );
              })}
            </div>

            {/* السطر 3: الدورات + عدد النتائج */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="text-sm font-black text-slate-700 dark:text-slate-200 tabular-nums">
                {shown.length} امتحاناً
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSession('all')}
                  className={`px-4 py-2 rounded-full text-xs font-black transition-all ${
                    session === 'all'
                      ? 'bg-[#15241e] dark:bg-white text-white dark:text-ink shadow-sm'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400'
                  }`}
                >
                  الدورتان
                </button>
                <button
                  onClick={() => setSession('الدورة العادية')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    session === 'الدورة العادية'
                      ? 'bg-[#15241e] dark:bg-white text-white dark:text-ink shadow-sm'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400'
                  }`}
                >
                  الدورة العادية
                </button>
                <button
                  onClick={() => setSession('الدورة الاستدراكية')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    session === 'الدورة الاستدراكية'
                      ? 'bg-[#15241e] dark:bg-white text-white dark:text-ink shadow-sm'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400'
                  }`}
                >
                  الدورة الاستدراكية
                </button>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ===== بطاقات السنوات وقائمة الامتحانات المطابقة للصورة ===== */}
        {grouped.length === 0 ? (
          <div className="text-center py-20 t-muted">لا توجد امتحانات مطابقة لهذه الفلاتر.</div>
        ) : (
          grouped.map(([y, list]) => (
            <Reveal key={y}>
              <div className="rounded-[1.75rem] overflow-hidden border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#101d33] shadow-sm">
                {/* الرأس الداكن الأخضر الغامق */}
                <div className="bg-[#0c3b2e] text-white px-6 md:px-8 py-4 flex items-center justify-between">
                  <span className="text-xs font-black px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-sm">
                    {list.length} امتحانات
                  </span>
                  <span className="font-display font-black text-2xl md:text-3xl tracking-wide tabular-nums">
                    {y}
                  </span>
                </div>

                {/* قائمة الامتحانات */}
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {list.map((e) => (
                    <div
                      key={e.id}
                      className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* معلومات الامتحان (اليمين) */}
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-600/20">
                          <FileText className="w-5 h-5" />
                        </div>

                        <div>
                          <h4 className="font-display font-extrabold text-lg md:text-xl text-slate-900 dark:text-white mb-1.5">
                            {e.city}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              {e.session}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-medium">{e.branch}</span>
                            <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              مع عناصر الإجابة
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* أزرار التحميل (اليسار) */}
                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <button
                          onClick={() => setOpen(e)}
                          className="px-5 py-2.5 rounded-xl bg-[#0c3b2e] hover:bg-[#14553f] text-white text-xs font-black inline-flex items-center gap-2 shadow-sm transition-all"
                        >
                          <Download className="w-4 h-4" />
                          الموضوع {sizeKb(e.subjectKb)}
                        </button>

                        {e.correctionsKb && (
                          <button
                            onClick={() => setOpen(e)}
                            className="px-4 py-2.5 rounded-xl border-2 border-emerald-700/60 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-xs font-black inline-flex items-center gap-2 transition-all"
                          >
                            <Download className="w-4 h-4" />
                            عناصر الإجابة {sizeKb(e.correctionsKb)}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))
        )}
      </div>

      {open && <ExamViewer exam={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
