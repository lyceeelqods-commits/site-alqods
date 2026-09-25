import { useEffect, useMemo, useState } from 'react';
import {
  Compass, GraduationCap, Globe2, ScrollText, Layers,
  CheckCircle2, ChevronDown, Star, Clock,
  Sparkles, History, TrendingUp, ClipboardCheck, PenLine, Play, IdCard,
} from 'lucide-react';
import Reveal from '../components/Reveal';
import LogoMark from '../components/LogoMark';
import { TopoLines, Chip } from '../components/ui';
import { levels } from '../data/levels';
import { STAGES, TRACKS, tracksByStage } from '../data/tracks';
import {
  getDifficulty, diagnosisFromRecord,
  type Diagnosis, type Difficulty,
} from '../lib/diagnosis';
import {
  saveRecord, studentHistory, loadStudent, saveStudentIdentity, clearStudentIdentity,
  studentDisplayName, formatDate,
  DOMAIN_LABEL, KIND_LABEL,
  type Domain, type AssessmentKind, type StudentRecord,
} from '../lib/store';
import TestEngine from '../components/TestEngine';
import ResultPage from '../components/ResultPage';
import AnimatedDemo from '../components/AnimatedDemo';
import DiagnosticLanding from '../components/DiagnosticLanding';
import type { PageKey } from '../components/Header';

type Mode = 'home' | 'test' | 'result';

const KINDS: { key: AssessmentKind; title: string; desc: string; icon: any }[] = [
  { key: 'diagnostic', title: 'تقويم تشخيصي', desc: 'قياس شامل للمكتسبات المرجعية قبل التعلمات (كل أسئلة المجال)', icon: ClipboardCheck },
  { key: 'skills', title: 'تقويم المهارات', desc: 'سؤال لكل مهارة مقيَّمة لرؤية خريطة مهاراتك (حتى 10 أسئلة)', icon: Star },
  { key: 'review', title: 'اختبار شامل', desc: 'عينة مختلطة من بنك الأسئلة لقياس مستواك الكلي (10 أسئلة)', icon: History },
];

function domainCount(level: (typeof levels)[number], domain: Domain) {
  const qs = domain === 'both' ? level.questions : level.questions.filter((q) => q.sujet === domain);
  const diff: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
  qs.forEach((q) => (diff[getDifficulty(q)] += 1));
  return { count: qs.length, pts: qs.reduce((s, q) => s + q.points, 0), diff };
}

const shortLabel = (l?: (typeof levels)[number]) => (l ? l.label.replace(' — ', ' ') : '');

const STEPS_META: { n: 1 | 2 | 3; label: string; panelTitle: string; panelHint: string }[] = [
  { n: 1, label: 'المسلك', panelTitle: 'اختر مستواك ومسلكك', panelHint: 'سيُحمّل بنك أسئلة ومهارات هذا المسلك فقط' },
  { n: 2, label: 'المجال', panelTitle: 'ما المجال الذي تريد تقويمه؟', panelHint: 'التاريخ، الجغرافيا، أو المجالان معاً في اختبار واحد' },
  { n: 3, label: 'النوع', panelTitle: 'أي نوع من التقويم تريد؟', panelHint: 'شامل للمكتسبات، خريطة مهارات، أو عينة سريعة' },
];

const DOMAINS: { key: Domain; title: string; icon: any; accent: string; desc: string }[] = [
  { key: 'histoire', title: 'التاريخ', icon: ScrollText, accent: 'bg-terra-soft text-terra', desc: '10 أسئلة · 10 نقاط' },
  { key: 'geographie', title: 'الجغرافيا', icon: Globe2, accent: 'bg-leaf-soft text-leaf', desc: '10 أسئلة · 10 نقاط' },
  { key: 'both', title: 'المجالان', icon: Layers, accent: 'bg-[#dcf5e4] text-[#0f6b48] dark:bg-white/10 dark:text-[#4ade80]', desc: '20 سؤالاً · 20 نقطة' },
];

/** شريحة معلومة صغيرة في الملخص الحيّ */
function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1.5 rounded-lg surface-tint">
      <span className="t-muted font-bold">{label}:</span>
      <span>{value}</span>
    </span>
  );
}

