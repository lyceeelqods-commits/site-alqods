import { useMemo, useState } from 'react';
import {
  Users, Gauge, TrendingUp, BarChart3, AlertTriangle,
  Search, ChevronDown, CalendarDays, RefreshCcw, GraduationCap, Download, Brain,
} from 'lucide-react';
import { loadRecords, computeDashboard, formatDate, type StudentRecord } from '../lib/store';
import Reveal from './Reveal';

function Kpi({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-3xl border border-line p-6 card-surface">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="font-display font-black text-3xl text-ink">{value}</div>
      <div className="text-sm font-bold text-ink-soft mt-1">{label}</div>
      {sub && <div className="text-xs text-ink-soft/70 mt-1">{sub}</div>}
    </div>
  );
}

function SupportDot({ s }: { s: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    green: { cls: 'bg-leaf text-leaf-soft', label: 'لا يحتاج' },
    yellow: { cls: 'bg-amber text-ink', label: 'دعم جزئي' },
    red: { cls: 'bg-terra text-white', label: 'معالجة' },
  };
  const m = map[s];
  return <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full ${m.cls}`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{m.label}</span>;
}

function StudentCard({ r }: { r: StudentRecord }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-line rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full grid grid-cols-[1fr_auto] md:grid-cols-[1.4fr_1fr_auto_auto_auto] items-center gap-4 px-5 py-4 hover:bg-cream/40 transition-colors text-right">
        <div>
          <div className="font-display font-extrabold text-ink text-sm">{r.code}</div>
          <div className="text-[11px] text-ink-soft flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
            <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {r.levelLabel}</span>
            {r.massar && <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-cream">R{r.massar}</span>}
            {r.clazz && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cream">{r.clazz}</span>}
            {r.isRetest && <span className="inline-flex items-center gap-1 text-amber-deep font-bold"><RefreshCcw className="w-3 h-3" /> إعادة</span>}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-xs text-ink-soft">
          <CalendarDays className="w-3.5 h-3.5" /> {formatDate(r.date)}
        </div>
        <div className="font-display font-black text-lg text-ink">{r.totalScore}<span className="text-xs text-ink-soft">/20</span></div>
        <SupportDot s={r.support} />
        <ChevronDown className={`w-4 h-4 text-ink-soft transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 anim-pop-in space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-terra-soft">
              <div className="text-[11px] font-bold text-terra">التاريخ</div>
              <div className="font-display font-black text-xl text-ink">{r.historyScore}/10</div>
            </div>
            <div className="p-3 rounded-xl bg-leaf-soft">
              <div className="text-[11px] font-bold text-leaf">الجغرافيا</div>
              <div className="font-display font-black text-xl text-ink">{r.geoScore}/10</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-soft">
              <div className="text-[11px] font-bold text-amber-deep">النسبة</div>
              <div className="font-display font-black text-xl text-ink">{r.percent}%</div>
            </div>
          </div>

          {r.isRetest && r.previousScore !== undefined && (
            <div className="flex items-center gap-2 text-sm font-bold text-leaf bg-leaf-soft rounded-xl px-4 py-2.5">
              <TrendingUp className="w-4 h-4" />
              تطور عن الاختبار الأول: {r.totalScore - r.previousScore > 0 ? `+${r.totalScore - r.previousScore}` : r.totalScore - r.previousScore} نقطة ({r.previousScore} ← {r.totalScore})
            </div>
          )}

          <div>
            <div className="text-xs font-black text-ink-soft mb-2">المهارات</div>
            <div className="flex flex-wrap gap-2">
              {r.skills.map((s, i) => (
                <span key={i} className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border ${
                  s.status === 'mastery' ? 'bg-leaf-soft/60 border-leaf/20 text-leaf' :
                  s.status === 'mid' ? 'bg-amber-soft/60 border-amber/30 text-amber-deep' :
                  'bg-terra-soft/60 border-terra/20 text-terra'
                }`}>
                  {s.name} — {s.percent}%
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const records = useMemo(() => loadRecords(), []);
  const stats = useMemo(() => computeDashboard(records), [records]);
  const [query, setQuery] = useState('');

  const filtered = records
    .filter((r) => r.code.toLowerCase().includes(query.toLowerCase()) || r.levelLabel.includes(query))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const maxBin = Math.max(...stats.bins.map((b) => b.count), 1);
  const maxWeak = Math.max(...stats.topWeak.map((w) => w.count), 1);

  const downloadReport = () => {
    const lines = [
      '══════════════════════════════════════════',
      ' تقرير تشخيصي — التقويم التشخيصي في مادة الاجتماعيات',
      ' إعداد الأستاذ: عماد طليل',
      '══════════════════════════════════════════',
      ` تاريخ الإنشاء: ${new Date().toLocaleDateString('ar-MA')}`,
      ` عدد المتعلمين: ${stats.totalStudents}  |  عدد المحاولات: ${stats.totalAttempts}`,
      ` المتوسط العام: ${stats.avgTotal.toFixed(1)}/20  (تاريخ ${stats.avgHist.toFixed(1)}/10 — جغرافيا ${stats.avgGeo.toFixed(1)}/10)`,
      ` نسبة من يحتاجون دعماً: ${stats.needPercent}%`,
      '',
      '— التصنيف حسب مستوى التحكم —',
      ` تحكّم جيد: ${stats.supportSplit.green} متعلم(ة)`,
      ` يحتاج دعماً جزئياً: ${stats.supportSplit.yellow} متعلم(ة)`,
      ` يحتاج معالجة: ${stats.supportSplit.red} متعلم(ة)`,
      '',
      '— مقارنة المستويات —',
      ...stats.byLevel.map((l) => ` ${l.label}: ${l.avg.toFixed(1)}/20 (تاريخ ${l.avgHist.toFixed(1)} / جغرافيا ${l.avgGeo.toFixed(1)}) — يحتاج دعماً: ${l.needPercent}%`),
      '',
      '— نسبة التحكم في المهارات —',
      ...stats.skillMastery.map((s) => ` ${s.name}: ${s.percent}% (${s.n} محاولة)`),
      '',
      '— أكثر مواطن الضعف انتشاراً —',
      ...stats.topWeak.map((w, i) => ` ${i + 1}. ${w.name} (${w.count} متعلم(ة))`),
      '',
      '— التلاميذ —',
      ...records.map((r) => ` ${r.code} | ${r.levelLabel} | ${r.totalScore}/20 | تاريخ ${r.historyScore}/10 | جغرافيا ${r.geoScore}/10 | ${formatDate(r.date)}${r.isRetest && r.previousScore !== undefined ? ` (إعادة: من ${r.previousScore} إلى ${r.totalScore})` : ''}`),
      '',
      '— التقرير مولَّد تلقائياً من بيانات المنصة (تجريبية + اختبارات محفوظة محلياً) —',
    ];
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tashkhis-report.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-paper pt-28 pb-20">
      <div className="max-w-6xl mx-auto px-5 space-y-8">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-soft text-amber-deep text-sm font-bold mb-3">
                <BarChart3 className="w-4 h-4" /> واجهة الأستاذ — متابعة التقويم التشخيصي
              </div>
              <h1 className="font-display font-black text-3xl md:text-4xl text-ink">تقارير التشخيص</h1>
              <p className="text-ink-soft mt-2">تتضمن اللوحة بيانات تجريبية وبيانات اختبارات المنصة المحفوظة محلياً على هذا الجهاز.</p>
            </div>
            <button
              onClick={downloadReport}
              className="btn-primary px-5 py-3.5 rounded-2xl font-display font-extrabold text-sm inline-flex items-center gap-2 shrink-0"
            >
              <Download className="w-4 h-4" />
              استخراج تقرير تشخيصي
            </button>
          </div>
        </Reveal>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Reveal><Kpi icon={Users} label="تلاميذ" value={String(stats.totalStudents)} sub={`${stats.totalAttempts} محاولة`} color="bg-cream text-forest" /></Reveal>
          <Reveal delay={60}><Kpi icon={Gauge} label="متوسط النتائج" value={`${stats.avgTotal.toFixed(1)}/20`} color="bg-amber-soft text-amber-deep" /></Reveal>
          <Reveal delay={120}><Kpi icon={TrendingUp} label="متوسط التاريخ" value={`${stats.avgHist.toFixed(1)}/10`} color="bg-terra-soft text-terra" /></Reveal>
          <Reveal delay={180}><Kpi icon={TrendingUp} label="متوسط الجغرافيا" value={`${stats.avgGeo.toFixed(1)}/10`} color="bg-leaf-soft text-leaf" /></Reveal>
          <Reveal delay={240}><Kpi icon={AlertTriangle} label="يحتاجون دعماً" value={`${stats.needPercent}%`} color="bg-cream text-forest" /></Reveal>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* distribution */}
          <Reveal>
            <div className="bg-white rounded-3xl border border-line p-7 h-full">
              <h3 className="font-display font-extrabold text-xl text-ink mb-6">توزيع النتائج /20</h3>
              <div className="flex items-end justify-around gap-4 h-44">
                {stats.bins.map((b, i) => (
                  <div key={b.label} className="flex flex-col items-center gap-2 flex-1">
                    <span className="text-xs font-black text-ink">{b.count}</span>
                    <div
                      className={`w-full max-w-14 rounded-t-xl bar-grow ${i === 0 ? 'bg-terra' : i === 1 ? 'bg-amber' : i === 2 ? 'bg-leaf' : 'bg-forest'}`}
                      style={{ height: `${Math.max(6, (b.count / maxBin) * 130)}px`, animationDelay: `${i * 120}ms` }}
                    />
                    <span className="text-[11px] font-bold text-ink-soft">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* top weaknesses */}
          <Reveal delay={100}>
            <div className="bg-white rounded-3xl border border-line p-7 h-full">
              <h3 className="font-display font-extrabold text-xl text-ink mb-6">أكثر مواطن الضعف انتشاراً</h3>
              <div className="space-y-4">
                {stats.topWeak.map((w, i) => (
                  <div key={w.name}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-bold text-ink">{w.name}</span>
                      <span className="font-black text-ink-soft">{w.count} تلميذ</span>
                    </div>
                    <div className="h-2.5 bg-cream rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-l from-terra to-amber rounded-full bar-grow" style={{ width: `${(w.count / maxWeak) * 100}%`, animationDelay: `${i * 100}ms` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* skill mastery + student classification */}
        <div className="grid lg:grid-cols-2 gap-5">
          <Reveal>
            <div className="bg-white rounded-3xl border border-line p-7 h-full">
              <h3 className="font-display font-extrabold text-xl text-ink mb-6 flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-sky-soft text-azure dark:bg-white/10 dark:text-gold flex items-center justify-center"><Brain className="w-4.5 h-4.5 w-5 h-5" /></span>
                نسبة التحكم في كل مهارة
              </h3>
              <div className="space-y-4">
                {stats.skillMastery.map((s, i) => (
                  <div key={s.name}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-bold text-ink">{s.name}</span>
                      <span className={`font-black ${s.percent >= 70 ? 'text-leaf' : s.percent >= 50 ? 'text-amber-deep' : 'text-terra'}`}>{s.percent}%</span>
                    </div>
                    <div className="h-2.5 bg-cream rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bar-grow ${s.percent >= 70 ? 'bg-leaf' : s.percent >= 50 ? 'bg-amber' : 'bg-terra'}`}
                        style={{ width: `${s.percent}%`, animationDelay: `${i * 80}ms` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="bg-white rounded-3xl border border-line p-7 h-full">
              <h3 className="font-display font-extrabold text-xl text-ink mb-6">تصنيف المتعلمين حسب مستوى التحكم</h3>
              <div className="space-y-4">
                {(
                  [
                    { k: 'green', label: 'تحكّم جيد — لا يحتاج دعماً', count: stats.supportSplit.green, color: 'bg-leaf', soft: 'bg-leaf-soft text-leaf' },
                    { k: 'yellow', label: 'دعم جزئي في مهارات محددة', count: stats.supportSplit.yellow, color: 'bg-amber', soft: 'bg-amber-soft text-amber-deep' },
                    { k: 'red', label: 'معالجة ودعم مكثف', count: stats.supportSplit.red, color: 'bg-terra', soft: 'bg-terra-soft text-terra' },
                  ] as const
                ).map((row) => {
                  const pct = stats.totalAttempts ? Math.round((row.count / stats.totalAttempts) * 100) : 0;
                  return (
                    <div key={row.k}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="flex items-center gap-2 text-sm font-bold text-ink">
                          <span className={`w-2.5 h-2.5 rounded-full ${row.color}`} />
                          {row.label}
                        </span>
                        <span className={`text-xs font-black px-2.5 py-1 rounded-full ${row.soft}`}>{row.count} متعلم(ة) — {pct}%</span>
                      </div>
                      <div className="h-2.5 bg-cream rounded-full overflow-hidden">
                        <div className={`h-full ${row.color} rounded-full bar-grow`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs t-muted mt-6 leading-relaxed border-t border-[var(--c-border)] pt-4">
                التصنيف يُحسب تلقائياً: أخضر (80% فأكثر)، أصفر (50–79% أو تعثر مهارة واحدة)، أحمر (أقل من 50% أو 3 تعثرات فأكثر).
              </p>
            </div>
          </Reveal>
        </div>

        {/* level comparison */}
        <Reveal>
          <div className="bg-white rounded-3xl border border-line p-7 overflow-x-auto">
            <h3 className="font-display font-extrabold text-xl text-ink mb-5">مقارنة بين المستويات (التاريخ والجغرافيا)</h3>
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b-2 border-line text-ink-soft">
                  <th className="text-right py-3 px-2 font-display">المستوى</th>
                  <th className="text-center py-3 px-2 font-display">التلاميذ</th>
                  <th className="text-center py-3 px-2 font-display">المتوسط /20</th>
                  <th className="text-center py-3 px-2 font-display">التاريخ /10</th>
                  <th className="text-center py-3 px-2 font-display">الجغرافيا /10</th>
                  <th className="text-center py-3 px-2 font-display">يحتاج دعم</th>
                </tr>
              </thead>
              <tbody>
                {stats.byLevel.map((l) => (
                  <tr key={l.levelId} className="border-b border-line/70 hover:bg-cream/40 transition-colors">
                    <td className="py-3.5 px-2 font-bold text-ink">{l.label}</td>
                    <td className="py-3.5 px-2 text-center text-ink-soft">{l.count}</td>
                    <td className="py-3.5 px-2 text-center font-black text-ink">{l.avg.toFixed(1)}</td>
                    <td className="py-3.5 px-2 text-center text-terra font-bold">{l.avgHist.toFixed(1)}</td>
                    <td className="py-3.5 px-2 text-center text-leaf font-bold">{l.avgGeo.toFixed(1)}</td>
                    <td className="py-3.5 px-2 text-center">
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                        l.needPercent > 40 ? 'bg-terra-soft text-terra' : l.needPercent > 25 ? 'bg-amber-soft text-amber-deep' : 'bg-leaf-soft text-leaf'
                      }`}>{l.needPercent}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        {/* students */}
        <Reveal>
          <div className="bg-white rounded-3xl border border-line p-7">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
              <h3 className="font-display font-extrabold text-xl text-ink">بطاقات التلاميذ</h3>
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث برمز التلميذ أو المستوى…"
                  className="pr-10 pl-4 py-2.5 rounded-xl border-2 border-line bg-paper/40 focus:border-forest focus:outline-none focus:ring-4 focus:ring-forest/10 text-sm w-full md:w-72 transition-all"
                />
              </div>
            </div>
            <div className="space-y-3">
              {filtered.map((r) => (
                <StudentCard key={r.id} r={r} />
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-10 text-ink-soft">لا توجد نتائج مطابقة</div>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
