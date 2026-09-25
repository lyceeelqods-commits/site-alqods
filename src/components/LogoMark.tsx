export default function LogoMark({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={`${className} shrink-0`} role="img" aria-label="شعار الثانوية التأهيلية القدس — القنيطرة">
      <defs>
        <linearGradient id="qRing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2f6fd0" />
          <stop offset="100%" stopColor="#0c2340" />
        </linearGradient>
        <linearGradient id="qGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e7bd63" />
          <stop offset="100%" stopColor="#b58324" />
        </linearGradient>
      </defs>

      {/* professional badge: outer ring + field */}
      <circle cx="60" cy="60" r="58" fill="url(#qRing)" />
      <circle cx="60" cy="60" r="52" fill="none" stroke="#f8f5ee" strokeWidth="1" opacity="0.2" />
      <circle cx="60" cy="60" r="48" fill="#0c2340" />
      <circle cx="60" cy="60" r="48" fill="none" stroke="url(#qGold)" strokeWidth="2" opacity="0.85" />
      <circle cx="60" cy="60" r="43" fill="none" stroke="url(#qGold)" strokeWidth="0.8" opacity="0.45" />

      {/* Moroccan four-point star */}
      <path d="M60 26 l3 8.5 8.5 3 -8.5 3 -3 8.5 -3 -8.5 -8.5 -3 8.5 -3 Z" fill="url(#qGold)" />

      {/* open book */}
      <g stroke="url(#qGold)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(217,164,65,0.08)">
        <path d="M60 58 C51.5 52.5 41 52 34.5 55.5 L34.5 82 C41 78.5 51.5 79 60 84.5" />
        <path d="M60 58 C68.5 52.5 79 52 85.5 55.5 L85.5 82 C79 78.5 68.5 79 60 84.5" />
        <line x1="60" y1="58" x2="60" y2="84.5" strokeWidth="2.4" />
      </g>
      {/* page lines */}
      <g stroke="#d9a441" strokeWidth="1.3" strokeLinecap="round" opacity="0.55">
        <line x1="41" y1="62.5" x2="53" y2="64.5" />
        <line x1="41" y1="69" x2="53" y2="71" />
        <line x1="67" y1="64.5" x2="79" y2="62.5" />
        <line x1="67" y1="71" x2="79" y2="69" />
      </g>

      {/* baseline ornament */}
      <path d="M47 96 l3 3 3 -3" fill="none" stroke="url(#qGold)" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
      <path d="M67 96 l3 3 3 -3" fill="none" stroke="url(#qGold)" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
