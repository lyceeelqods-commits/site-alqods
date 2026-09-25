import { useCallback, useEffect, useRef, useState } from "react";
import {
  LayoutDashboard, Users, DoorOpen, ClipboardCheck, Clock3, BellRing, FileBarChart2,
  UserCog, Settings as SettingsIcon, History, LogOut, Menu, X, ShieldCheck,
} from "lucide-react";
import { api } from "./api";
import { AppCtx, Boot, Ctx, Role, Toast, can } from "./store";
import { Button, ConfirmDialog, Spinner } from "./ui";
import LogoMark from "./LogoMark";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Classes from "./pages/Classes";
import Attendance from "./pages/Attendance";
import Lates from "./pages/Lates";
import Absences from "./pages/Absences";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";
import UsersPage from "./pages/Users";
import SettingsPage from "./pages/Settings";
import Audit from "./pages/Audit";

const NAV: { key: string; label: string; icon: any; perm: string }[] = [
  { key: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard, perm: "dashboard" },
  { key: "students", label: "التلاميذ", icon: Users, perm: "students.view" },
  { key: "classes", label: "الأقسام", icon: DoorOpen, perm: "students.view" },
  { key: "attendance", label: "الحضور والغياب", icon: ClipboardCheck, perm: "attendance.write" },
  { key: "lates", label: "التأخرات", icon: Clock3, perm: "attendance.write" },
  { key: "absences", label: "الغيابات", icon: ClipboardCheck, perm: "students.view" },
  { key: "notifications", label: "الإشعارات", icon: BellRing, perm: "notifications" },
  { key: "reports", label: "التقارير", icon: FileBarChart2, perm: "reports" },
  { key: "users", label: "المستخدمون", icon: UserCog, perm: "users" },
  { key: "audit", label: "سجل النشاط", icon: History, perm: "audit" },
  { key: "settings", label: "الإعدادات", icon: SettingsIcon, perm: "settings.view" },
];
function navAllowed(perm: string, user: { role: Role } | null) {
  if (perm === "dashboard" || perm === "students.view") return !!user;
  return can(user, perm);
}