/** بطاقة هوية التلميذ: الاسم + رقم مسار + القسم */
function StudentIdentityCard({
  name, massar, clazz, draft, setDraft, onSave, onReset,
}: {
  name: string;
  massar: string;
  clazz: string;
  draft: { name: string; massar: string; clazz: string };
  setDraft: (v: { name: string; massar: string; clazz: string }) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  const filled = name && massar;
  if (filled) {
    return (
      <div className="flex items-center gap-3 p-3 pr-4 rounded-2xl bg-white dark:bg-white/5 border-2 border-[#e9dcc3] dark:border-[#4a3d26]">
        <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d9a441] to-[#8c5f1f] text-white flex items-center justify-center font-display font-black shrink-0">
          {name.trim().charAt(0)}
        </span>
        <div className="min-w-0">
          <div className="font-display font-extrabold text-sm leading-tight truncate max-w-[150px]">{name}</div>
          <div className="text-[10.5px] font-bold t-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span className="font-mono tracking-wide">R{massar}</span>
            {clazz && <span className="text-[#8c5f1f] dark:text-[#e0b256]">· {clazz}</span>}
          </div>
        </div>
        <button onClick={onReset} className="text-[10.5px] font-bold t-muted hover:text-terra transition-colors shrink-0 mr-1">تعديل</button>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-white dark:bg-white/5 border-2 border-dashed border-[#d9c9a5] dark:border-[#4a3d26]">
      <input
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        placeholder="اسم التلميذ(ة)"
        className="px-3 py-2 rounded-xl border-2 border-[var(--c-border)] bg-transparent focus:border-[#b5832a] focus:outline-none text-[12px] font-bold col-span-2"
      />
      <input
        value={draft.massar}
        onChange={(e) => setDraft({ ...draft, massar: e.target.value.replace(/[^0-9A-Za-z]/g, '').slice(0, 10) })}
        onKeyDown={(e) => e.key === 'Enter' && onSave()}
        placeholder="رقم مسار"
        className="px-3 py-2 rounded-xl border-2 border-[var(--c-border)] bg-transparent focus:border-[#b5832a] focus:outline-none text-[12px] font-bold font-mono"
        dir="ltr"
      />
      <input
        value={draft.clazz}
        onChange={(e) => setDraft({ ...draft, clazz: e.target.value })}
        onKeyDown={(e) => e.key === 'Enter' && onSave()}
        placeholder="القسم (اختياري)"
        className="px-3 py-2 rounded-xl border-2 border-[var(--c-border)] bg-transparent focus:border-[#b5832a] focus:outline-none text-[12px] font-bold"
      />
      <button
        onClick={onSave}
        disabled={!draft.name.trim() || !draft.massar.trim()}
        className="col-span-2 py-2.5 rounded-xl bg-[#8c5f1f] text-white text-xs font-black hover:bg-[#a06f22] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        حفظ بياناتي
      </button>
    </div>
  );
}

const masteryTone = (p: number) =>
  p >= 80 ? { label: 'ممتاز', cls: 'bg-leaf-soft text-leaf' } :
  p >= 60 ? { label: 'جيد', cls: 'bg-leaf-soft text-leaf' } :
  p >= 50 ? { label: 'متوسط', cls: 'bg-amber-soft text-amber-deep' } :
  { label: 'يحتاج دعماً', cls: 'bg-terra-soft text-terra' };

/* ---------- donut الملف الشخصي ---------- */
function ProfileDonut({ value, has }: { value: number; has: boolean }) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGo(true), 350);
    return () => clearTimeout(t);
  }, []);
  const r = 40;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg width={96} height={96} className="-rotate-90">
        <circle cx={48} cy={48} r={r} fill="none" stroke="var(--c-border)" strokeWidth={9} />
        {has && (
          <circle
            cx={48} cy={48} r={r} fill="none" stroke="#b5832a" strokeWidth={9} strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c - (c * (go ? value : 0)) / 100}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-black text-xl text-azure dark:text-gold">{has ? `${value}%` : '—'}</span>
        <span className="text-[9px] font-bold t-muted">نسبة التحكم</span>
      </div>
    </div>
  );
}

