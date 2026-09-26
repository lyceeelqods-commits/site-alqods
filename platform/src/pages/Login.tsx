import { FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, LogIn, ShieldCheck, User } from "lucide-react";
import { api } from "../api";
import { Button, Field, Input } from "../ui";
import LogoMark from "../LogoMark";

export default function Login({ onLogin }: { onLogin: () => Promise<void> }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) { setError("المرجو إدخال اسم المستخدم وكلمة السر"); return; }
    setBusy(true);
    try {
      await api("/auth/login", { method: "POST", body: { username: username.trim(), password, remember } });
      await onLogin();
    } catch (err: any) {
      setError(err.message || "تعذر تسجيل الدخول");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" dir="rtl">
      {/* اللوحة التعريفية */}
      <div className="hidden lg:flex flex-col justify-between bg-night text-white p-10 w-[42%] relative overflow-hidden">
        <div className="absolute -left-24 -bottom-24 w-96 h-96 rounded-full border-[28px] border-gold/10" />
        <div className="absolute -left-8 -bottom-8 w-72 h-72 rounded-full border-[20px] border-gold/8" />
        <div className="flex items-center gap-3">
          <LogoMark className="w-14 h-14 rounded-2xl" />
          <div>
            <div className="font-display font-black text-lg">الثانوية التأهيلية القدس</div>
            <div className="text-gold text-xs font-bold">القنيطرة — المملكة المغربية</div>
          </div>
        </div>
        <div className="relative">
          <h1 className="font-display font-black text-4xl leading-snug">منصة <span className="text-gold">الحراسة العامة</span><br />للتدبير المدرسي</h1>
          <p className="text-white/60 text-sm leading-relaxed mt-4 max-w-md">
            نظام داخلي لتدبير التلاميذ والأقسام، رصد الحضور والغياب والتأخرات، وإشعار أولياء التلاميذ —
            مع صلاحيات دقيقة وسجل تدقيق كامل لكل العمليات.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-8 max-w-md">
            {[
              ["رصد الحضور", "في ثوانٍ، حصة بحصة"],
              ["تنبيهات آلية", "أكثر من 20 ساعة غياب أو 10 دقائق تأخر"],
              ["إشعار الأولياء", "واتساب للأعمال أو إرسال يدوي"],
              ["تقارير رسمية", "طباعة PDF وتصدير Excel"],
            ].map(([t, s]) => (
              <div key={t} className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                <div className="font-display font-extrabold text-gold text-sm">{t}</div>
                <div className="text-white/50 text-[.72rem] mt-1 leading-snug">{s}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-white/35 text-xs flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-gold" /> دخول مخصص لموظفي المؤسسة حسب الصلاحيات
        </div>
      </div>

      {/* استمارة الدخول */}
      <div className="flex-1 flex items-center justify-center p-6 bg-paper">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <LogoMark className="w-14 h-14 rounded-2xl" />
            <div>
              <div className="font-display font-black">الثانوية التأهيلية القدس</div>
              <div className="text-gold-deep text-xs font-bold">منصة الحراسة العامة — القنيطرة</div>
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-line shadow-xl p-7 md:p-9">
            <h2 className="font-display font-black text-2xl">تسجيل الدخول</h2>
            <p className="text-ink-soft text-sm mt-1 mb-6">أدخل بيانات حسابك المهني للمتابعة</p>

            <form onSubmit={submit} className="space-y-4">
              <Field label="اسم المستخدم أو البريد الإلكتروني">
                <div className="relative">
                  <User size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                  <Input value={username} onChange={(e: any) => setUsername(e.target.value)} placeholder="مثال: haraka" autoFocus autoComplete="username" className="pr-9" />
                </div>
              </Field>
              <Field label="كلمة السر">
                <div className="relative">
                  <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                  <Input type={showPw ? "text" : "password"} value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" className="pr-9 pl-9" />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 accent-[#c09a3e] rounded" />
                  <span className="font-bold text-ink-soft">تذكرني</span>
                </label>
                <button type="button" onClick={() => setForgot(true)} className="text-gold-deep font-bold hover:underline">نسيت كلمة السر؟</button>
              </div>

              {error && <div className="rounded-xl bg-bad-soft text-bad px-4 py-3 text-sm font-bold">{error}</div>}

              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? "جارٍ التحقق…" : <><LogIn size={17} /> الدخول إلى المنصة</>}
              </Button>
            </form>

            <div className="mt-6 rounded-2xl bg-beige/70 border border-line p-4">
              <div className="text-[.72rem] font-display font-extrabold text-ink-soft mb-2">حسابات العرض التجريبي (كلمة السر: alqods123)</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[.72rem] font-bold">
                {[["moudir", "مدير المؤسسة"], ["haraka", "الحراسة العامة"], ["idara", "الإدارة"], ["prof", "أستاذ(ة)"]].map(([u, r]) => (
                  <button key={u} onClick={() => { setUsername(u); setPassword("alqods123"); }}
                    className="flex items-center justify-between rounded-lg bg-white border border-line px-2.5 py-1.5 hover:border-gold transition-colors">
                    <span className="font-mono text-gold-deep" dir="ltr">{u}</span>
                    <span className="text-ink-soft">{r}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <a href="/" className="flex items-center justify-center gap-1.5 text-sm font-bold text-gold-deep hover:underline mt-5">
            <ArrowRight size={15} />
            العودة إلى الموقع الرسمي
          </a>
          <p className="text-center text-[.7rem] text-ink-soft mt-4">© 2026 الثانوية التأهيلية القدس — القنيطرة · نظام داخلي محمي</p>
        </div>
      </div>

      {forgot && (
        <div className="fixed inset-0 bg-black/45 z-50 grid place-items-center p-4" onMouseDown={(e) => e.target === e.currentTarget && setForgot(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-display font-extrabold text-lg mb-2">استعادة كلمة السر</h3>
            <p className="text-sm text-ink-soft leading-relaxed">
              لأسباب أمنية، لا تتم استعادة كلمات السر إلا عبر مدير المؤسسة.
              يرجى الاتصال بالإدارة داخلياً — سيتم إعادة تعيين كلمة السر من صفحة «المستخدمون».
            </p>
            <Button className="w-full mt-4" onClick={() => setForgot(false)}>فهمت</Button>
          </div>
        </div>
      )}
    </div>
  );
}
