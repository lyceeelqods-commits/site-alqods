import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react';

export interface TimelineItem {
  date: string;
  label: string;
}

const STEP_MS = 1500;

export default function HorizontalTimeline({ items }: { items: TimelineItem[] }) {
  const [revealed, setRevealed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [active, setActive] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  /* بدء الحركة عند دخول العنصر للشاشة */
  const observe = (el: HTMLDivElement | null) => {
    if (!el || startedRef.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          startedRef.current = true;
          setRevealed(1);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
  };

  /* التقدّم التلقائي */
  useEffect(() => {
    if (!playing || revealed === 0 || revealed >= items.length) return;
    const t = setTimeout(() => setRevealed((r) => Math.min(items.length, r + 1)), STEP_MS);
    return () => clearTimeout(t);
  }, [playing, revealed, items.length]);

  /* تمرير أفقي تلقائي نحو آخر عنصر ظاهر (RTL) */
  useEffect(() => {
    const el = trackRef.current;
    if (!el || revealed === 0) return;
    const node = el.querySelector<HTMLElement>(`[data-node="${revealed - 1}"]`);
    if (node) {
      const target = node.offsetLeft - el.clientWidth / 2 + node.clientWidth / 2;
      el.scrollTo({ left: target, behavior: 'smooth' });
    }
  }, [revealed]);

  const done = revealed >= items.length;
  const progress = (revealed / items.length) * 100;

  const replay = () => {
    setRevealed(1);
    setActive(null);
    setPlaying(true);
  };

  const scrollBy = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  return (
    <div ref={observe} className="space-y-4">
      {/* أدوات التحكم */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => (done ? replay() : setPlaying((p) => !p))}
            className="w-9 h-9 rounded-xl bg-[#8c5f1f] text-white flex items-center justify-center hover:bg-[#a06f22] transition-colors shrink-0"
            aria-label={done ? 'إعادة' : playing ? 'إيقاف' : 'تشغيل'}
          >
            {done ? <RotateCcw className="w-4 h-4" /> : playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <span className="text-[11px] font-black t-muted tabular-nums">
            {Math.min(revealed, items.length)} / {items.length} محطة
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => scrollBy(1)} className="w-8 h-8 rounded-lg surface-tint t-muted hover:text-[#8c5f1f] transition-colors flex items-center justify-center" aria-label="السابق">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => scrollBy(-1)} className="w-8 h-8 rounded-lg surface-tint t-muted hover:text-[#8c5f1f] transition-colors flex items-center justify-center" aria-label="التالي">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* شريط التقدم */}
      <div className="h-1.5 rounded-full bg-[var(--c-border)] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-l from-[#d9a441] to-[#8c5f1f] transition-[width] duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* المسار الأفقي */}
      <div
        ref={trackRef}
        className="relative overflow-x-auto no-scrollbar pb-4 pt-2"
        dir="rtl"
      >
        <div className="relative min-w-max px-6" style={{ minHeight: 230 }}>
          {/* الخط الأساسي */}
          <div className="absolute right-0 left-0 top-[104px] h-1 rounded-full bg-[var(--c-border)]" />
          {/* الخط المتقدّم (RTL: من اليمين) */}
          <div
            className="absolute right-0 top-[104px] h-1 rounded-full bg-gradient-to-l from-[#d9a441] to-[#8c5f1f] transition-[width] duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />

          <div className="relative flex items-start gap-0">
            {items.map((it, i) => {
              const shown = i < revealed;
              const isActive = active === i;
              const above = i % 2 === 0;
              return (
                <div
                  key={it.date + it.label}
                  data-node={i}
                  className="relative flex flex-col items-center w-[220px] shrink-0"
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                >
                  {/* البطاقة العلوية */}
                  <div className="h-[92px] flex items-end justify-center w-full pb-3">
                    {above && (
                      <div
                        className={`w-[196px] rounded-2xl border-2 p-3 text-center transition-all duration-500 ${
                          shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                        } ${
                          isActive
                            ? 'border-[#b5832a] bg-white dark:bg-white/10 shadow-lg shadow-[#8c5f1f]/15 scale-[1.03]'
                            : 'border-[var(--c-border)] surface'
                        }`}
                        style={{ transitionDelay: shown ? `${(i % 3) * 60}ms` : '0ms' }}
                      >
                        <div className="text-[12.5px] font-bold leading-snug line-clamp-3">{it.label}</div>
                      </div>
                    )}
                  </div>

                  {/* العقدة على الخط */}
                  <div className="relative z-10 flex items-center justify-center" style={{ height: 24 }}>
                    <span
                      className={`rounded-full border-4 border-white dark:border-[#101d33] transition-all duration-500 ${
                        shown
                          ? isActive
                            ? 'w-6 h-6 bg-[#8c5f1f] shadow-lg shadow-[#8c5f1f]/40 scale-110'
                            : 'w-5 h-5 bg-gradient-to-br from-[#d9a441] to-[#8c5f1f] shadow-md'
                          : 'w-3 h-3 bg-[var(--c-border)]'
                      }`}
                    />
                    {/* نبضة على آخر عقدة ظاهرة */}
                    {shown && i === revealed - 1 && !done && (
                      <span className="absolute w-6 h-6 rounded-full bg-[#d9a441]/40 animate-ping" />
                    )}
                  </div>

                  {/* التاريخ */}
                  <div
                    className={`mt-3 transition-all duration-500 ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
                  >
                    <span
                      className={`inline-block px-3 py-1.5 rounded-xl font-display font-black text-sm tabular-nums transition-colors ${
                        isActive
                          ? 'bg-[#8c5f1f] text-white'
                          : 'bg-[#f6ead3] text-[#8c5f1f] dark:bg-white/10 dark:text-[#e0b256]'
                      }`}
                    >
                      {it.date}
                    </span>
                  </div>

                  {/* البطاقة السفلية */}
                  <div className="h-[78px] flex items-start justify-center w-full pt-3">
                    {!above && (
                      <div
                        className={`w-[196px] rounded-2xl border-2 p-3 text-center transition-all duration-500 ${
                          shown ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
                        } ${
                          isActive
                            ? 'border-[#b5832a] bg-white dark:bg-white/10 shadow-lg shadow-[#8c5f1f]/15 scale-[1.03]'
                            : 'border-[var(--c-border)] surface'
                        }`}
                        style={{ transitionDelay: shown ? `${(i % 3) * 60}ms` : '0ms' }}
                      >
                        <div className="text-[12.5px] font-bold leading-snug line-clamp-3">{it.label}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-[11px] t-muted text-center">
        مرّر أفقياً أو استعمل الأسهم · مرّر فوق أي محطة لإبرازها
      </p>
    </div>
  );
}
