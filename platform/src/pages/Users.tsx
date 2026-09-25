import { useEffect, useState } from "react";
import { KeyRound, Pencil, UserPlus } from "lucide-react";
import { api, fmtDateTime } from "../api";
import { ROLE_LABEL, Role, useApp } from "../store";
import { Badge, Button, Card, DataTable, Field, Input, Modal, Select, Spinner } from "../ui";

export default function UsersPage() {
  const { boot, toast } = useApp();
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<any>(null);
  const [reset, setReset] = useState<any>(null);

  const load = () => api("/users").then(setRows).catch((e) => toast("err", e.message));
  useEffect(load, []);

  const save = async () => {
    const f = form;
    if (!f.full_name?.trim() || !f.username?.trim() || !f.role) { toast("err", "أكمل الحقول الإلزامية"); return; }
    if (f.mode === "add" && (!f.password || f.password.length < 6)) { toast("err", "كلمة السر: 6 أحرف على الأقل"); return; }
    try {
      if (f.mode === "add") await api("/users", { method: "POST", body: f });
      else await api(`/users/${f.id}`, { method: "PUT", body: f });
      toast("ok", "تم حفظ المستخدم");
      setForm(null); load();
    } catch (e: any) { toast("err", e.message); }
  };

  const doReset = async () => {
    if (!reset.password || reset.password.length < 6) { toast("err", "كلمة السر: 6 أحرف على الأقل"); return; }
    try {
      await api(`/users/${reset.id}/reset-password`, { method: "POST", body: { password: reset.password } });
      toast("ok", `تم إعادة تعيين كلمة سر ${reset.username} — سيُفصل كل من جلساته`);
      setReset(null);
    } catch (e: any) { toast("err", e.message); }
  };

  const toggle = async (u: any) => {
    try {
      await api(`/users/${u.id}`, { method: "PUT", body: { active: u.active ? 0 : 1 } });
      load();
    } catch (e: any) { toast("err", e.message); }
  };

  if (!rows.length) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft font-bold">حسابات الموظفين وصلاحياتهم — يُتاح الوصول للمدير فقط</p>
        <Button variant="gold" onClick={() => setForm({ mode: "add", username: "", full_name: "", email: "", role: "surveillance", password: "" })}><UserPlus size={16} /> مستخدم جديد</Button>
      </div>

      <Card>
        <DataTable rows={rows} rowKey={(r) => r.id}
          columns={[
            { key: "username", label: "اسم المستخدم", render: (r) => <span className="font-mono font-bold" dir="ltr">{r.username}</span> },
            { key: "full_name", label: "الاسم الكامل", render: (r) => <span className="font-display font-extrabold">{r.full_name}</span> },
            { key: "role", label: "الدور", render: (r) => <Badge tone={r.role === "director" ? "ink" : "gold"}>{ROLE_LABEL[r.role as Role]}</Badge> },
            { key: "email", label: "البريد", render: (r) => <span className="text-xs" dir="ltr">{r.email || "—"}</span> },
            { key: "last_login", label: "آخر دخول", render: (r) => <span className="text-xs">{r.last_login_at || "لم يدخل بعد"}</span> },
            { key: "active", label: "الحالة", render: (r) => (
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={!!r.active} onChange={() => toggle(r)} className="w-4 h-4 accent-[#2e7d4f]" disabled={r.role === "director"} />
                <span className={`text-xs font-bold ${r.active ? "text-ok" : "text-bad"}`}>{r.active ? "نشط" : "موقوف"}</span>
              </label>
            )},
            { key: "actions", label: "إجراءات", render: (r) => (
              <div className="flex gap-1.5">
                <Button size="sm" variant="ghost" onClick={() => setForm({ mode: "edit", ...r })}><Pencil size={13} /> تعديل</Button>
                <Button size="sm" variant="ghost" onClick={() => setReset({ id: r.id, username: r.username, password: "" })}><KeyRound size={13} /> كلمة السر</Button>
              </div>
            )},
          ]} />
      </Card>

      {form && (
        <Modal open onClose={() => setForm(null)} title={form.mode === "add" ? "مستخدم جديد" : `تعديل: ${form.username}`}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="اسم المستخدم *"><Input value={form.username} onChange={(e: any) => setForm({ ...form, username: e.target.value })} disabled={form.mode === "edit"} dir="ltr" /></Field>
            <Field label="الاسم الكامل *"><Input value={form.full_name} onChange={(e: any) => setForm({ ...form, full_name: e.target.value })} /></Field>
            <Field label="البريد الإلكتروني"><Input value={form.email || ""} onChange={(e: any) => setForm({ ...form, email: e.target.value })} dir="ltr" /></Field>
            <Field label="الدور *">
              <Select value={form.role} onChange={(e: any) => setForm({ ...form, role: e.target.value })}>
                {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </Select>
            </Field>
            {form.mode === "add" && (
              <Field label="كلمة السر *" className="sm:col-span-2">
                <Input type="password" value={form.password} onChange={(e: any) => setForm({ ...form, password: e.target.value })} placeholder="6 أحرف على الأقل" />
              </Field>
            )}
          </div>
          <div className="rounded-xl bg-beige/70 px-4 py-3 text-[.72rem] font-bold text-ink-soft mt-4">
            الصلاحيات: المدير (كل شيء) · الحراسة العامة (التحضير والتأخرات والتنبيهات) · الإدارة (التلاميذ والتقارير) · الأستاذ (رصد الحضور فقط)
          </div>
          <div className="flex gap-2 justify-end mt-6">
            <Button variant="outline" onClick={() => setForm(null)}>إلغاء</Button>
            <Button variant="gold" onClick={save}>حفظ</Button>
          </div>
        </Modal>
      )}

      {reset && (
        <Modal open onClose={() => setReset(null)} title={`إعادة تعيين كلمة السر: ${reset.username}`}>
          <Field label="كلمة السر الجديدة *">
            <Input type="password" value={reset.password} onChange={(e: any) => setReset({ ...reset, password: e.target.value })} placeholder="6 أحرف على الأقل" />
          </Field>
          <p className="text-xs text-ink-soft font-bold mt-2">ستُلغى كل الجلسات النشطة لهذا المستخدم.</p>
          <div className="flex gap-2 justify-end mt-6">
            <Button variant="outline" onClick={() => setReset(null)}>إلغاء</Button>
            <Button variant="danger" onClick={doReset}>إعادة التعيين</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
