// مخططات SVG/CSS خفيفة ومتوافقة مع RTL
export function HBars({ data, unit = "", tone = "gold" }: { data: { label: string; value: number }[]; unit?: string; tone?: "gold" | "bad" }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const bar = tone === "bad" ? "bg-bad/80" : "bg-gold";
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3 text-xs">
          <div className="w-40 shrink-0 font-bold text-ink-soft truncate" title={d.label}>{d.label}</div>
          <div className="flex-1 h-5 bg-beige/70 rounded-lg overflow-hidden">
            <div className={`h-full rounded-lg ${bar} transition-all`} style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <div className="w-14 shrink-0 text-left font-display font-extrabold">{Number(d.value).toLocaleString("fr-MA")}<span className="text-[.65rem] text-ink-soft font-bold">{unit}</span></div>
        </div>
      ))}
      {!data.length && <p className="text-xs text-ink-soft text-center py-6">لا توجد بيانات</p>}
    </div>
  );
}

export function VBars({ data, color = "#c09a3e" }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.length) return <p className="text-xs text-ink-soft text-center py-6">لا توجد بيانات</p>;
  return (
    <div className="flex items-end gap-1.5 h-40">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1 group" title={`${d.label}: ${d.value}`}>
          <span className="text-[.65rem] font-display font-extrabold text-ink-soft opacity-0 group-hover:opacity-100 transition-opacity">{d.value}</span>
          <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.max(3, (d.value / max) * 100)}%`, background: color, opacity: d.value ? 1 : .15 }} />
          <span className="text-[.6rem] font-bold text-ink-soft">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function LineArea({ data, color = "#b91c1c" }: { data: { label: string; value: number }[]; color?: string }) {
  if (!data.length) return <p className="text-xs text-ink-soft text-center py-6">لا توجد بيانات</p>;
  const W = 320, H = 130, P = 24;
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = (W - P * 2) / Math.max(1, data.length - 1);
  const pts = data.map((d, i) => [P + i * step, H - P - (d.value / max) * (H - P * 2)] as const);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L${pts[pts.length - 1][0].toFixed(1)},${H - P} L${pts[0][0].toFixed(1)},${H - P} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" dir="ltr">
      <path d={area} fill={color} opacity="0.08" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="3" fill="#fff" stroke={color} strokeWidth="2" />
          <text x={p[0]} y={H - 8} textAnchor="middle" fontSize="8.5" fill="#6b6350" fontWeight="700">{data[i].label}</text>
          {data[i].value > 0 && <text x={p[0]} y={p[1] - 7} textAnchor="middle" fontSize="9" fill={color} fontWeight="800">{data[i].value}</text>}
        </g>
      ))}
    </svg>
  );
}

export function Donut({ data, colors = ["#16130e", "#c09a3e", "#8f7128", "#d9c48d", "#6b6350", "#e7dfcc", "#b91c1c", "#2e7d4f"] }: {
  data: { label: string; value: number }[]; colors?: string[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <p className="text-xs text-ink-soft text-center py-6">لا توجد بيانات</p>;
  const R = 15.9155; // محيط 2πr ≈ 100
  let acc = 0;
  return (
    <div className="flex items-center gap-5 flex-wrap justify-center">
      <svg viewBox="0 0 42 42" className="w-36 h-36 -rotate-90 shrink-0">
        <circle cx="21" cy="21" r={R} fill="none" stroke="#f3ecdc" strokeWidth="7" />
        {data.map((d, i) => {
          const frac = d.value / total;
          const seg = <circle key={i} cx="21" cy="21" r={R} fill="none" stroke={colors[i % colors.length]} strokeWidth="7"
            strokeDasharray={`${(frac * 100).toFixed(2)} ${(100 - frac * 100).toFixed(2)}`} strokeDashoffset={-acc * 100} />;
          acc += frac;
          return seg;
        })}
      </svg>
      <div className="space-y-1.5 text-xs">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: colors[i % colors.length] }} />
            <span className="font-bold text-ink-soft min-w-24">{d.label}</span>
            <span className="font-display font-extrabold">{d.value}</span>
            <span className="text-ink-soft text-[.68rem]">({Math.round((d.value / total) * 100)}٪)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
