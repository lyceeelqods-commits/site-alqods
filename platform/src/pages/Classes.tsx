import { useEffect, useState } from "react";
import { Archive, DoorOpen, Pencil, Plus, Users } from "lucide-react";
import { api } from "../api";
import { useApp, can } from "../store";
import { Badge, Button, Card, Empty, Field, Input, Modal, Select, Spinner } from "../ui";

export default function Classes() {
  const { boot, toast, confirm, setPage } = useApp();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const canWrite = can(boot.user, "classes.write");

  const load = () => {
    setLoading(true);
    api("/bootstrap").then((b: any) => setClasses(b.classes)).catch((e) => toast("err", e.message)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async () => {
    if (!form.name?.trim() || !form.level_id) { toast("err", "اسم القسم والمستوى إلزاميان"); return; }
    try {
      if (form.mode === "add") await api("/classes", { method: "POST", body: form });
      else await api(`/classes/${form.id}`, { method: "PUT", body: form });
      toast("ok", form.mode === "add" ? "تم إنشاء القسم" : "تم تحديث القسم");
      setForm(null); load();
    } catch (e: any) { toast("err", e.message); }
  };

  const archive = async (c: any) => {
    const ok = await confirm({ title: `أرشفة القسم: ${c.name}؟`, message: "سيُخفى القسم من القوائم النشطة مع الحفاظ على كل سجلاته.", danger: true, confirmLabel: "أرشفة" });
    if (!ok) return;
    try { await api(`/classes/${c.id}/archive`, { method: "POST" }); toast("ok", "تمت أرشفة القسم"); load(); }
    catch (e: any) { toast("err", e.message); }
  };

  const openDetail = async (id: number) => {
    try { setDetail({ loading: true }); setDetail(await api(`/classes/${id}/detail`)); }
    catch (e: any) { toast("err", e.message); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft font-bold">{classes.length} قسم نشط — انقر على بطاقة لعرض قائمة التلاميذ</p>
        {canWrite && <Button variant="gold" onClick={() => setForm({ mode: "add", name: "", level_id: "", room: "" })}><Plus size={16} /> قسم جديد</Button>}
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {classes.map((c) => (
          <Card key={c.id} className="hover:border-gold transition-colors cursor-pointer" pad={false}>
            <div className="p-5" onClick={() => openDetail(c.id)}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-night text-gold grid place-items-center"><DoorOpen size={20} /></div>
                <Badge tone="gold">{c.level_name}</Badge>
              </div>
              <h3 className="font-display font-black text-lg">{c.name}</h3>
              <div className="text-xs text-ink-soft font-bold mt-0.5">القاعة: {c.room || "—"}</div>
              <div className="flex items-center gap-4 mt-4 text-sm">
                <span className="flex items-center gap-1.5 font-bold text-ink-soft"><Users size={14} /> {c.student_count} تلميذ(ة)</span>
              </div>
            </div>
            <div className="flex border-t border-line">
              <button onClick={() => openDetail(c.id)} className="flex-1 py-2.5 text-xs font-display font-extrabold hover:bg-beige">عرض القائمة</button>
              {canWrite && <>
                <button onClick={() => setForm({ mode: "edit", ...c })} className="w-12 grid place-items-center border-r border-line text-ink-soft hover:bg-beige"><Pencil size={14} /></button>
                <button onClick={() => archive(c)} className="w-12 grid place-items-center border-r border-line text-bad hover:bg-bad-soft"><Archive size={14} /></button>
              </>}
            </div>
          </Card>
        ))}
      </div>

      {form && (
        <Modal open onClose={() => setForm(null)} title={form.mode === "add" ? "إنشاء قسم جديد" : `تعديل القسم: ${form.name}`}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="اسم القسم *" className="sm:col-span-2"><Input value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} placeholder="مثال: الثانية باك علوم فيزيائية 3" /></Field>
            <Field label="المستوى *">
              <Select value={form.level_id} onChange={(e: any) => setForm({ ...form, level_id: e.target.value })}>
                <option value="">— اختر —</option>
                {boot.levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
            </Field>
            <Field label="القاعة"><Input value={form.room || ""} onChange={(e: any) => setForm({ ...form, room: e.target.value })} placeholder="مثال: 04" /></Field>
          </div>
          <div className="flex gap-2 justify-end mt-6">
            <Button variant="outline" onClick={() => setForm(null)}>إلغاء</Button>
            <Button variant="gold" onClick={save}>{form.mode === "add" ? "إنشاء" : "حفظ"}</Button>
          </div>
        </Modal>
      )}

      {detail && (
        <Modal open onClose={() => setDetail(null)} wide title={detail.loading ? "…" : `قائمة تلاميذ: ${detail.class.name}`}>
          {!detail.loading && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-xl bg-beige/70 px-3 py-2.5 text-center"><div className="text-[.65rem] font-bold text-ink-soft">التلاميذ</div><div className="font-display font-black">{detail.class.student_count}</div></div>
                <div className="rounded-xl bg-bad-soft px-3 py-2.5 text-center"><div className="text-[.65rem] font-bold text-bad">غياب اليوم</div><div className="font-display font-black text-bad">{detail.class.today_absences}</div></div>
                <div className="rounded-xl bg-warn-soft px-3 py-2.5 text-center"><div className="text-[.65rem] font-bold text-warn">تأخر اليوم</div><div className="font-display font-black text-warn">{detail.class.today_lates}</div></div>
              </div>
              {detail.students.length === 0 ? <Empty title="لا يوجد تلاميذ مسجلون بهذا القسم" /> : (
                <div className="max-h-80 overflow-y-auto -mx-5 px-5">
                  <table className="tbl">
                    <thead><tr><th>#</th><th>الاسم الكامل</th><th>رقم مسار</th><th>الجنس</th></tr></thead>
                    <tbody>
                      {detail.students.map((s: any, i: number) => (
                        <tr key={s.id}>
                          <td className="text-ink-soft">{i + 1}</td>
                          <td className="font-display font-bold">{s.full_name}</td>
                          <td className="font-mono text-xs" dir="ltr">{s.massar_id}</td>
                          <td>{s.gender === "M" ? "ذكر" : "أنثى"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-end gap-2 mt-5">
                <Button variant="outline" onClick={() => { setDetail(null); setPage("attendance"); }}>فتح ورقة الحضور</Button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