export default function App() {
  const [boot, setBoot] = useState<Boot | null>(null);
  const [checking, setChecking] = useState(true);
  const [page, setPageState] = useState<string>(() => (window.location.hash.slice(1) || "dashboard"));
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmOpts, setConfirmOpts] = useState<any>(null);
  const confirmRef = useRef<(v: boolean) => void>(() => {});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  useEffect(() => {
    api("/auth/me").then(() => loadBoot()).catch(() => setBoot(null)).finally(() => setChecking(false));
  }, []);

  useEffect(() => { window.location.hash = page; setSidebarOpen(false); }, [page]);

  const loadBoot = async () => setBoot(await api("/bootstrap"));

  const toast = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const confirm = useCallback((opts: any) => new Promise<boolean>((resolve) => {
    confirmRef.current = resolve;
    setConfirmOpts(opts);
  }), []);

  const ctx: Ctx = {
    boot: boot!, refreshBoot: loadBoot,
    logout: async () => { await api("/auth/logout", { method: "POST" }); setBoot(null); },
    toasts, toast, confirm, page, setPage: setPageState,
  };

  if (checking) return <div className="min-h-screen grid place-items-center"><Spinner label="جارٍ فتح المنصة…" /></div>;
  if (!boot) return <Login onLogin={loadBoot} />;

  const user = boot.user;
  const nav = NAV.filter((n) => navAllowed(n.perm, user));
  const PageComp: any = {
    dashboard: Dashboard, students: Students, classes: Classes, attendance: Attendance,
    lates: Lates, absences: Absences, notifications: Notifications, reports: Reports,
    users: UsersPage, settings: SettingsPage, audit: Audit,
  }[page] || Dashboard;

  return (
    <AppCtx.Provider value={ctx}>
      <div className="min-h-screen flex" dir="rtl">
        {/* الشريط الجانبي */}
        <aside className={`no-print fixed lg:sticky top-0 h-screen w-64 shrink-0 bg-night text-white/85 z-40 flex flex-col transition-transform ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}>
          <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8">
            <LogoMark className="w-11 h-11 rounded-xl" />
            <div className="min-w-0">
              <div className="font-display font-black text-[.95rem] leading-tight text-white truncate">{boot.settings.school_name}</div>
              <div className="text-[.68rem] text-gold font-bold">منصة الحراسة العامة — {boot.settings.school_city}</div>
            </div>
            <button className="lg:hidden mr-auto" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
          </div>
          <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
            {nav.map((n) => (
              <button key={n.key} onClick={() => setPageState(n.key)}
                className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-display font-bold transition-colors ${page === n.key ? "bg-gold text-night" : "text-white/70 hover:bg-white/8 hover:text-white"}`}>
                <n.icon size={17} />
                <span className="flex-1 text-right">{n.label}</span>
                {n.key === "notifications" && boot.pending_notifications > 0 && (
                  <span className={`text-[.65rem] rounded-md px-1.5 py-0.5 ${page === n.key ? "bg-night text-gold" : "bg-bad text-white"}`}>{boot.pending_notifications}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="px-5 py-4 border-t border-white/8 text-[.68rem] text-white/40">
            <div className="flex items-center gap-1.5 mb-1"><ShieldCheck size={12} className="text-gold" /> السنة الدراسية {boot.settings.academic_year}</div>
            <div>نظام التدبير الداخلي — وصول حسب الصلاحيات</div>
          </div>
        </aside>
        {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* المحتوى */}
        <div className="flex-1 min-w-0 flex flex-col">
          <header className="no-print sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-line">
            <div className="flex items-center gap-3 px-4 md:px-6 py-3">
              <button className="lg:hidden w-9 h-9 rounded-xl hover:bg-beige grid place-items-center" onClick={() => setSidebarOpen(true)}><Menu size={18} /></button>
              <div className="hidden md:block">
                <div className="font-display font-black text-[1.05rem]">{nav.find((n) => n.key === page)?.label || "منصة الحراسة العامة"}</div>
                <div className="text-[.7rem] text-ink-soft font-bold">{new Intl.DateTimeFormat("ar-MA", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}</div>
              </div>
              <div className="mr-auto flex items-center gap-2">
                <span className="hidden sm:inline-flex rounded-xl bg-gold-soft text-gold-deep px-3 py-1.5 text-xs font-display font-extrabold">{boot.settings.academic_year}</span>
                <button onClick={() => setPageState("notifications")} className="relative w-9 h-9 rounded-xl hover:bg-beige grid place-items-center text-ink-soft">
                  <BellRing size={18} />
                  {boot.pending_notifications > 0 && <span className="absolute -top-0.5 -left-0.5 min-w-4 h-4 rounded-full bg-bad text-white text-[.6rem] font-bold grid place-items-center px-1">{boot.pending_notifications}</span>}
                </button>
                <div className="relative">
                  <button onClick={() => setUserMenu((v) => !v)} className="flex items-center gap-2.5 rounded-xl hover:bg-beige pl-2 pr-1.5 py-1.5">
                    <div className="w-8 h-8 rounded-lg bg-night text-gold grid place-items-center font-display font-black text-sm">{user.full_name.slice(0, 2)}</div>
                    <div className="hidden sm:block text-right">
                      <div className="text-xs font-display font-extrabold leading-tight">{user.full_name}</div>
                      <div className="text-[.65rem] text-gold-deep font-bold leading-tight">{{ director: "مدير المؤسسة", surveillance: "الحراسة العامة", teacher: "أستاذ(ة)", admin: "الإدارة" }[user.role]}</div>
                    </div>
                  </button>
                  {userMenu && (
                    <div className="absolute left-0 top-full mt-1.5 bg-white rounded-xl border border-line shadow-lg py-1.5 w-44 z-30">
                      <div className="px-3.5 py-1.5 text-[.68rem] text-ink-soft border-b border-line mb-1">{user.username} — {user.email}</div>
                      <button onClick={() => { setUserMenu(false); ctx.logout(); }} className="w-full flex items-center gap-2 px-3.5 py-2 text-sm font-bold text-bad hover:bg-bad-soft">
                        <LogOut size={15} /> تسجيل الخروج
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 print-full">
            <PageComp />
          </main>
          <footer className="no-print px-6 py-4 text-center text-[.68rem] text-ink-soft">
            الثانوية التأهيلية القدس — القنيطرة · منصة الحراسة العامة · جميع البيانات محفوظة في قاعدة بيانات المؤسسة
          </footer>
        </div>

        {/* الإشعارات المنبثقة */}
        <div className="fixed bottom-5 right-5 z-[60] space-y-2 w-80 max-w-[calc(100vw-2.5rem)]">
          {toasts.map((t) => (
            <div key={t.id} className={`rounded-xl px-4 py-3 text-sm font-bold shadow-lg animate-[slideIn_.2s_ease-out] flex items-start gap-2 ${t.kind === "ok" ? "bg-night text-gold-soft" : t.kind === "err" ? "bg-bad text-white" : "bg-white border border-line text-ink"}`}>
              {t.text}
            </div>
          ))}
        </div>

        <ConfirmDialog opts={confirmOpts} onResult={(v) => { confirmRef.current(v); setConfirmOpts(null); }} />
      </div>
    </AppCtx.Provider>
  );
}
