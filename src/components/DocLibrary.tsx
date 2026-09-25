import { useMemo, useRef, useState } from 'react';
import {
  Search, X, CheckCircle2, XCircle, FileText, Layers, Lightbulb,
  ArrowLeft, Presentation, Globe2, Table2, LineChart, Clock,
  PencilLine, ClipboardList, GraduationCap, LayoutGrid, Filter,
} from 'lucide-react';
import {
  ALL_DOCS, DOC_LEVELS, KIND_META, DOC_CATEGORIES, LIBRARY_STATS,
  categoryCount, categoryInlineCount,
  type LibraryDoc, type DocCategory,
} from '../data/library';
import MoroccoMap from './MoroccoMap';
import HorizontalTimeline from './Timeline';
import Reveal from './Reveal';

const CAT_ICON: Record<string, any> = {
  file: FileText,
  presentation: Presentation,
  globe: Globe2,
  table: Table2,
  chart: LineChart,
  clock: Clock,
  pencil: PencilLine,
  clipboard: ClipboardList,
  graduation: GraduationCap,
};

/* ---------- عارض الوثيقة ---------- */
function DocViewer({ doc, onClose }: { doc: LibraryDoc; onClose: () => void }) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const c = doc.content;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 md:p-6 bg-night/75 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`bg-white dark:bg-[#101d33] text-ink dark:text-white rounded-[2rem] shadow-2xl w-full max-h-[90vh] overflow-y-auto anim-pop ${
          doc.content.timeline ? 'max-w-5xl' : 'max-w-3xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/95 dark:bg-[#101d33]/95 backdrop-blur border-b border-[var(--c-border)] px-6 py-5 z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${KIND_META[doc.kind].tone}`}>
                {KIND_META[doc.kind].icon}
              </span>
              <div>
                <h3 className="font-display font-black text-xl leading-snug">{doc.title}</h3>
                <p className="text-[11px] t-muted mt-1">
                  {doc.subject === 'منهجية' ? 'منهجية' : doc.subject} · {doc.level} · {doc.unit}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0" aria-label="إغلاق">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-7">
          {c.intro && <div className="p-4 rounded-2xl surface-tint text-sm leading-relaxed">{c.intro}</div>}

          {doc.kind === 'خريطة' && doc.subject === 'جغرافيا' && (
            <div className="pt-1"><MoroccoMap /></div>
          )}

          {c.table && (
            <div className="overflow-x-auto rounded-2xl border border-[var(--c-border)]">
              <table className="w-full text-sm">
                {c.table.caption && (
                  <caption className="caption-top px-4 py-3 text-xs font-black t-muted text-right bg-[var(--c-tint)]">
                    {c.table.caption}
                  </caption>
                )}
                <thead>
                  <tr className="border-b-2 border-[var(--c-border)]">
                    {c.table.headers.map((h) => (
                      <th key={h} className="py-3 px-4 text-right font-display text-xs whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {c.table.rows.map((row, i) => (
                    <tr key={i} className="border-b border-[var(--c-border)] last:border-0 hover:bg-[var(--c-tint)] transition-colors">
                      {row.map((cell, j) => (
                        <td key={j} className={`py-3 px-4 ${j === 0 ? 'font-bold' : ''}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {c.timeline && (
            <div>
              <div className="text-xs font-black t-muted mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4" /> التسلسل الزمني
              </div>
              <HorizontalTimeline items={c.timeline} />
            </div>
          )}

          {c.bullets && (
            <div>
              <div className="text-xs font-black t-muted mb-3">محاور أساسية</div>
              <ul className="space-y-2.5">
                {c.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#b5832a] mt-2 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {c.concepts && (
            <div>
              <div className="text-xs font-black t-muted mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> مفاهيم ومصطلحات
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {c.concepts.map((k) => (
                  <div key={k.term} className="p-4 rounded-2xl surface-tint">
                    <div className="font-display font-extrabold text-sm mb-1 text-[#8c5f1f] dark:text-[#e0b256]">{k.term}</div>
                    <div className="text-[13px] leading-relaxed">{k.def}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {c.exercise && (
            <div className="pt-2 border-t border-[var(--c-border)]">
              <div className="text-xs font-black t-muted mb-4 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" /> تمرين تفاعلي — جاوب ثم راجع التصحيح
              </div>
              <div className="space-y-6">
                {c.exercise.map((ex, qi) => {
                  const sel = picked[qi];
                  return (
                    <div key={ex.question}>
                      <div className="font-bold text-sm mb-3">
                        <span className="text-[#8c5f1f] dark:text-[#e0b256] font-black">{qi + 1}. </span>
                        {ex.question}
                      </div>
                      <div className="grid gap-2">
                        {ex.options.map((opt, oi) => {
                          const isSel = sel === oi;
                          const isAns = oi === ex.answer;
                          let cls = 'surface border-[var(--c-border)] hover:border-[#b5832a]';
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
                              className={`flex items-center gap-3 text-right px-4 py-3 rounded-xl border-2 text-[13px] font-bold transition-all ${cls}`}
                            >
                              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
                                sel !== undefined && isAns ? 'bg-leaf text-white' : sel !== undefined && isSel ? 'bg-terra text-white' : 'surface-tint'
                              }`}>
                                {sel !== undefined && isAns ? <CheckCircle2 className="w-3.5 h-3.5" /> : sel !== undefined && isSel ? <XCircle className="w-3.5 h-3.5" /> : String.fromCharCode(65 + oi)}
                              </span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {sel !== undefined && (
                        <div className={`anim-pop mt-3 p-3.5 rounded-xl text-[13px] leading-relaxed ${
                          sel === ex.answer ? 'bg-leaf-soft text-leaf' : 'bg-terra-soft text-terra'
                        }`}>
                          {ex.explain}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==================== المكتبة ==================== */
export default function DocLibrary() {
  const [cat, setCat] = useState<DocCategory | null>(null);
  const [level, setLevel] = useState<string>('الكل');
  const [kind, setKind] = useState<string>('الكل');
  const [subject, setSubject] = useState<string>('الكل');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<LibraryDoc | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  /** الدخول إلى صنف — مع تمرير سلس نحو رأس المكتبة */
  const enterCategory = (c: DocCategory) => {
    setCat(c);
    setLevel('الكل');
    setKind('الكل');
    setSubject('الكل');
    setQuery('');
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const exitCategory = () => {
    setCat(null);
    setLevel('الكل');
    setKind('الكل');
    setSubject('الكل');
    setQuery('');
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  /** وثائق الصنف قبل الفلترة (لحساب عدّادات الأنواع) */
  const catDocs = useMemo(() => (cat ? ALL_DOCS.filter((d) => cat.kinds.includes(d.kind)) : []), [cat]);

  /** الأنواع المتوفرة فعلياً داخل الصنف */
  const availableKinds = useMemo(() => {
    const m = new Map<string, number>();
    catDocs.forEach((d) => m.set(d.kind, (m.get(d.kind) || 0) + 1));
    return Array.from(m.entries());
  }, [catDocs]);

  /** المواد المتوفرة داخل الصنف */
  const availableSubjects = useMemo(() => {
    const m = new Map<string, number>();
    catDocs.forEach((d) => m.set(d.subject, (m.get(d.subject) || 0) + 1));
    return Array.from(m.entries());
  }, [catDocs]);

  const docs = useMemo(() => {
    return catDocs.filter((d) => {
      const byKind = kind === 'الكل' || d.kind === kind;
      const bySubject = subject === 'الكل' || d.subject === subject;
      const byLevel = level === 'الكل' || d.level === level || d.level === 'كل المستويات';
      const byQuery = !query.trim() || d.title.includes(query) || d.desc.includes(query) || d.unit.includes(query);
      return byKind && bySubject && byLevel && byQuery;
    });
  }, [catDocs, kind, subject, level, query]);

  const activeFilters =
    (kind !== 'الكل' ? 1 : 0) + (subject !== 'الكل' ? 1 : 0) + (level !== 'الكل' ? 1 : 0) + (query.trim() ? 1 : 0);

  /* ---------- عرض داخل الصنف ---------- */
  if (cat) {
    const Icon = CAT_ICON[cat.icon] ?? FileText;
    const inlineCount = categoryInlineCount(cat);
    return (
      <div ref={topRef} className="space-y-6 scroll-mt-28 anim-pop">
        {/* رأس الصنف */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-600/20 shrink-0">
              <Icon className="w-6 h-6" strokeWidth={1.9} />
            </span>
            <div>
              <h3 className="font-display font-black text-2xl">{cat.title}</h3>
              <p className="text-xs t-muted mt-1">{cat.desc}</p>
            </div>
          </div>
          <button
            onClick={exitCategory}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-[var(--c-border)] text-xs font-black hover:border-emerald-600/50 transition-colors shrink-0"
          >
            <LayoutGrid className="w-4 h-4" />
            كل الأصناف
          </button>
        </div>

        {/* لوحة الفلاتر */}
        <div className="surface rounded-3xl border border-[var(--c-border)] p-5 space-y-4">
          {/* بحث */}
          <div className="relative">
            <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 t-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`ابحث في ${cat.title}…`}
              className="w-full pr-11 pl-4 py-3 rounded-2xl border-2 border-[var(--c-border)] bg-transparent focus:border-emerald-600 focus:outline-none text-sm font-bold"
            />
          </div>

          {/* تصفية حسب النوع */}
          {availableKinds.length > 1 && (
            <div>
              <div className="text-[11px] font-black t-muted mb-2 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" /> تصفية حسب النوع
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setKind('الكل')}
                  className={`px-3.5 py-2 rounded-full text-xs font-black transition-all ${
                    kind === 'الكل' ? 'bg-[#0c3b2e] text-white shadow-sm' : 'surface-tint t-muted hover:text-emerald-700'
                  }`}
                >
                  كل الأنواع ({catDocs.length})
                </button>
                {availableKinds.map(([k, n]) => (
                  <button
                    key={k}
                    onClick={() => setKind(k)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
                      kind === k ? 'bg-[#0c3b2e] text-white shadow-sm' : 'surface-tint t-muted hover:text-emerald-700'
                    }`}
                  >
                    <span>{KIND_META[k as keyof typeof KIND_META].icon}</span>
                    {k} <span className="opacity-70 font-black">({n})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* تصفية حسب المادة */}
          {availableSubjects.length > 1 && (
            <div>
              <div className="text-[11px] font-black t-muted mb-2">تصفية حسب المادة</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSubject('الكل')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all ${
                    subject === 'الكل' ? 'bg-[#b5832a] text-white shadow-sm' : 'surface-tint t-muted hover:text-[#8c5f1f]'
                  }`}
                >
                  الكل
                </button>
                {availableSubjects.map(([s, n]) => (
                  <button
                    key={s}
                    onClick={() => setSubject(s)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                      subject === s ? 'bg-[#b5832a] text-white shadow-sm' : 'surface-tint t-muted hover:text-[#8c5f1f]'
                    }`}
                  >
                    {s} <span className="opacity-70 font-black">({n})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* تصفية حسب المستوى */}
          <div>
            <div className="text-[11px] font-black t-muted mb-2">تصفية حسب المستوى</div>
            <div className="flex flex-wrap gap-2">
              {DOC_LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    level === l ? 'bg-[#0c3b2e] text-white shadow-sm' : 'surface-tint t-muted hover:text-emerald-700'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* عدّاد النتائج + إعادة الضبط */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--c-border)]">
            <span className="text-xs font-black">
              {docs.length} {docs.length === 1 ? 'وثيقة' : 'وثائق'}
            </span>
            {activeFilters > 0 && (
              <button
                onClick={() => { setKind('الكل'); setSubject('الكل'); setLevel('الكل'); setQuery(''); }}
                className="text-[11px] font-bold text-terra hover:underline"
              >
                إعادة الضبط ({activeFilters})
              </button>
            )}
          </div>
        </div>

        {/* الوثائق */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {docs.map((d, i) => (
            <Reveal key={d.id} delay={(i % 3) * 70}>
              <button onClick={() => setOpen(d)} className="card-surface rounded-3xl p-6 text-right w-full h-full flex flex-col group">
                <div className="flex items-start justify-between mb-4">
                  <span className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${KIND_META[d.kind].tone}`}>
                    {KIND_META[d.kind].icon}
                  </span>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full surface-tint t-muted">{d.kind}</span>
                </div>
                <h4 className="font-display font-extrabold text-base mb-2 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  {d.title}
                </h4>
                <p className="text-[13px] t-muted leading-relaxed mb-4 flex-1">{d.desc}</p>
                <div className="flex items-center justify-between pt-4 border-t border-[var(--c-border)]">
                  <span className="text-[10.5px] font-bold t-muted truncate max-w-[55%]">{d.level}</span>
                  <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                    فتح الوثيقة <ArrowLeft className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            </Reveal>
          ))}
        </div>

        {docs.length === 0 && (
          <div className="text-center py-14 t-muted text-sm">لا توجد وثائق مطابقة في هذا الصنف.</div>
        )}

        {cat.extra > 0 && (
          <div className="flex items-start gap-3 p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-600/20">
            <FileText className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed">
              <b>{inlineCount} وثيقة متاحة رقمياً الآن</b> من أصل {categoryCount(cat)} في هذا الصنف —
              الباقي متوفر بخزانة المؤسسة ويُرقمن تدريجياً بإشراف أساتذة المادة.
            </p>
          </div>
        )}

        {open && <DocViewer doc={open} onClose={() => setOpen(null)} />}
      </div>
    );
  }

  /* ---------- واجهة الأصناف (Hub) ---------- */
  return (
    <div ref={topRef} className="space-y-8 scroll-mt-28">
      {/* سطر الإحصاء */}
      <Reveal>
        <p className="text-center text-sm font-black text-emerald-800 dark:text-emerald-300">
          {LIBRARY_STATS.total} موردًا · {LIBRARY_STATS.categories} أصناف · {LIBRARY_STATS.levels} مستويات
        </p>
      </Reveal>

      {/* شبكة الأصناف */}
      <div className="grid md:grid-cols-2 gap-5">
        {DOC_CATEGORIES.map((c, i) => {
          const Icon = CAT_ICON[c.icon] ?? FileText;
          const total = categoryCount(c);
          const inline = categoryInlineCount(c);
          return (
            <Reveal key={c.id} delay={(i % 2) * 80}>
              <button
                onClick={() => enterCategory(c)}
                className="w-full text-right bg-white dark:bg-[#101d33] rounded-[1.75rem] border border-slate-200/90 dark:border-white/10 p-6 md:p-7 h-full flex flex-col group hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                {/* الرأس: أيقونة + عدّاد */}
                <div className="flex items-start justify-between mb-6">
                  <span className="text-[11px] font-black px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                    {total} {total === 1 ? 'مورد' : total <= 10 ? 'موارد' : 'موردًا'}
                  </span>
                  <span className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-5.5 h-5.5 w-6 h-6" strokeWidth={1.9} />
                  </span>
                </div>

                {/* العنوان والوصف */}
                <h3 className="font-display font-black text-xl md:text-2xl mb-2.5 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors">
                  {c.title}
                </h3>
                <p className="text-sm t-muted leading-relaxed flex-1">{c.desc}</p>

                {/* الفاصل والتذييل */}
                <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-black group-hover:gap-3 transition-all">
                    تصفح <ArrowLeft className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {inline > 0 ? 'متاح الآن' : 'قريباً'}
                  </span>
                </div>
              </button>
            </Reveal>
          );
        })}
      </div>

      {open && <DocViewer doc={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
