import { useEffect, useMemo, useState } from 'react';
import {
  Award, TrendingUp, TrendingDown, Brain, Target, Lightbulb,
  RefreshCcw, CalendarDays, User, CheckCircle2, XCircle, ChevronLeft,
  HelpCircle, Quote, BookOpenCheck, Download, Copy, Check, ListChecks,
} from 'lucide-react';
import { DIFFICULTY_LABEL, type Diagnosis, type SkillResult } from '../lib/diagnosis';
import Reveal, { useCountUp } from './Reveal';

/* ---------- donut gauge ---------- */
function Donut({ percent }: { percent: number }) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGo(true), 150);
    return () => clearTimeout(t);
  }, []);
  const value = useCountUp(go ? percent : 0, 1400);
  const r = 66;
  const c = 2 * Math.PI * r;
  const color = percent >= 80 ? '#1f7a5c' : percent >= 50 ? '#d9881a' : '#d96c47';
  return (
    <div className="relative w-44 h-44">
      <svg width={176} height={176} className="-rotate-90">
        <circle cx={88} cy={88} r={r} fill="none" stroke="#ece5d6" strokeWidth={14} />
        <circle
          cx={88} cy={88} r={r} fill="none"
          stroke={color} strokeWidth={14} strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * (go ? percent : 0)) / 100}
          className="donut-arc"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display font-black text-4xl" style={{ color }}>{Math.round(value)}</div>
        <div className="text-xs font-bold text-ink-soft mt-0.5">النسبة المئوية</div>
      </div>
    </div>
  );
}

/* ---------- radar chart ---------- */
function Radar({ skills, color, label }: { skills: SkillResult[]; color: string; label: string }) {
  const n = Math.max(skills.length, 3);
  const size = 300;
  const cx = size / 2;
  const cy = size / 2 + 8;
  const R = 92;
  const pt = (i: number, r: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const ring = (frac: number) =>
    [...Array(n)].map((_, i) => pt(i, R * frac).join(',')).join(' ');
  const valuePoly = [...Array(n)]
    .map((_, i) => pt(i, R * (skills[i]?.percent ?? 0) / 100).join(','))
    .join(' ');
  const [go, setGo] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGo(true), 250);
    return () => clearTimeout(t);
  }, []);
  const shownPoly = go ? valuePoly : [...Array(n)].map((_, i) => pt(i, 6).join(',')).join(' ');

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size - 8} viewBox={`0 0 ${size} ${size - 8}`} className="w-full max-w-[300px]">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon key={f} points={ring(f)} fill="none" stroke="#e5ddcb" strokeWidth={1} />
        ))}
        {[...Array(n)].map((_, i) => {
          const [x, y] = pt(i, R);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e5ddcb" strokeWidth={1} />;
        })}
        <polygon points={shownPoly} fill={color} fillOpacity={0.22} stroke={color} strokeWidth={2.5} className="radar-poly" />
        {[...Array(n)].map((_, i) => {
          const [x, y] = pt(i, R * (go ? (skills[i]?.percent ?? 0) / 100 : 0) / 1);
          return <circle key={i} cx={x} cy={y} r={4} fill={color} className="radar-poly" style={{ transition: 'all 1s cubic-bezier(0.22,1,0.36,1)' }} />;
        })}
        {[...Array(n)].map((_, i) => {
          const [x, y] = pt(i, R + 22);
          return (
            <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={10.5} fontWeight={700} fill="#55645c">
              {skills[i]?.name ?? ''}
            </text>
          );
        })}
      </svg>
      <span className="text-sm font-display font-extrabold" style={{ color }}>{label}</span>
    </div>
  );
}

/* ---------- confetti ---------- */
function Confetti() {
  const bits = useMemo(
    () =>
      [...Array(28)].map((_, i) => ({
        left: `${(i * 37) % 100}%`,
        delay: `${(i % 10) * 0.18}s`,
        duration: `${2.4 + (i % 5) * 0.35}s`,
        color: ['#efa93c', '#1f7a5c', '#d96c47', '#2f6fa3', '#f5b95a'][i % 5],
      })),
    []
  );
  return (
    <>
      {bits.map((b, i) => (
        <span
          key={i}
          className="confetti-bit"
          style={{ left: b.left, background: b.color, animationDelay: b.delay, animationDuration: b.duration }}
        />
      ))}
    </>
  );
}

