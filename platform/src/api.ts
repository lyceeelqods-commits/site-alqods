// عميل API موحد — يدعم الكوكي وتوكن Authorization (احتياطاً لبيئات iframe)
const TOKEN_KEY = "alqods_token";

export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function clearToken() { localStorage.removeItem(TOKEN_KEY); }

export async function api(path: string, opts: any = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch("/api" + path, {
    credentials: "same-origin",
    ...opts,
    headers: { ...headers, ...(opts.headers || {}) },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  let data: any = {};
  try { data = await res.json(); } catch { /* 204 */ }
  // حفظ التوكن بعد الدخول (احتياط الكوكيز المحجوبة)
  if (path === "/auth/login" && res.ok && data?.token) {
    try { localStorage.setItem(TOKEN_KEY, data.token); } catch { /* private mode */ }
  }
  if (res.status === 401 && getToken()) clearToken();
  if (!res.ok) {
    const err: any = new Error(data.error || `خطأ ${res.status}`);
    Object.assign(err, data);
    throw err;
  }
  return data;
}

export const todayStr = () => new Date().toISOString().slice(0, 10);
export const monthStr = () => new Date().toISOString().slice(0, 7);

export function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}
export function fmtDateTime(dt?: string | null) {
  if (!dt) return "—";
  return fmtDate(dt) + " " + dt.slice(11, 16);
}

// تصدير Excel (CSV بترميز UTF-8 وفاصل ;)
export function exportCSV(filename: string, columns: string[], rows: (string | number)[][]) {
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = "\uFEFF" + [columns.map(esc).join(";"), ...rows.map((r) => r.map(esc).join(";"))].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename + ".csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

// تنسيق الهاتف لواتساب
export function waPhone(phone: string, cc = "+212") {
  let p = String(phone || "").replace(/[\s\-().]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  const c = cc.replace("+", "");
  if (p.startsWith(c)) return p;
  if (p.startsWith("0")) return c + p.slice(1);
  return p;
}
export function waLink(phone: string, message: string, cc = "+212") {
  return `https://wa.me/${waPhone(phone, cc)}?text=${encodeURIComponent(message)}`;
}