/* ---------- رسم التطور ---------- */
function ProgressChart({ history }: { history: StudentRecord[] }) {
  const pts = history.slice(-8);
  const W = 640;
  const H = 230;
  const P = 42;
  const n = pts.length;
  const x = (i: number) => (n === 1 ? W / 2 : P + (i * (W - 2 * P)) / (n - 1));
  const y = (p: number) => H - P - (p / 100) * (H - 2 * P);
  const line = pts.map((r, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(r.percent)}`).join(' ');
  const area = n > 1 ? `${line} L${x(n - 1)},${H - P} L${x(0)},${H - P} Z` : '';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}>
          <line x1={P} x2={W - P} y1={y(g)} y2={y(g)} stroke="var(--c-border)" strokeWidth={1} strokeDasharray="4 4" />
          <text x={W - P + 8} y={y(g) + 4} fontSize={10} fill="var(--c-muted)" fontWeight={700}>{g}%</text>
        </g>
      ))}
      {area && <path d={area} fill="rgba(181,131,42,0.14)" />}
      {n > 1 && <path d={line} fill="none" stroke="#b5832a" strokeWidth={3} strokeLinecap="round" />}
      {pts.map((r, i) => (
        <g key={r.id}>
          <circle cx={x(i)} cy={y(r.percent)} r={7} fill="#d9a441" stroke="#fff" strokeWidth={2.5} />
          <text x={x(i)} y={y(r.percent) - 14} fontSize={12} fontWeight={800} fill="var(--c-text)" textAnchor="middle">{r.percent}%</text>
          <text x={x(i)} y={H - P + 18} fontSize={10} fontWeight={700} fill="var(--c-muted)" textAnchor="middle">تقويم {i + 1}</text>
        </g>
      ))}
    </svg>
  );
}

/* ==================== الصفحة ==================== */
export default function PersonalAssessmentPage({ onNavigate }: { onNavigate: (p: PageKey) => void }) {
  void onNavigate;
  const [mode, setMode] = useState<Mode>('home');
  const [wiz, setWiz] = useState<1 | 2 | 3>(1);
  const [trackId, setTrackId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [domain, setDomain] = useState<Domain>('both');
  const [variant, setVariant] = useState<AssessmentKind>('diagnostic');
  const [student, setStudent] = useState(() => loadStudent());
  const [studentDraft, setStudentDraft] = useState(() => loadStudent());
  const [diag, setDiag] = useState<Diagnosis | null>(null);
  const [isRetest, setIsRetest] = useState(false);
  const [prev, setPrev] = useState<{ score: number; percent: number } | null>(null);
  const [viewRec, setViewRec] = useState<StudentRecord | null>(null);
  const [trackTab, setTrackTab] = useState<'progress' | 'log'>('progress');
  const [bump, setBump] = useState(0);

  const track = TRACKS.find((t) => t.id === trackId);
  const displayName = studentDisplayName(student);
  const history = useMemo(() => studentHistory(displayName), [displayName, bump, mode]);
  const last = history.length ? history[history.length - 1] : null;
  const level = levels.find((l) => l.id === levelId);
  const di = level ? domainCount(level, domain) : null;
  const identityReady = !!(student.name.trim() && student.massar.trim());

  const saveStudent = () => {
    const clean = {
      name: studentDraft.name.trim(),
      massar: studentDraft.massar.trim().toUpperCase(),
      clazz: studentDraft.clazz.trim(),
    };
    setStudent(clean);
    saveStudentIdentity(clean);
    setBump((b) => b + 1);
  };
  const resetStudent = () => {
    setStudentDraft({ name: '', massar: '', clazz: '' });
    clearStudentIdentity();
    setBump((b) => b + 1);
  };

  const startTest = () => {
    setMode('test');
    window.scrollTo({ top: 0 });
  };

  const startRetest = (lvId?: string, dom?: Domain) => {
    if (lvId && levels.some((l) => l.id === lvId)) setLevelId(lvId);
    if (dom) setDomain(dom);
    setVariant('review');
    setIsRetest(true);
    setViewRec(null);
    setMode('test');
    window.scrollTo({ top: 0 });
  };

  const backHome = () => {
    setMode('home');
    setDiag(null);
    setViewRec(null);
    setPrev(null);
    setIsRetest(false);
    setLevelId('');
    window.scrollTo({ top: 0 });
  };

  /* ---------- وضع الاختبار ---------- */
  if (mode === 'test' && level) {
    return (
      <TestEngine
        levelId={level.id}
        code={displayName}
        domain={domain}
        variant={variant}
        retest={isRetest}
        onComplete={(d) => {
          saveRecord({
            code: displayName,
            levelId: level.id,
            levelLabel: `${track?.title ?? level.label} — ${DOMAIN_LABEL[domain]}`,
            massar: student.massar,
            clazz: student.clazz || undefined,
            historyScore: d.historyScore,
            geoScore: d.geoScore,
            historyMax: d.historyMax,
            geoMax: d.geoMax,
            totalScore: d.totalScore,
            maxTotal: d.maxTotal,
            percent: d.percent,
            correct: d.correct,
            wrong: d.wrong,
            unanswered: d.unanswered,
            skills: d.skills,
            support: d.support,
            domain,
            kind: variant,
            isRetest: isRetest || undefined,
            previousScore: isRetest && prev ? prev.score : undefined,
          });
          setDiag(d);
          setBump((b) => b + 1);
          setMode('result');
          window.scrollTo({ top: 0 });
        }}
        onExit={() => {
          setMode('home');
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  /* ---------- وضع النتيجة ---------- */
  if (mode === 'result' && (diag || viewRec)) {
    const d = viewRec ? diagnosisFromRecord(viewRec) : (diag as Diagnosis);
    const label = viewRec ? viewRec.levelLabel : `${track?.title ?? level?.label ?? ''} — ${DOMAIN_LABEL[domain]}`;
    const date = viewRec ? viewRec.date : new Date().toISOString().split('T')[0];
    return (
      <ResultPage
        code={displayName}
        levelLabel={label}
        date={date}
        isRetest={viewRec ? !!viewRec.isRetest : isRetest}
        previousScore={viewRec?.previousScore ?? prev?.score}
        previousPercent={viewRec ? undefined : prev?.percent}
        diag={d}
        personal
        onRetest={() => startRetest(viewRec ? viewRec.levelId : levelId, viewRec?.domain ?? domain)}
        onHome={backHome}
      />
    );
  }

  const strengthSkills = last ? last.skills.filter((s) => s.status === 'mastery').slice(0, 3) : [];
  const weakSkills = last ? last.skills.filter((s) => s.status === 'weak').slice(0, 3) : [];
  const doneCount = (level ? 1 : 0) + 2; // المجال والنوع لهما قيم افتراضية دائماً
  const ready = !!level;
  const trackFill = ready ? 100 : wiz === 1 ? 8 : 50;

  /* ---------- وضع الرئيسية: بوابة التقويم الجديدة ---------- */
  if (mode === 'home') {
    return (
      <DiagnosticLanding
        initialName={student.name}
        initialClass={student.clazz}
        onProfile={(p) => setStudent((s) => ({ ...s, name: p.name, clazz: p.clazz }))}
        onStart={(id: string) => {
          setLevelId(id);
          setDomain('both');
          setVariant('diagnostic');
          setMode('test');
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  /* ---------- وضع الرئيسية (احتياطي): مساحة موحّدة ---------- */
  return (
    <div className="tq-page">
      {/* ================= HERO مدمج ================= */}
      <section className="tq-hero relative overflow-hidden text-white pb-24">
        <div className="absolute inset-0">
          <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-[#c99a3f]/25 blur-[130px]" />
          <div className="absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full bg-[#e7bd63]/20 blur-[120px]" />
          <TopoLines className="absolute -left-40 -top-40 w-[700px] h-[700px] opacity-80" />
        </div>
        <div className="relative max-w-5xl mx-auto px-5 md:px-6 pt-32 md:pt-40 text-center">
          <Reveal>
            <LogoMark className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-6 drop-shadow-[0_18px_34px_rgba(12,35,64,0.55)]" />
            <h1 className="font-display font-black text-4xl md:text-5xl leading-[1.3]">
              التقويم الشخصي
              <span className="block text-gold mt-2 text-2xl md:text-3xl">في مادة الاجتماعيات</span>
            </h1>
            <p className="text-base md:text-lg text-white/65 leading-relaxed max-w-xl mx-auto mt-5">
              اكتشف مستواك، حدد نقاط قوتك، وطوّر مهاراتك في التاريخ والجغرافيا.
              <span className="block mt-2 text-white/50 text-base">
                تقويم شخصي تفاعلي: بنك أسئلة لكل مستوى، تشخيص فوري، وخريطة مجالية للتوطين.
              </span>
            </p>
            <div className="mt-6 inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-gold/40 bg-gold/10 text-gold text-sm font-bold">
              <GraduationCap className="w-5 h-5" />
              إعداد الأستاذ: عماد طليل
            </div>
          </Reveal>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5 md:px-6">
        {/* ================= العرض المتحرك (في صدر الصفحة) ================= */}
        <section id="demo" className="pt-14 pb-6">
          <Reveal className="text-center mb-8">
            <Chip tone="gold">
              <Play className="w-4 h-4" />
              عرض متحرك
            </Chip>
            <h2 className="font-display font-black text-3xl mt-4">شاهد التجربة كاملة في ثوانٍ</h2>
            <p className="t-muted mt-3 max-w-xl mx-auto text-sm">
              من اختيار المستوى إلى خطة الدعم — عرض متحرك يتجدد تلقائياً، مرّر فوقه للإيقاف المؤقت.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="max-w-3xl mx-auto">
              <AnimatedDemo />
            </div>
          </Reveal>
          <p className="text-center text-[11px] t-muted mt-6">
            تقويماتك تُخزن محلياً في متصفحك فقط — لا تُرسل إلى أي خادم.
          </p>
        </section>

        {/* ================= مساحة تقويمي (تصميم تفاعلي جديد) ================= */}
        <section id="start" className="relative z-10 pt-8">
          <Reveal>
            <div className="tq-card surface rounded-[2.5rem] overflow-hidden border-2 border-[#e9dcc3] dark:border-[#3b3222]">

              {/* ===== شريط التقدم العلوي ===== */}
              <div className="px-6 md:px-8 pt-6 pb-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#d9a441] to-[#8c5f1f] text-white flex items-center justify-center shadow-lg shadow-[#8c5f1f]/30">
                      <PenLine className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="font-display font-extrabold text-lg leading-tight">مساحة تقويمي</div>
                      <div className="text-[11px] t-muted mt-0.5">{ready ? 'كل شيء جاهز — انقر ابدأ' : `${doneCount} من خطوتين مكتملة`}</div>
                    </div>
                  </div>
                  <StudentIdentityCard
                    name={student.name}
                    massar={student.massar}
                    clazz={student.clazz}
                    draft={studentDraft}
                    setDraft={setStudentDraft}
                    onSave={saveStudent}
                    onReset={resetStudent}
                  />
                </div>

                {/* مسار الخطوات */}
                <div className="relative flex items-center">
                  <div className="absolute inset-x-4 top-4 h-1 bg-[var(--c-border)] rounded-full" />
                  <div
                    className="absolute right-4 top-4 h-1 bg-gradient-to-l from-[#d9a441] to-[#8c5f1f] rounded-full transition-all duration-700"
                    style={{ width: `calc(${trackFill}% - 16px)` }}
                  />
                  <div className="relative flex-1 flex justify-between">
                    {STEPS_META.map((s) => {
                      const active = wiz === s.n;
                      const filled = s.n <= doneCount;
                      return (
                        <button key={s.n} onClick={() => setWiz(s.n)} className="flex flex-col items-center gap-1.5 group">
                          <span className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-300 ${
                            active
                              ? 'bg-[#8c5f1f] text-white border-[#8c5f1f] scale-110 shadow-lg shadow-[#8c5f1f]/30'
                              : filled
                              ? 'bg-[#d9a441] text-white border-[#d9a441]'
                              : 'surface bg-[var(--c-surface)] t-muted border-[var(--c-border)] group-hover:border-[#d9a441]'
                          }`}>
                            {filled && !active ? <CheckCircle2 className="w-4 h-4" /> : s.n}
                          </span>
                          <span className={`text-[10.5px] font-black transition-colors ${active ? 'text-[#8c5f1f] dark:text-[#e0b256]' : 't-muted'}`}>
                            {s.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ===== لوحة الاختيار التفاعلية ===== */}
              <div className="px-6 md:px-8 pb-2">
                <div className="rounded-[1.75rem] bg-[var(--c-tint)] dark:bg-white/[0.04] p-5 md:p-6 min-h-[228px]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-display font-extrabold text-base">{STEPS_META[wiz - 1].panelTitle}</div>
                      <div className="text-[11px] t-muted mt-0.5">{STEPS_META[wiz - 1].panelHint}</div>
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1.5 rounded-full bg-[#f6ead3] text-[#8c5f1f] dark:bg-white/10 dark:text-[#e0b256]">
                      {wiz} / 3
                    </span>
                  </div>

                  {/* الخطوة 1: المستوى — قائمة اختيارات + هوية التلميذ */}
                  {wiz === 1 && (
                    <div key="p1" className="anim-pop space-y-5">
                      {/* بطاقة التلميذ */}
                      <div className={`rounded-2xl border-2 p-4 ${
                        identityReady
                          ? 'bg-leaf-soft/60 border-leaf/30'
                          : 'bg-white dark:bg-white/5 border-dashed border-[#d9c9a5] dark:border-[#4a3d26]'
                      }`}>
                        <div className="flex items-center gap-2 mb-3">
                          <IdCard className="w-4 h-4 text-[#8c5f1f] dark:text-[#e0b256]" />
                          <span className="text-xs font-black text-[#8c5f1f] dark:text-[#e0b256]">بيانات التلميذ(ة)</span>
                          {identityReady && (
                            <span className="mr-auto text-[10px] font-black px-2 py-0.5 rounded-full bg-leaf text-white flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> مكتمل
                            </span>
                          )}
                        </div>
                        <div className="grid sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-black t-muted mb-1.5">اسم التلميذ(ة) *</label>
                            <input
                              value={student.name}
                              onChange={(e) => setStudent({ ...student, name: e.target.value })}
                              onBlur={saveStudent}
                              placeholder="مثال: يوسف العلمي"
                              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[var(--c-border)] bg-white dark:bg-white/5 focus:border-[#b5832a] focus:outline-none text-[13px] font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-black t-muted mb-1.5">رقم مسار *</label>
                            <input
                              value={student.massar}
                              onChange={(e) => setStudent({ ...student, massar: e.target.value.replace(/[^0-9A-Za-z]/g, '').slice(0, 10) })}
                              onBlur={saveStudent}
                              placeholder="R130045678"
                              dir="ltr"
                              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[var(--c-border)] bg-white dark:bg-white/5 focus:border-[#b5832a] focus:outline-none text-[13px] font-bold font-mono text-left"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-black t-muted mb-1.5">القسم</label>
                            <input
                              value={student.clazz}
                              onChange={(e) => setStudent({ ...student, clazz: e.target.value })}
                              onBlur={saveStudent}
                              placeholder="مثال: 1باك2"
                              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[var(--c-border)] bg-white dark:bg-white/5 focus:border-[#b5832a] focus:outline-none text-[13px] font-bold"
                            />
                          </div>
                        </div>
                        {!identityReady && (
                          <p className="text-[11px] t-muted mt-2.5">
                            أدخل الاسم ورقم مسار — يُحفظان تلقائياً على هذا الجهاز فقط لربط نتائجك بسجلّك.
                          </p>
                        )}
                      </div>

                      {/* اختيار المستوى والمسلك — 8 تقويمات في 3 مراحل */}
                      <div className="space-y-6">
                        <div className="text-center">
                          <h4 className="font-display font-black text-xl mb-2">اختر مستواك ومسلكك أولًا</h4>
                          <p className="text-[12.5px] t-muted leading-relaxed max-w-2xl mx-auto">
                            ثمانية تقويمات تشخيصية مخصصة: لكل مسلك بنك أسئلة ملائم لمناهجه ومكتسباته التاريخية والجغرافية.
                            كل واحد: <b>20 سؤالًا</b>، 10 تاريخ + 10 جغرافيا، <b>60 دقيقة</b>، النقطة <b>/20</b>.
                          </p>
                        </div>

                        {STAGES.map((st) => (
                          <div key={st.n}>
                            {/* رأس المرحلة */}
                            <div className="flex items-center gap-3 mb-3">
                              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#d9a441] to-[#8c5f1f] text-white font-display font-black text-sm flex items-center justify-center shrink-0">
                                {st.n}
                              </span>
                              <div>
                                <h5 className="font-display font-black text-lg leading-tight">{st.title}</h5>
                                <p className="text-[11px] t-muted">{st.hint}</p>
                              </div>
                            </div>

                            {/* بطاقات المسالك */}
                            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                              {tracksByStage(st.n).map((t) => {
                                const sel = trackId === t.id;
                                const popular = t.badge === 'الأكثر إجراءً';
                                return (
                                  <button
                                    key={t.id}
                                    onClick={() => { setTrackId(t.id); setLevelId(t.levelId); setWiz(2); }}
                                    className={`relative text-right rounded-2xl border-2 p-4 flex flex-col transition-all duration-300 active:scale-[0.98] ${
                                      sel
                                        ? 'border-[#b5832a] bg-white dark:bg-white/10 shadow-lg shadow-[#8c5f1f]/15'
                                        : 'surface border-[var(--c-border)] hover:border-[#d9a441] hover:-translate-y-0.5'
                                    }`}
                                  >
                                    {/* الشارة */}
                                    <div className="flex items-center justify-between mb-3">
                                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                                        popular
                                          ? 'bg-[#8c5f1f] text-white'
                                          : 'bg-leaf-soft text-leaf'
                                      }`}>
                                        {t.badge}
                                      </span>
                                      {sel && <CheckCircle2 className="w-5 h-5 text-[#b5832a]" />}
                                    </div>

                                    {/* العنوان والوصف */}
                                    <h6 className="font-display font-extrabold text-[15px] leading-snug mb-1.5">{t.title}</h6>
                                    <p className="text-[11.5px] t-muted leading-relaxed mb-3 flex-1">{t.desc}</p>

                                    {/* الوسوم */}
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                      {t.tags.map((tag) => (
                                        <span key={tag} className="text-[10px] font-bold px-2 py-1 rounded-lg surface-tint t-muted">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>

                                    {/* التذييل */}
                                    <div className="pt-3 border-t border-[var(--c-border)] flex items-center justify-between">
                                      <span className="text-[10px] font-bold t-muted flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> 60 دقيقة · /20
                                      </span>
                                      <span className="text-[11.5px] font-black text-[#8c5f1f] dark:text-[#e0b256] inline-flex items-center gap-1">
                                        ابدأ التقويم <ChevronDown className="w-3.5 h-3.5 rotate-90" />
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* الخطوة 2: المجال */}
                  {wiz === 2 && level && (
                    <div key="p2" className="anim-pop grid sm:grid-cols-3 gap-3">
                      {DOMAINS.map((d) => {
                        const info = domainCount(level, d.key);
                        const sel = domain === d.key;
                        return (
                          <button
                            key={d.key}
                            onClick={() => { setDomain(d.key); setWiz(3); }}
                            className={`group relative text-right rounded-2xl border-2 p-4 transition-all duration-300 active:scale-[0.97] ${
                              sel
                                ? 'border-[#b5832a] bg-white dark:bg-white/10 shadow-lg shadow-[#8c5f1f]/15'
                                : 'surface border-[var(--c-border)] hover:border-[#d9a441] hover:-translate-y-0.5'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className={`w-10 h-10 rounded-xl ${d.accent} flex items-center justify-center`}>
                                <d.icon className="w-5 h-5" />
                              </span>
                              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                sel ? 'border-[#b5832a] bg-[#b5832a]' : 'border-[var(--c-border)]'
                              }`}>
                                {sel && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </span>
                            </div>
                            <div className="text-sm font-extrabold mb-0.5">{d.title}</div>
                            <div className="text-[11px] font-bold t-muted">{info.count} أسئلة · {info.pts} نقطة</div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* الخطوة 3: النوع */}
                  {wiz === 3 && level && (
                    <div key="p3" className="anim-pop grid sm:grid-cols-3 gap-3">
                      {KINDS.map((k) => {
                        const sel = variant === k.key;
                        return (
                          <button
                            key={k.key}
                            onClick={() => setVariant(k.key)}
                            className={`group relative text-right rounded-2xl border-2 p-4 transition-all duration-300 active:scale-[0.97] ${
                              sel
                                ? 'border-[#b5832a] bg-white dark:bg-white/10 shadow-lg shadow-[#8c5f1f]/15'
                                : 'surface border-[var(--c-border)] hover:border-[#d9a441] hover:-translate-y-0.5'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                sel ? 'bg-gradient-to-br from-[#d9a441] to-[#8c5f1f] text-white' : 'bg-[#f6ead3] text-[#8c5f1f] dark:bg-white/10 dark:text-[#e0b256]'
                              }`}>
                                <k.icon className="w-5 h-5" />
                              </span>
                              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                sel ? 'border-[#b5832a] bg-[#b5832a]' : 'border-[var(--c-border)]'
                              }`}>
                                {sel && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </span>
                            </div>
                            <div className="text-sm font-extrabold mb-1">{k.title}</div>
                            <div className="text-[11px] t-muted leading-relaxed">{k.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ===== أزرار التنقل + الملخص الحيّ ===== */}
              <div className="px-6 md:px-8 py-5 mt-4 border-t border-[var(--c-border)] bg-[var(--c-tint)]/60 dark:bg-white/[0.03]">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* الملخص الحيّ */}
                  <div className="flex flex-wrap items-center gap-2 flex-1">
                    {track ? <Pill label="المسلك" value={track.title} /> : level && <Pill label="المستوى" value={shortLabel(level)} />}
                    {level && <Pill label="المجال" value={DOMAIN_LABEL[domain]} />}
                    <Pill label="النوع" value={KIND_LABEL[variant]} />
                    {di && (
                      <>
                        <Pill label="الأسئلة" value={`${di.count}`} />
                        <Pill label="النقاط" value={`${di.pts}`} />
                        <span className="text-[11px] font-black px-2.5 py-1.5 rounded-lg bg-leaf-soft text-leaf">سهل {di.diff.easy}</span>
                        <span className="text-[11px] font-black px-2.5 py-1.5 rounded-lg bg-amber-soft text-amber-deep">متوسط {di.diff.medium}</span>
                        <span className="text-[11px] font-black px-2.5 py-1.5 rounded-lg bg-terra-soft text-terra">صعب {di.diff.hard}</span>
                      </>
                    )}
                  </div>

                  {/* أزرار */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {wiz > 1 && (
                      <button
                        onClick={() => setWiz((w) => (w - 1) as 1 | 2 | 3)}
                        className="px-5 py-3.5 rounded-2xl border-2 border-[var(--c-border)] surface text-sm font-extrabold hover:border-[#d9a441] transition-colors"
                      >
                        السابق
                      </button>
                    )}
                    {ready ? (
                      <button onClick={startTest} className="btn-primary px-9 py-3.5 rounded-2xl font-display font-extrabold text-base inline-flex items-center gap-2.5">
                        <Compass className="w-5 h-5" />
                        ابدأ التقويم
                      </button>
                    ) : (
                      <button
                        onClick={() => setWiz((w) => (w + 1) as 1 | 2 | 3)}
                        disabled={wiz === 1 ? !level : wiz === 2 ? !domain : false}
                        className="btn-primary px-8 py-3.5 rounded-2xl font-display font-extrabold inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        الخطوة الموالية
                        <ChevronDown className="w-4 h-4 -rotate-90" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* ===== ملفي (شريط جانبي مستقل) ===== */}
          <Reveal delay={100}>
            <div className="grid md:grid-cols-[auto_1fr] gap-5 mt-5 surface rounded-[2rem] p-6 md:p-7 border border-[#e9dcc3] dark:border-[#3b3222]">
              <div className="flex md:flex-col items-center md:items-center gap-5">
                <ProfileDonut value={last?.percent ?? 0} has={!!last} />
                <div className="grid grid-cols-3 md:grid-cols-1 gap-4 md:gap-2.5 md:text-center">
                  <div>
                    <div className="text-[10.5px] font-black t-muted">آخر نتيجة</div>
                    <div className="font-display font-extrabold text-sm">{last ? `${last.totalScore}/${last.maxTotal ?? 20}` : '—'}</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-black t-muted">تقويمات</div>
                    <div className="font-display font-extrabold text-sm">{history.length}</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-black t-muted">مستواك</div>
                    <div className="font-display font-extrabold text-xs max-w-[120px] truncate">{last ? masteryTone(last.percent).label : '—'}</div>
                  </div>
                </div>
              </div>

              <div className="md:border-r md:border-[var(--c-border)] md:pr-7 grid sm:grid-cols-2 gap-6 content-center">
                <div>
                  <div className="text-[11px] font-black t-muted mb-2.5 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-leaf" />
                    نقاط قوتي
                  </div>
                  {strengthSkills.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {strengthSkills.map((s) => (
                        <span key={s.name + s.sujet} className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-leaf-soft text-leaf">{s.name}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] t-muted">أنجز أول تقويم لتظهر نقاط قوتك هنا.</p>
                  )}
                </div>
                <div>
                  <div className="text-[11px] font-black t-muted mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-terra" />
                    أحتاج إلى دعم في
                  </div>
                  {weakSkills.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {weakSkills.map((s) => (
                        <span key={s.name + s.sujet} className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-terra-soft text-terra">{s.name}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] t-muted">لا توجد مهارات متعثرة حالياً — أحسنت!</p>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ================= متابعتي (تبويبان داخل بطاقة واحدة) ================= */}
        <section className="py-12">
          <Reveal>
            <div className="surface rounded-[2rem] shadow-lg overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-[var(--c-border)]">
                <h2 className="font-display font-extrabold text-xl flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-sky-soft text-azure dark:bg-white/10 dark:text-gold flex items-center justify-center">
                    <History className="w-4.5 h-4.5 w-5 h-5" />
                  </span>
                  متابعتي
                </h2>
                <div className="inline-flex p-1 rounded-xl surface-tint">
                  <button
                    onClick={() => setTrackTab('progress')}
                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${trackTab === 'progress' ? 'bg-azure text-white shadow-md shadow-azure/25' : 't-muted hover:text-azure'}`}
                  >
                    تطوري
                  </button>
                  <button
                    onClick={() => setTrackTab('log')}
                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${trackTab === 'log' ? 'bg-azure text-white shadow-md shadow-azure/25' : 't-muted hover:text-azure'}`}
                  >
                    سجل تقويماتي{history.length > 0 ? ` (${history.length})` : ''}
                  </button>
                </div>
              </div>

              <div className="p-6 md:p-8">
                {trackTab === 'progress' ? (
                  history.length > 0 ? (
                    <ProgressChart history={history} />
                  ) : (
                    <div className="text-center py-12 space-y-4">
                      <TrendingUp className="w-10 h-10 t-muted opacity-40 mx-auto" />
                      <p className="t-muted text-sm">لم تنجز أي تقويم بعد — أنجز أول تقويم ليظهر منحنى تطورك هنا.</p>
                      <a href="#start" className="inline-block btn-gold px-6 py-3 rounded-2xl font-display font-extrabold text-sm">ابدأ الآن</a>
                    </div>
                  )
                ) : history.length === 0 ? (
                  <div className="text-center py-12 t-muted text-sm">لا يوجد تقويمات مسجلة لرمزك بعد.</div>
                ) : (
                  <div className="overflow-x-auto -mx-2">
                    <table className="w-full text-sm min-w-[680px]">
                      <thead>
                        <tr className="border-b-2 border-[var(--c-border)] t-muted">
                          <th className="text-right py-3 px-3 font-display text-xs">التاريخ</th>
                          <th className="text-right py-3 px-3 font-display text-xs">المستوى</th>
                          <th className="text-center py-3 px-3 font-display text-xs">المجال</th>
                          <th className="text-center py-3 px-3 font-display text-xs">النوع</th>
                          <th className="text-center py-3 px-3 font-display text-xs">النقطة</th>
                          <th className="text-center py-3 px-3 font-display text-xs">النسبة</th>
                          <th className="text-center py-3 px-3 font-display text-xs">التحكم</th>
                          <th className="text-center py-3 px-3 font-display text-xs"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...history].reverse().map((r) => {
                          const tone = masteryTone(r.percent);
                          return (
                            <tr key={r.id} className="border-b border-[var(--c-border)] hover:bg-[var(--c-tint)] dark:hover:bg-white/5 transition-colors">
                              <td className="py-3 px-3 font-bold whitespace-nowrap text-xs">{formatDate(r.date)}</td>
                              <td className="py-3 px-3 text-xs">{r.levelLabel.split(' — ')[0]}</td>
                              <td className="py-3 px-3 text-center text-[11px] font-bold t-muted">{DOMAIN_LABEL[r.domain ?? 'both']}</td>
                              <td className="py-3 px-3 text-center text-[11px] font-bold t-muted">{KIND_LABEL[r.kind ?? 'diagnostic']}</td>
                              <td className="py-3 px-3 text-center font-black">{r.totalScore}<span className="text-xs t-muted font-bold">/{r.maxTotal ?? 20}</span></td>
                              <td className="py-3 px-3 text-center font-black text-azure dark:text-gold">{r.percent}%</td>
                              <td className="py-3 px-3 text-center">
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${tone.cls}`}>{tone.label}</span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={() => { setViewRec(r); setMode('result'); window.scrollTo({ top: 0 }); }}
                                  className="text-[11px] font-black text-azure dark:text-gold hover:underline whitespace-nowrap"
                                >
                                  عرض النتيجة
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </section>

      </div>

      {/* زر عائم للبدء */}
      <a
        href="#start"
        className="tq-fab fixed bottom-6 left-6 z-40 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl text-white font-display font-extrabold text-sm transition-all"
      >
        <Compass className="w-5 h-5" />
        ابدأ تقويماً
        <ChevronDown className="w-4 h-4 -rotate-90" />
      </a>
    </div>
  );
}