const statusChip = (s: SkillResult) =>
  s.status === 'mastery'
    ? { label: 'متقن', cls: 'bg-leaf-soft text-leaf' }
    : s.status === 'mid'
    ? { label: 'متوسط', cls: 'bg-amber-soft text-amber-deep' }
    : { label: 'يحتاج دعم', cls: 'bg-terra-soft text-terra' };

export default function ResultPage({
  code,
  levelLabel,
  date,
  isRetest,
  previousScore,
  previousPercent,
  diag,
  onRetest,
  onHome,
  personal = false,
}: {
  code: string;
  levelLabel: string;
  date: string;
  isRetest?: boolean;
  previousScore?: number;
  previousPercent?: number;
  diag: Diagnosis;
  onRetest: () => void;
  onHome: () => void;
  personal?: boolean;
}) {
  const histSkills = diag.skills.filter((s) => s.sujet === 'histoire');
  const geoSkills = diag.skills.filter((s) => s.sujet === 'geographie');
  const tone = diag.mastery.tone;
  const delta = previousScore !== undefined ? diag.totalScore - previousScore : null;
  const [copied, setCopied] = useState(false);
  const [showReview, setShowReview] = useState(true);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong' | 'correct'>('wrong');

  const buildReport = () =>
    [
      '════════════════════════════════════',
      ' نتيجة التقويم الشخصي',
      ' مادة التاريخ والجغرافيا — إعداد الأستاذ: عماد طليل',
      '════════════════════════════════════',
      ` التاريخ: ${date}`,
      ` الرمز: ${code}`,
      ` المستوى: ${levelLabel}`,
      '',
      ` النقطة العامة: ${diag.totalScore}/${diag.maxTotal}`,
      ` النسبة المئوية: ${diag.percent}%`,
      ` مستوى التحكم: ${diag.mastery.label}`,
      ` التاريخ: ${diag.historyScore}/${diag.historyMax}${diag.historyMax === 0 ? ' (لم يُقيَّم في هذا التقويم)' : ''}`,
      ` الجغرافيا: ${diag.geoScore}/${diag.geoMax}${diag.geoMax === 0 ? ' (لم تُقيَّم في هذا التقويم)' : ''}`,
      ` الإجابات: ${diag.correct} صحيحة — ${diag.wrong} خاطئة — ${diag.unanswered} بدون إجابة`,
      '',
      '— التشخيص الشخصي —',
      ...diag.diagnosis,
      '',
      '— مستوى المهارات —',
      ...diag.skills.map((s) =>
        ` ${s.name} (${s.sujet === 'histoire' ? 'تاريخ' : 'جغرافيا'}): ${s.percent}% — ${s.status === 'mastery' ? 'متقن' : s.status === 'mid' ? 'متوسط' : 'يحتاج إلى دعم'}`
      ),
      '',
      '— التوصيات التربوية —',
      ...diag.recommendations.map((r) => ` • ${r}`),
      '',
      '— خطة التطوير —',
      ...diag.plan.map((w, i) => `${i + 1}. ${w.week}: ${w.title}`),
      ...(diag.review.length
        ? [
            '',
            '════════════════════════════════════',
            ' تصحيح الإجابات',
            '════════════════════════════════════',
            '',
            ...diag.review.flatMap((r) => [
              `${r.index}. ${r.question}`,
              `   [${r.sujet === 'histoire' ? 'تاريخ' : 'جغرافيا'} · ${r.competence} · ${DIFFICULTY_LABEL[r.difficulty]}]`,
              `   إجابتك: ${r.userText ?? '— لم تُجب —'}  ${r.ok ? '✔ صحيحة' : '✘ خاطئة'}`,
              `   الجواب الصحيح: ${r.correctText}`,
              ...(r.explain ? [`   التعليل: ${r.explain}`] : []),
              '',
            ]),
          ]
        : []),
    ].join('\n');

  const downloadResult = () => {
    const blob = new Blob(['\ufeff' + buildReport()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'natijat-at-taqweem.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(buildReport());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen bg-paper pt-28 pb-20">
      {diag.percent >= 75 && <Confetti />}

      <div className="max-w-5xl mx-auto px-5 space-y-8">
        {/* header */}
        <Reveal>
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-forest text-paper text-sm font-bold shadow-lg shadow-forest/20">
              <Award className="w-4 h-4 text-amber" />
              {personal ? (isRetest ? 'نتيجتي — إعادة التقويم' : 'نتيجتي') : isRetest ? 'نتيجة إعادة التقويم' : 'نتيجة التقويم التشخيصي'}
            </div>
            <h1 className="font-display font-black text-3xl md:text-5xl text-ink">{levelLabel}</h1>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm text-ink-soft">
              <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {code}</span>
              <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> {date}</span>
            </div>
          </div>
        </Reveal>

        {/* retest comparison */}
        {isRetest && delta !== null && previousScore !== undefined && previousPercent !== undefined && (
          <Reveal>
            <div className="bg-white rounded-3xl border-2 border-leaf/30 shadow-lg shadow-leaf/5 p-7 grid md:grid-cols-4 gap-6 items-center">
              <div className="text-center">
                <div className="text-xs font-bold text-ink-soft mb-1">الاختبار الأول</div>
                <div className="font-display font-black text-3xl text-ink">{previousScore}<span className="text-base text-ink-soft">/20</span></div>
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-ink-soft mb-1">الاختبار الثاني</div>
                <div className="font-display font-black text-3xl text-forest">{diag.totalScore}<span className="text-base text-ink-soft">/20</span></div>
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-ink-soft mb-1">مقدار التطور</div>
                <div className={`font-display font-black text-3xl flex items-center justify-center gap-1.5 ${delta > 0 ? 'text-leaf' : delta < 0 ? 'text-terra' : 'text-ink'}`}>
                  {delta > 0 ? <TrendingUp className="w-6 h-6" /> : delta < 0 ? <TrendingDown className="w-6 h-6" /> : null}
                  {delta > 0 ? `+${delta}` : delta} نقطة
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-ink-soft mb-1">النسبة</div>
                <div className="font-display font-black text-2xl text-amber-deep">{previousPercent}% ← {diag.percent}%</div>
              </div>
            </div>
          </Reveal>
        )}

        {/* answer counts */}
        <Reveal>
          <div className="grid grid-cols-3 gap-4">
            <div className="surface rounded-2xl p-5 text-center">
              <CheckCircle2 className="w-6 h-6 text-leaf mx-auto mb-2" />
              <div className="font-display font-black text-3xl text-leaf">{diag.correct}</div>
              <div className="text-xs font-bold t-muted mt-1">إجابات صحيحة</div>
            </div>
            <div className="surface rounded-2xl p-5 text-center">
              <XCircle className="w-6 h-6 text-terra mx-auto mb-2" />
              <div className="font-display font-black text-3xl text-terra">{diag.wrong}</div>
              <div className="text-xs font-bold t-muted mt-1">إجابات خاطئة</div>
            </div>
            <div className="surface rounded-2xl p-5 text-center">
              <HelpCircle className="w-6 h-6 text-ink-soft mx-auto mb-2" />
              <div className="font-display font-black text-3xl text-ink-soft">{diag.unanswered}</div>
              <div className="text-xs font-bold t-muted mt-1">بدون إجابة</div>
            </div>
          </div>
        </Reveal>

        {/* scores */}
        <Reveal>
          <div className="grid md:grid-cols-[auto_1fr] gap-6 items-stretch">
            <div className="bg-white rounded-[2rem] border border-line shadow-[0_16px_40px_-20px_rgba(21,36,30,0.2)] flex flex-col items-center justify-center p-8 gap-3">
              <Donut percent={diag.percent} />
              <div className="font-display font-black text-4xl text-ink">
                {diag.totalScore}<span className="text-lg text-ink-soft"> / {diag.maxTotal}</span>
              </div>
              <span className={`text-sm font-black px-4 py-1.5 rounded-full ${
                tone === 'green' ? 'bg-leaf-soft text-leaf' : tone === 'yellow' ? 'bg-amber-soft text-amber-deep' : 'bg-terra-soft text-terra'
              }`}>
                {diag.mastery.label}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="bg-white rounded-[2rem] border border-line p-7 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-extrabold text-xl text-ink">مستوى التاريخ</h3>
                  {diag.historyMax > 0 ? (
                    <span className="text-xs font-black text-terra bg-terra-soft px-3 py-1.5 rounded-full">{diag.historyMax} نقط</span>
                  ) : (
                    <span className="text-xs font-black text-ink-soft bg-cream px-3 py-1.5 rounded-full">لم يُقيَّم</span>
                  )}
                </div>
                {diag.historyMax > 0 ? (
                  <>
                    <div className="font-display font-black text-5xl text-ink mb-4">{diag.historyScore}<span className="text-xl text-ink-soft"> / {diag.historyMax}</span></div>
                    <div className="h-3 bg-cream rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-l from-terra to-terra/60 rounded-full bar-grow" style={{ width: `${(diag.historyScore / diag.historyMax) * 100}%` }} />
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-ink-soft py-6">لم يشمل هذا التقويم مجال التاريخ.</div>
                )}
              </div>
              <div className="bg-white rounded-[2rem] border border-line p-7 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-extrabold text-xl text-ink">مستوى الجغرافيا</h3>
                  {diag.geoMax > 0 ? (
                    <span className="text-xs font-black text-leaf bg-leaf-soft px-3 py-1.5 rounded-full">{diag.geoMax} نقط</span>
                  ) : (
                    <span className="text-xs font-black text-ink-soft bg-cream px-3 py-1.5 rounded-full">لم يُقيَّم</span>
                  )}
                </div>
                {diag.geoMax > 0 ? (
                  <>
                    <div className="font-display font-black text-5xl text-ink mb-4">{diag.geoScore}<span className="text-xl text-ink-soft"> / {diag.geoMax}</span></div>
                    <div className="h-3 bg-cream rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-l from-leaf to-leaf/60 rounded-full bar-grow" style={{ width: `${(diag.geoScore / diag.geoMax) * 100}%` }} />
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-ink-soft py-6">لم يشمل هذا التقويم مجال الجغرافيا.</div>
                )}
              </div>
              <div className="sm:col-span-2">
                {/* support decision */}
                <div className={`rounded-3xl p-6 border-2 ${
                  diag.support === 'green' ? 'bg-leaf-soft/60 border-leaf/30' :
                  diag.support === 'yellow' ? 'bg-amber-soft/60 border-amber/40' : 'bg-terra-soft/60 border-terra/30'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg ${
                      diag.support === 'green' ? 'bg-leaf' : diag.support === 'yellow' ? 'bg-amber-deep' : 'bg-terra'
                    }`}>
                      <Lightbulb className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-display font-extrabold text-xl text-ink mb-1">قرار الدعم</h3>
                      <div className={`inline-flex items-center gap-2 text-sm font-black px-3 py-1.5 rounded-full bg-white/70 ${
                        diag.support === 'green' ? 'text-leaf' : diag.support === 'yellow' ? 'text-amber-deep' : 'text-terra'
                      }`}>
                        <span className={`w-2.5 h-2.5 rounded-full dot-pulse ${diag.support === 'green' ? 'bg-leaf' : diag.support === 'yellow' ? 'bg-amber-deep' : 'bg-terra'}`} />
                        {diag.supportLabel}
                      </div>
                      <p className="text-sm text-ink-soft mt-2 leading-relaxed">{diag.supportReason}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* سلم مستويات التحكم الخمسة */}
          <div className="md:col-span-2 mt-2">
            <div className="bg-white rounded-3xl border border-line p-5">
              <div className="text-xs font-black t-muted mb-3">سُلّم مستويات التحكم (من 20):</div>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { range: '0–5', label: 'ضعيف جداً', color: 'bg-rose-500', text: 'text-rose-700', active: diag.totalScore <= 5 },
                  { range: '6–9', label: 'ضعيف', color: 'bg-orange-400', text: 'text-orange-600', active: diag.totalScore >= 6 && diag.totalScore <= 9 },
                  { range: '10–13', label: 'متوسط', color: 'bg-amber-400', text: 'text-amber-700', active: diag.totalScore >= 10 && diag.totalScore <= 13 },
                  { range: '14–16', label: 'جيد', color: 'bg-emerald-500', text: 'text-emerald-700', active: diag.totalScore >= 14 && diag.totalScore <= 16 },
                  { range: '17–20', label: 'ممتاز', color: 'bg-forest', text: 'text-forest', active: diag.totalScore >= 17 },
                ].map((b) => (
                  <div key={b.label} className={`rounded-xl border-2 p-2.5 text-center transition-all ${b.active ? 'border-current scale-105 shadow-md ' + b.text : 'border-line opacity-55'}`}>
                    <div className={`h-1.5 rounded-full ${b.color} mb-1.5`} />
                    <div className="text-[11px] font-black">{b.label}</div>
                    <div className="text-[10px] t-muted font-bold">{b.range}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* radar charts */}
        <Reveal>
          <div className="bg-white rounded-[2rem] border border-line shadow-[0_16px_40px_-20px_rgba(21,36,30,0.15)] p-7">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-2xl bg-cream text-forest flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-extrabold text-2xl text-ink">خريطة المهارات</h2>
                <p className="text-sm text-ink-soft">كل محور يمثل مهارة قُيست في أسئلة الاختبار</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {histSkills.length > 0 ? (
                <Radar skills={histSkills} color="#d96c47" label="مهارات التاريخ" />
              ) : (
                <div className="flex flex-col items-center justify-center py-14 text-ink-soft text-sm">
                  <HelpCircle className="w-8 h-8 mb-3 opacity-40" />
                  لم يشمل هذا التقويم مهارات التاريخ
                </div>
              )}
              {geoSkills.length > 0 ? (
                <Radar skills={geoSkills} color="#1f7a5c" label="مهارات الجغرافيا" />
              ) : (
                <div className="flex flex-col items-center justify-center py-14 text-ink-soft text-sm">
                  <HelpCircle className="w-8 h-8 mb-3 opacity-40" />
                  لم يشمل هذا التقويم مهارات الجغرافيا
                </div>
              )}
            </div>

            {/* skill bars list */}
            <div className="grid md:grid-cols-2 gap-x-10 gap-y-3 mt-6">
              {diag.skills.map((s) => {
                const chip = statusChip(s);
                return (
                  <div key={s.name + s.sujet} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-ink w-40 shrink-0 truncate">{s.name}</span>
                    <div className="flex-1 h-2.5 bg-cream rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${s.sujet === 'histoire' ? 'bg-terra' : 'bg-leaf'} bar-grow`}
                        style={{ width: `${s.percent}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${chip.cls}`}>{chip.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* strengths / weaknesses */}
        <div className="grid md:grid-cols-2 gap-5">
          <Reveal>
            <div className="bg-white rounded-[2rem] border border-line p-7 h-full">
              <h3 className="font-display font-extrabold text-xl text-ink mb-5 flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-leaf-soft text-leaf flex items-center justify-center"><TrendingUp className="w-5 h-5" /></span>
                {personal ? 'نقاط قوتي' : 'مكتسبات متحكَّم فيها'}
              </h3>
              <ul className="space-y-3">
                {diag.strengths.length > 0 ? diag.strengths.map((s) => (
                  <li key={s.name + s.sujet} className="flex items-start gap-2.5 text-sm text-ink">
                    <CheckCircle2 className="w-5 h-5 text-leaf shrink-0 mt-0.5" />
                    <span><b>{s.name}</b> <span className="text-ink-soft">({s.sujet === 'histoire' ? 'تاريخ' : 'جغرافيا'} — {s.percent}%)</span></span>
                  </li>
                )) : (
                  <li className="text-sm text-ink-soft">لم تتحدد مهارات متقنة بعد — ركز على خطة الدعم أدناه.</li>
                )}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="bg-white rounded-[2rem] border border-line p-7 h-full">
              <h3 className="font-display font-extrabold text-xl text-ink mb-5 flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-terra-soft text-terra flex items-center justify-center"><TrendingDown className="w-5 h-5" /></span>
                {personal ? 'مهارات تحتاج إلى دعم' : 'مواطن الضعف'}
              </h3>
              <ul className="space-y-3">
                {diag.weaknesses.length > 0 ? diag.weaknesses.map((s) => (
                  <li key={s.name + s.sujet} className="flex items-start gap-2.5 text-sm text-ink">
                    <XCircle className="w-5 h-5 text-terra shrink-0 mt-0.5" />
                    <span><b>{s.name}</b> <span className="text-ink-soft">({s.sujet === 'histoire' ? 'تاريخ' : 'جغرافيا'} — {s.percent}%)</span></span>
                  </li>
                )) : (
                  <li className="text-sm text-ink-soft">لا توجد تعثرات واضحة — استمر في التثبيت.</li>
                )}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* ===== تصحيح الإجابات ===== */}
        {diag.review.length > 0 && (
          <Reveal>
            <div className="bg-white rounded-[2rem] border border-line shadow-[0_16px_40px_-20px_rgba(21,36,30,0.15)] overflow-hidden">
              {/* رأس القسم */}
              <button
                onClick={() => setShowReview((s) => !s)}
                className="w-full flex flex-wrap items-center justify-between gap-3 px-6 md:px-7 py-5 text-right hover:bg-cream/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-2xl bg-sky-soft text-azure dark:bg-white/10 dark:text-gold flex items-center justify-center">
                    <ListChecks className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="font-display font-extrabold text-xl text-ink">تصحيح الإجابات</h2>
                    <p className="text-xs t-muted mt-0.5">راجع كل سؤال: إجابتك، الجواب الصحيح، والتعليل</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-black px-2.5 py-1.5 rounded-full bg-leaf-soft text-leaf">{diag.correct} صحيحة</span>
                  <span className="text-[11px] font-black px-2.5 py-1.5 rounded-full bg-terra-soft text-terra">{diag.wrong} خاطئة</span>
                  {diag.unanswered > 0 && (
                    <span className="text-[11px] font-black px-2.5 py-1.5 rounded-full surface-tint t-muted">{diag.unanswered} بدون إجابة</span>
                  )}
                  <ChevronLeft className={`w-5 h-5 t-muted transition-transform duration-300 ${showReview ? '-rotate-90' : 'rotate-0'}`} />
                </div>
              </button>

              {showReview && (
                <div className="border-t border-line">
                  {/* فلاتر */}
                  <div className="flex flex-wrap gap-2 px-6 md:px-7 py-4 bg-cream/40">
                    {(
                      [
                        { k: 'all' as const, label: `الكل (${diag.review.length})` },
                        { k: 'wrong' as const, label: `الأخطاء (${diag.wrong + diag.unanswered})` },
                        { k: 'correct' as const, label: `الصحيحة (${diag.correct})` },
                      ]
                    ).map((f) => (
                      <button
                        key={f.k}
                        onClick={() => setReviewFilter(f.k)}
                        className={`px-4 py-2 rounded-full text-xs font-black transition-all ${
                          reviewFilter === f.k ? 'bg-azure text-white shadow-md' : 'surface t-muted hover:text-azure'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* قائمة الأسئلة */}
                  <div className="divide-y divide-line">
                    {diag.review
                      .filter((r) =>
                        reviewFilter === 'all' ? true : reviewFilter === 'correct' ? r.ok : !r.ok
                      )
                      .map((r) => (
                        <div key={r.index} className="px-6 md:px-7 py-5">
                          {/* رأس السؤال */}
                          <div className="flex items-start gap-3 mb-3">
                            <span
                              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                                r.ok ? 'bg-leaf text-white' : r.answered ? 'bg-terra text-white' : 'bg-cream text-ink-soft'
                              }`}
                            >
                              {r.ok ? <CheckCircle2 className="w-4 h-4" /> : r.answered ? <XCircle className="w-4 h-4" /> : r.index}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm leading-relaxed text-ink">
                                <span className="t-muted font-black">{r.index}. </span>
                                {r.question}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                  r.sujet === 'histoire' ? 'bg-terra-soft text-terra' : 'bg-leaf-soft text-leaf'
                                }`}>
                                  {r.sujet === 'histoire' ? 'تاريخ' : 'جغرافيا'}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md surface-tint t-muted">{r.competence}</span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                  r.difficulty === 'easy' ? 'bg-leaf-soft text-leaf'
                                  : r.difficulty === 'medium' ? 'bg-amber-soft text-amber-deep'
                                  : 'bg-terra-soft text-terra'
                                }`}>
                                  {DIFFICULTY_LABEL[r.difficulty]}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* الإجابات */}
                          <div className="grid sm:grid-cols-2 gap-2.5 pr-11">
                            {/* إجابة التلميذ */}
                            <div className={`rounded-xl border-2 p-3 ${
                              r.ok ? 'border-leaf/40 bg-leaf-soft/50'
                              : r.answered ? 'border-terra/40 bg-terra-soft/50'
                              : 'border-line bg-cream/50'
                            }`}>
                              <div className="text-[10px] font-black t-muted mb-1">إجابتك</div>
                              <div className={`text-[13px] font-bold leading-relaxed ${
                                r.ok ? 'text-leaf' : r.answered ? 'text-terra' : 't-muted'
                              }`}>
                                {r.userText ?? '— لم تُجب —'}
                              </div>
                            </div>

                            {/* الجواب الصحيح */}
                            <div className="rounded-xl border-2 border-leaf/40 bg-leaf-soft/50 p-3">
                              <div className="text-[10px] font-black text-leaf mb-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> الجواب الصحيح
                              </div>
                              <div className="text-[13px] font-bold leading-relaxed text-leaf">{r.correctText}</div>
                            </div>
                          </div>

                          {/* التعليل */}
                          {r.explain && (
                            <div className="mt-2.5 mr-11 p-3 rounded-xl surface-tint text-[12.5px] leading-relaxed t-muted">
                              <b className="text-azure dark:text-gold">التعليل: </b>{r.explain}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        )}

        {/* diagnosis narrative + recommendations */}
        <div className="grid md:grid-cols-2 gap-5">
          <Reveal>
            <div className="bg-white rounded-[2rem] border border-line p-7 h-full">
              <h3 className="font-display font-extrabold text-xl text-ink mb-5 flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-sky-soft text-azure dark:bg-white/10 dark:text-gold flex items-center justify-center"><Brain className="w-5 h-5" /></span>
                {personal ? 'تشخيص مستواي' : 'التشخيص التربوي'}
              </h3>
              <div className="space-y-4">
                {diag.diagnosis.map((d, i) => (
                  <div key={i} className="relative p-4 rounded-2xl surface-tint pr-10">
                    <Quote className="w-5 h-5 text-azure/40 dark:text-gold/40 absolute right-4 top-4" />
                    <p className="text-sm leading-relaxed t-muted">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="bg-white rounded-[2rem] border border-line p-7 h-full flex flex-col">
              <h3 className="font-display font-extrabold text-xl text-ink mb-4 flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-gold-soft text-gold-deep flex items-center justify-center"><BookOpenCheck className="w-5 h-5" /></span>
                التوصيات
              </h3>
              <p className="text-sm font-bold text-ink mb-3">أوصي بمراجعة:</p>
              <ul className="space-y-2.5 flex-1">
                {diag.recommendations.map((r) => (
                  <li key={r} className="flex items-start gap-2.5 text-sm t-muted">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold mt-2 shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => document.getElementById('support-plan')?.scrollIntoView({ behavior: 'smooth' })}
                className="mt-5 w-full btn-gold px-5 py-3.5 rounded-2xl font-display font-extrabold inline-flex items-center justify-center gap-2"
              >
                <Target className="w-4.5 h-4.5 w-5 h-5" />
                ابدأ خطة الدعم
              </button>
            </div>
          </Reveal>
        </div>

        {/* support plan */}
        <Reveal>
          <div id="support-plan" className="bg-forest text-paper rounded-[2rem] p-8 relative overflow-hidden shadow-2xl shadow-forest/30">
            <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-amber/10 blur-3xl" />
            <h2 className="font-display font-extrabold text-2xl mb-2 relative">{personal ? 'خطة تطوير مستواك' : 'خطة الدعم المقترحة'}</h2>
            <p className="text-paper/60 text-sm mb-7 relative">{personal ? 'مبنية على أخطائي الفعلية في هذا التقويم' : 'مولّدة تلقائياً حسب تعثراتك الفعلية في هذا الاختبار'}</p>
            <div className="space-y-6 relative">
              {diag.plan.map((w, i) => (
                <div key={w.week} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-2xl bg-amber text-ink font-display font-black flex items-center justify-center shadow-lg shadow-amber/30">
                      {i + 1}
                    </div>
                    {i < diag.plan.length - 1 && <div className="w-0.5 flex-1 bg-paper/15 my-1" />}
                  </div>
                  <div className="pb-2">
                    <div className="text-xs font-black text-amber mb-1">{w.week}</div>
                    <h4 className="font-display font-extrabold text-lg mb-2">{w.title}</h4>
                    <ul className="space-y-1.5">
                      {w.items.map((it) => (
                        <li key={it} className="text-sm text-paper/70 flex items-start gap-2">
                          <Target className="w-4 h-4 text-amber shrink-0 mt-0.5" />
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {personal && diag.weaknesses.length > 0 && (
              <div className="relative mt-8 pt-6 border-t border-paper/10">
                <h3 className="font-display font-extrabold text-lg mb-4">أنشطة دعم لكل مهارة متعثرة</h3>
                <div className="space-y-3">
                  {diag.weaknesses.slice(0, 4).map((w) => (
                    <div key={w.name + w.sujet} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <div className="text-sm font-black mb-3">
                        المهارة: <span className="text-amber">{w.name}</span>
                        <span className="text-paper/50 font-bold"> ({w.sujet === 'histoire' ? 'تاريخ' : 'جغرافيا'})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {['نشاط دعم موجه', 'درس مرتبط بالمهارة', 'تمرين تدريبي قصير', 'إعادة التقويم'].map((a, i) => (
                          <span key={a} className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-paper/10 text-paper/85">
                            <span className="w-4 h-4 rounded-md bg-amber text-ink font-black text-[10px] flex items-center justify-center">{i + 1}</span>
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Reveal>

        {/* actions */}
        <Reveal>
          <div className="grid sm:grid-cols-2 gap-4">
            <button onClick={onRetest} className="btn-gold rounded-2xl px-6 py-5 font-display font-extrabold text-lg flex items-center justify-center gap-2.5">
              <RefreshCcw className="w-5 h-5" />
              إعادة التقويم بعد الدعم
            </button>
            <button onClick={onHome} className="rounded-2xl border-2 border-line bg-white px-6 py-5 font-display font-extrabold text-lg text-ink flex items-center justify-center gap-2.5 hover:border-forest/40 transition-colors">
              <ChevronLeft className="w-5 h-5 rotate-180" />
              {personal ? 'العودة إلى التقويم الشخصي' : isRetest ? 'العودة إلى الرئيسية' : 'مراجعة المستويات'}
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <button
              onClick={downloadResult}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-line bg-white text-ink font-bold text-sm hover:border-azure/50 transition-colors"
            >
              <Download className="w-4 h-4 text-azure dark:text-gold" />
              تنزيل النتيجة
            </button>
            <button
              onClick={copyResult}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-line bg-white text-ink font-bold text-sm hover:border-azure/50 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-leaf" /> : <Copy className="w-4 h-4 text-azure dark:text-gold" />}
              {copied ? 'تم النسخ' : 'نسخ النتيجة'}
            </button>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
