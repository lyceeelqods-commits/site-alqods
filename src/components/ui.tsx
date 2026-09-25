import { useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import Reveal, { useCountUp } from './Reveal';

/* ---------- page header band for inner pages ---------- */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  crumb,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  crumb?: string;
}) {
  return (
    <section className="relative bg-navy text-white overflow-hidden">
      <TopoLines className="absolute -left-40 -bottom-64 w-[620px] h-[620px] opacity-60" />
      <div className="absolute top-0 right-1/4 w-[420px] h-[280px] bg-azure/30 blur-[110px] rounded-full" />
      <div className="relative max-w-6xl mx-auto px-5 md:px-6 pt-36 pb-14 md:pt-44 md:pb-20">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/40 bg-gold/10 text-gold text-xs font-bold mb-5">
            {eyebrow}
          </div>
          <h1 className="font-display font-black text-3xl md:text-5xl leading-snug">{title}</h1>
          {subtitle && <p className="text-white/65 text-lg mt-4 max-w-3xl leading-relaxed">{subtitle}</p>}
          {crumb && (
            <p className="text-white/40 text-xs mt-5">
              الرئيسية <span className="mx-1.5">←</span> {crumb}
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- section head ---------- */
export function SectionHead({
  eyebrow,
  title,
  desc,
  center = true,
  light = false,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  center?: boolean;
  light?: boolean;
}) {
  return (
    <Reveal className={`${center ? 'text-center mx-auto' : ''} max-w-2xl mb-12`}>
      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4 ${
        light ? 'bg-white/10 text-gold border border-gold/30' : 'bg-sky-soft text-azure dark:bg-white/5'
      }`}>
        {eyebrow}
      </div>
      <h2 className={`font-display font-black text-3xl md:text-4xl ${light ? 'text-white' : ''}`}>{title}</h2>
      {desc && <p className={`text-base mt-4 leading-relaxed ${light ? 'text-white/60' : 't-muted'}`}>{desc}</p>}
    </Reveal>
  );
}

/* ---------- chip ---------- */
export function Chip({ children, tone = 'blue' }: { children: ReactNode; tone?: 'blue' | 'gold' | 'green' | 'red' | 'muted' }) {
  const map = {
    blue: 'bg-sky-soft text-azure dark:bg-white/5',
    gold: 'bg-gold-soft text-gold-deep',
    green: 'bg-leaf-soft text-leaf',
    red: 'bg-terra-soft text-terra',
    muted: 'surface-tint t-muted',
  } as const;
  return <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${map[tone]}`}>{children}</span>;
}

/* ---------- stat with count-up ---------- */
export function Stat({ value, suffix = '', label }: { value: number; suffix?: string; label: string }) {
  const [go, setGo] = useState(false);
  const v = useCountUp(value, 1300, go);
  const ref = (el: HTMLDivElement | null) => {
    if (!el || el.dataset.seen) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.dataset.seen = '1';
          setGo(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
  };
  return (
    <div ref={ref} className="text-center">
      <div className="font-display font-black text-3xl md:text-4xl text-gold">{Math.round(v)}{suffix}</div>
      <div className="text-white/60 text-sm mt-1.5 font-medium">{label}</div>
    </div>
  );
}

/* ---------- modal ---------- */
export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-5 bg-night/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`bg-white dark:bg-[#101d33] text-ink dark:text-white rounded-3xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[85vh] overflow-y-auto anim-pop border border-line dark:border-white/10`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/95 dark:bg-[#101d33]/95 backdrop-blur border-b border-line dark:border-white/10 px-6 py-4 flex items-center justify-between">
          <h3 className="font-display font-extrabold text-lg">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors" aria-label="إغلاق">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* ---------- topo lines svg ---------- */
export function TopoLines({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 800" className={className} aria-hidden>
      <defs>
        <path
          id="qudsTopoBlob"
          d="M400,120 C560,110 700,220 690,380 C680,540 560,660 400,670 C240,680 110,560 115,390 C120,220 240,130 400,120 Z"
        />
      </defs>
      {[1.35, 1.12, 0.9, 0.68, 0.46].map((s, i) => (
        <use key={i} href="#qudsTopoBlob" className="topo-line" transform={`translate(${400 - 400 * s} ${400 - 400 * s}) scale(${s})`} />
      ))}
    </svg>
  );
}

/* ---------- avatar with initial ---------- */
export function Avatar({ name, className = 'w-12 h-12' }: { name: string; className?: string }) {
  const ch = (name.trim() || '؟').split(' ')[0].charAt(0);
  return (
    <div className={`${className} rounded-2xl bg-gradient-to-br from-azure to-navy text-gold flex items-center justify-center font-display font-black shadow-lg shadow-azure/20 text-lg shrink-0`}>
      {ch}
    </div>
  );
}

/* ---------- images ---------- */
export const IMG = {
  heroBuilding: 'https://images.pexels.com/photos/17144608/pexels-photo-17144608.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  classroomHands: 'https://images.pexels.com/photos/8926542/pexels-photo-8926542.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  lessonBoard: 'https://images.pexels.com/photos/5905554/pexels-photo-5905554.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  brightClass: 'https://images.pexels.com/photos/8617765/pexels-photo-8617765.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  uniformClass: 'https://images.pexels.com/photos/7396377/pexels-photo-7396377.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  sunlitStudent: 'https://images.pexels.com/photos/37822445/pexels-photo-37822445.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  listeningStudent: 'https://images.pexels.com/photos/33719253/pexels-photo-33719253.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  teacherDesk: 'https://images.pexels.com/photos/7396387/pexels-photo-7396387.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  facadeBlue: 'https://images.pexels.com/photos/7406300/pexels-photo-7406300.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  glassFacade: 'https://images.pexels.com/photos/33860720/pexels-photo-33860720.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  international: 'https://images.pexels.com/photos/29659894/pexels-photo-29659894.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
};
