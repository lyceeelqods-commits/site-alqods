import { QUDS_PATH, QUDS_H } from "./logoPath";

export default function LogoMark({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={`${className} shrink-0`} role="img" aria-label="شعار الثانوية التأهيلية القدس">
      <circle cx="60" cy="60" r="58" fill="#f2f0eb" />
      <circle cx="60" cy="60" r="57.2" fill="none" stroke="rgba(12,35,64,0.10)" strokeWidth="1.4" />
      <g transform={`translate(60 60) rotate(-8) scale(0.05) translate(-1000 ${-QUDS_H / 2})`}>
        <path fill="#151310" d={QUDS_PATH} />
      </g>
    </svg>
  );
}
