import { useEffect, useState } from 'react';
import {
  Play, Pause, RotateCcw, CheckCircle2, School, ClipboardCheck, Compass,
} from 'lucide-react';

const STEPS = [
  { key: 'level', caption: '1 — اختيار المستوى' },
  { key: 'question', caption: '2 — سؤال تفاعلي' },
  { key: 'result', caption: '3 — النتيجة والتشخيص' },
  { key: 'plan', caption: '4 — خطة الدعم' },
];

const STEP_MS = 3400;

function MiniDonut({ value }: { value: number }) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGo(true), 250);
    return () => clearTimeout(t);
  }, []);
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-24 h-24">
      <svg width={96} height={96} className="-rotate-90">
        <circle cx={48} cy={48} r={r} fill="none" stroke="var(--c-border)" strokeWidth={9} />
        <circle
          cx={48} cy={48} r={r} fill="none" stroke="#1e56b0" strokeWidth={9} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * (go ? value : 0)) / 100}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display font-black text-2xl text-azure dark:text-gold">{value}%</span>
      </div>
    </div>
  );
}

export default function AnimatedDemo() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % STEPS.length), STEP_MS);
    return () => clearTimeout(t);
  }, [step, paused]);

  return (
    <div className="surface rounded-[2rem] shadow-2xl overflow-hidden" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* browser chrome */}
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[var(--c-border)] bg-[var(--c-tint)] dark:bg-white/5">
        <span className="w-3 h-3 rounded-full bg-terra/70" />
        <span className="w-3 h-3 rounded-full bg-amber/70" />
        <span className="w-3 h-3 rounded-full bg-leaf/70" />
        <div className="mx-auto flex items-center gap-2 text-[11px] font-bold t-muted bg-white/70 dark:bg-black/20 border border-[var(--c-border)] rounded-full px-4 py-1.5">
          <Compass className="w-3 h-3 text-azure dark:text-gold" />
          التقويم الشخصي — الثانوية التأهيلية القدس
        </div>
        <span className="w-16" />
      </div>

      {/* stage */}
      <div className="relative h-[340px] md:h-[380px]">
        {/* STEP 1: level selection */}
        <div className={`absolute inset-0 p-6 md:p-8 flex items-center justify-center transition-all duration-700 ${step === 0 ? 'opacity-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
          <div className="w-full max-w-md">
            <div className="text-xs font-black t-muted mb-4 flex items-center gap-2">
              <School className="w-4 h-4 text-azure dark:text-gold" />
              اختر مستواك الدراسي
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['الجذع المشترك — آداب', 'الأولى باك — علوم إنسانية', 'الثانية باك — آداب'].map((l, i) => (
                <div
                  key={l}
                  className={`rounded-2xl border-2 p-4 text-xs font-bold transition-all duration-500 ${
                    i === 1
                      ? step === 0
                        ? 'border-azure bg-sky-soft/60 dark:bg-white/10 shadow-lg shadow-azure/20 scale-[1.04]'
                        : 'surface-tint'
                      : 'surface-tint'
                  }`}
                  style={{ transitionDelay: `${i * 150}ms` }}
                >
                  {l}
                  {i === 1 && step === 0 && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-black text-azure dark:text-gold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> تم الاختيار
                    </div>
                  )}
                </div>
              ))}
              <div className="rounded-2xl border-2 border-dashed border-[var(--c-border)] p-4 text-xs font-bold t-muted flex items-center justify-center">
                + 4 مستويات
              </div>
            </div>
          </div>
        </div>

        {/* STEP 2: interactive question */}
        <div className={`absolute inset-0 p-6 md:p-8 flex items-center justify-center transition-all duration-700 ${step === 1 ? 'opacity-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black px-3 py-1.5 rounded-full bg-terra-soft text-terra">التاريخ — التواريخ</span>
              <span className="text-[11px] font-black t-muted">السؤال 5 من 20</span>
            </div>
            <div className="h-2 bg-[var(--c-border)] rounded-full overflow-hidden mb-5">
              <div className="h-full bg-azure rounded-full" style={{ width: '25%', transition: 'width 1s' }} />
            </div>
            <div className="surface-tint rounded-2xl p-4 mb-4">
              <p className="text-sm font-bold leading-relaxed">في أي سنة وقّعت معاهدة الحماية (فاس)؟</p>
            </div>
            <div className="grid gap-2.5">
              {['1904', '1912', '1925'].map((o, i) => (
                <div
                  key={o}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all duration-500 ${
                    step === 1 && i === 1
                      ? 'border-leaf bg-leaf-soft text-leaf'
                      : 'surface-tint'
                  }`}
                  style={{ transitionDelay: `${400 + i * 250}ms` }}
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black ${
                    step === 1 && i === 1 ? 'bg-leaf text-white' : 'bg-[var(--c-border)] t-muted'
                  }`}>
                    {step === 1 && i === 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : String.fromCharCode(65 + i)}
                  </span>
                  {o}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* STEP 3: result */}
        <div className={`absolute inset-0 p-6 md:p-8 flex items-center justify-center transition-all duration-700 ${step === 2 ? 'opacity-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
          <div className="w-full max-w-md flex items-center gap-6">
            <MiniDonut value={75} />
            <div className="flex-1 space-y-3">
              <div className="text-xs font-black t-muted">نتيجتي</div>
              <div className="font-display font-black text-3xl">
                15<span className="text-base t-muted">/20</span>
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-bold t-muted mb-1"><span>التاريخ</span><span>8/10</span></div>
                <div className="h-2 bg-[var(--c-border)] rounded-full overflow-hidden">
                  <div className="h-full bg-terra rounded-full" style={{ width: step === 2 ? '80%' : '0%', transition: 'width 1s 0.3s' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-bold t-muted mb-1"><span>الجغرافيا</span><span>7/10</span></div>
                <div className="h-2 bg-[var(--c-border)] rounded-full overflow-hidden">
                  <div className="h-full bg-leaf rounded-full" style={{ width: step === 2 ? '70%' : '0%', transition: 'width 1s 0.5s' }} />
                </div>
              </div>
              <div className="text-[11px] font-black px-3 py-1.5 rounded-full bg-amber-soft text-amber-deep inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-deep dot-pulse" />
                يحتاج إلى دعم جزئي
              </div>
            </div>
          </div>
        </div>

        {/* STEP 4: support plan */}
        <div className={`absolute inset-0 p-6 md:p-8 flex items-center justify-center transition-all duration-700 ${step === 3 ? 'opacity-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
          <div className="w-full max-w-md">
            <div className="text-xs font-black t-muted mb-4 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-azure dark:text-gold" />
              خطة دعمي الشخصية
            </div>
            <div className="space-y-2.5">
              {[
                { w: 'الأسبوع الأول', t: 'معالجة التعثرات في التاريخ — تحليل الوثائق' },
                { w: 'الأسبوع الثاني', t: 'تدريب على قراءة المبيان والمقارنة' },
                { w: 'الأسبوع الثالث', t: 'تمارين مركبة + إعادة التقويم' },
              ].map((p, i) => (
                <div
                  key={p.w}
                  className="flex items-center gap-3 surface-tint rounded-xl p-3.5 transition-all duration-500"
                  style={{ transitionDelay: `${i * 200}ms`, opacity: step === 3 ? 1 : 0, transform: step === 3 ? 'none' : 'translateX(12px)' }}
                >
                  <span className="w-8 h-8 rounded-lg bg-azure text-white font-display font-black text-sm flex items-center justify-center shrink-0">{i + 1}</span>
                  <div>
                    <div className="text-[10px] font-black text-azure dark:text-gold">{p.w}</div>
                    <div className="text-xs font-bold leading-snug">{p.t}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* controls */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--c-border)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPaused((p) => !p)}
            className="w-10 h-10 rounded-xl bg-azure text-white flex items-center justify-center hover:bg-azure-2 transition-colors"
            aria-label={paused ? 'تشغيل' : 'إيقاف مؤقت'}
          >
            {paused ? <Play className="w-4.5 h-4.5 w-5 h-5" /> : <Pause className="w-4.5 h-4.5 w-5 h-5" />}
          </button>
          <button
            onClick={() => setStep(0)}
            className="w-10 h-10 rounded-xl surface-tint t-muted flex items-center justify-center hover:text-azure transition-colors"
            aria-label="إعادة"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="hidden md:block text-xs font-bold t-muted">{STEPS[step].caption}</div>
        </div>
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setStep(i)}
              aria-label={s.caption}
              className={`h-2.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-azure' : 'w-2.5 bg-[var(--c-border)] hover:bg-azure/40'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
