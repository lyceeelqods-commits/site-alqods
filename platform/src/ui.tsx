import { ReactNode, useEffect } from "react";
import { X, Loader2, Inbox, ChevronRight, ChevronLeft } from "lucide-react";

// ---------- أزرار ----------
export function Button({ children, onClick, variant = "primary", size = "md", type = "button", disabled, className = "" }: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "outline" | "danger" | "gold" | "dark";
  size?: "sm" | "md" | "lg"; type?: "button" | "submit"; disabled?: boolean; className?: string;
}) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-xl font-display font-bold transition-all active:scale-[.98] disabled:opacity-45 disabled:pointer-events-none";
  const sizes = { sm: "text-xs px-2.5 py-1.5", md: "text-sm px-4 py-2", lg: "text-base px-6 py-2.5" }[size];
  const variants = {
    primary: "bg-night text-gold-soft hover:bg-night-2 shadow-sm",
    dark: "bg-ink text-white hover:bg-black",
    gold: "bg-gold text-white hover:bg-gold-deep shadow-sm",
    outline: "border border-line bg-white text-ink hover:bg-beige",
    ghost: "text-ink-soft hover:bg-beige",
    danger: "bg-bad text-white hover:bg-red-800 shadow-sm",
  }[variant];
  return <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes} ${variants} ${className}`}>{children}</button>;
}

// ---------- بطاقة ----------
export function Card({ children, className = "", pad = true }: { children: ReactNode; className?: string; pad?: boolean }) {
  return <div className={`bg-white rounded-2xl border border-line shadow-[0_1px_3px_rgba(28,24,18,.05)] ${pad ? "p-5" : ""} ${className}`}>{children}</div>;
}
export function CardTitle({ children, sub, icon }: { children: ReactNode; sub?: string; icon?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {icon && <div className="w-9 h-9 rounded-xl bg-gold-soft text-gold-deep flex items-center justify-center">{icon}</div>}
      <div>
        <h3 className="font-display font-extrabold text-[1.02rem] leading-tight">{children}</h3>
        {sub && <p className="text-xs text-ink-soft mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ---------- شارات ----------
export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "gold" | "ok" | "warn" | "bad" | "ink" }) {
  const tones = {
    gray: "bg-beige text-ink-soft", gold: "bg-gold-soft text-gold-deep", ok: "bg-ok-soft text-ok",
    warn: "bg-warn-soft text-warn", bad: "bg-bad-soft text-bad", ink: "bg-night text-gold-soft",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[.72rem] font-bold ${tones}`}>{children}</span>;
}

// ---------- حقول ----------
export function Field({ label, children, error, className = "" }: { label: string; children: ReactNode; error?: string; className?: string }) {
  return (
    <div className={className}>
      <label className="lbl">{label}</label>
      {children}
      {error && <p className="text-bad text-xs mt-1 font-bold">{error}</p>}
    </div>
  );
}
export function Input(p: any) { return <input {...p} className={`field ${p.className || ""}`} />; }
export function Select(p: any) { return <select {...p} className={`field ${p.className || ""}`} />; }
export function Textarea(p: any) { return <textarea {...p} className={`field ${p.className || ""}`} />; }

// ---------- نافذة منبثقة ----------
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4 md:p-8 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-4xl" : "max-w-xl"} my-4`}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
          <h3 className="font-display font-extrabold">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-beige flex items-center justify-center text-ink-soft"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ---------- تأكيد ----------
export function ConfirmDialog({ opts, onResult }: { opts: { title: string; message: string; danger?: boolean; confirmLabel?: string } | null; onResult: (v: boolean) => void }) {
  if (!opts) return null;
  return (
    <Modal open onClose={() => onResult(false)} title={opts.title}>
      <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-line">{opts.message}</p>
      <div className="flex gap-2 justify-end mt-5">
        <Button variant="outline" onClick={() => onResult(false)}>إلغاء</Button>
        <Button variant={opts.danger ? "danger" : "primary"} onClick={() => onResult(true)}>{opts.confirmLabel || "تأكيد"}</Button>
      </div>
    </Modal>
  );
}

// ---------- حالات فارغة وتحميل ----------
export function Spinner({ label = "جارٍ التحميل…" }: { label?: string }) {
  return <div className="flex flex-col items-center justify-center py-14 text-ink-soft gap-3"><Loader2 className="animate-spin text-gold" size={30} /><span className="text-sm font-bold">{label}</span></div>;
}
export function Empty({ icon, title, sub }: { icon?: ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
      <div className="w-14 h-14 rounded-2xl bg-beige flex items-center justify-center text-ink-soft">{icon || <Inbox size={26} />}</div>
      <p className="font-display font-extrabold">{title}</p>
      {sub && <p className="text-xs text-ink-soft max-w-xs">{sub}</p>}
    </div>
  );
}

// ---------- ترقيم الصفحات ----------
export function Pagination({ page, total, perPage, onPage }: { page: number; total: number; perPage: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <span className="text-ink-soft text-xs font-bold">{total} نتيجة — الصفحة {page} من {pages}</span>
      <div className="flex gap-1.5">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronRight size={14} /> السابق</Button>
        <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>التالي <ChevronLeft size={14} /></Button>
      </div>
    </div>
  );
}

// ---------- جدول بيانات عام ----------
export function DataTable({ columns, rows, empty, rowKey }: {
  columns: { key: string; label: string; render?: (row: any) => ReactNode; className?: string }[];
  rows: any[]; empty?: ReactNode; rowKey?: (r: any, i: number) => string | number;
}) {
  if (!rows.length) return empty || <Empty title="لا توجد بيانات" />;
  return (
    <div className="overflow-x-auto -mx-5 px-5">
      <table className="tbl">
        <thead><tr>{columns.map((c) => <th key={c.key} className={c.className}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={rowKey ? rowKey(r, i) : i}>
              {columns.map((c) => <td key={c.key} className={c.className}>{c.render ? c.render(r) : (r[c.key] ?? "—")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- تبويبات ----------
export function Tabs({ tabs, active, onChange }: { tabs: { key: string; label: string; count?: number }[]; active: string; onChange: (k: string) => void }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {tabs.map((t) => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-sm font-display font-bold transition-colors ${active === t.key ? "bg-night text-gold-soft" : "bg-white border border-line text-ink-soft hover:bg-beige"}`}>
          {t.label}{t.count !== undefined && <span className={`mr-1.5 rounded-md px-1.5 text-[.7rem] ${active === t.key ? "bg-white/15" : "bg-beige"}`}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ---------- بطاقة إحصاء ----------
export function StatCard({ title, value, icon, tone = "gold", sub, onClick }: {
  title: string; value: ReactNode; icon: ReactNode; tone?: "gold" | "bad" | "warn" | "ok" | "ink"; sub?: string; onClick?: () => void;
}) {
  const tones = {
    gold: "bg-gold-soft text-gold-deep", bad: "bg-bad-soft text-bad", warn: "bg-warn-soft text-warn",
    ok: "bg-ok-soft text-ok", ink: "bg-night text-gold",
  }[tone];
  return (
    <div onClick={onClick} className={`bg-white rounded-2xl border border-line p-4 flex items-center gap-4 shadow-[0_1px_3px_rgba(28,24,18,.05)] ${onClick ? "cursor-pointer hover:border-gold transition-colors" : ""}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tones}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-[.72rem] font-bold text-ink-soft leading-tight">{title}</div>
        <div className="font-display font-black text-xl leading-tight mt-0.5">{value}</div>
        {sub && <div className="text-[.68rem] text-ink-soft mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}
