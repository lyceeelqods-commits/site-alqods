import { useEffect, useState } from "react";
import { AlertTriangle, MessageCircle, Plus } from "lucide-react";
import { api, fmtDate, monthStr, waLink } from "../api";
import { useApp, can } from "../store";
import { Badge, Button, Card, DataTable, Empty, Field, Input, Modal, Pagination, Select, Spinner, Textarea } from "../ui";

export default function Lates() {
  const { boot, toast, confirm } = useApp();
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [cls, setCls] = useState("");
  const [month, setMonth] = useState(monthStr());
  const [overOnly, setOverOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState<any>(null);
  const [justForm, setJustForm] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const canWrite = can(boot.user, "attendance.write");
  const lateTh = boot.settings.late_threshold_minutes;

  const load = () => {
    setLoading(true);
    api(`/lates?page=${page}&per_page=15&class_id=${cls}&month=${month}&over_threshold=${overOnly ? 1 : ""}`)
      .then((d) => { setRows(d.rows); setTotal(d.total); })
      .catch((e) => toast("err", e.message)).finally(() => setLoading(false));
  };
  useEffect(load, [page, cls, month, overOnly]);

  const add = async () => {
    const f = addForm;
    if (!f.student_id || !f.minutes) { toast("err", "اختر التلميذ وأدخل مدة التأخر"); return; }
    try {
      const res: any = await api("/lates", { method: "POST", body: { ...f, minutes: +f.minutes, justified: !!f.justified } });
      toast("ok", "تم تسجيل التأخر");
      if (res.over_threshold) {
        toast("info", `⚠ تجاوز التأخر عتبة ${lateTh} دقائق — تحضير إشعار الولي مطلوب`);
        prepareNotice({ student_id: f.student_id, minutes: +f.minutes });
      }
      setAddForm(null); load();
    } catch (e: any) { toast("err", e.message); }
  };

  const prepareNotice = async (r: any) => {
    try {
      const res: any = await api("/notifications", { method: "POST", body: { student_id: r.student_id, template_key: "late_notice", reason: `تأخر ${r.minutes} دقيقة (فوق العتبة)` } });
      window.open(res.wa_link, "_blank");
      toast("info", "تم تحضير الإشعار — أكّد الإرسال من صفحة الإشعارات");
    } catch (e: any) { toast("err", e.message); }
  };

  const saveJust = async () => {
    try {
      await api(`/lates/${justForm.id}/justify`, { method: "POST", body: { justified: justForm.justified, reason: justForm.reason } });
      toast("ok", "تم تحديث حالة التأخر");
      setJustForm(null); load();
    } catch (e: any) { toast("err", e.message); }
  };

  const openAdd = async () => {
    setAddForm({ student_id: "", date: new Date().toISOString().slice(0, 10), time: "08:10", minutes: 5, reason: "", justified: false });
    try {
      const clsId = cls || boot.classes[0]?.id;
      const d = await api(`/classes/${clsId}/detail`);
      setStudents(d.students);
    } catch { setStudents([]); }
  };

  const overCount = rows.filter((r) => r.over_threshold).length;

  return (
    <div className="space-y-4">
      <Card className="!p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-48"><label className="lbl">الشهر</label><Input type="month" value={month} onChange={(e) => { setMonth(e.target.value); setPage(1); }} /></div>
          <div className="w-52"><label className="lbl">القسم</label>
            <Select value={cls} onChange={(e) => { setCls(e.target.value); setPage(1); }}>
              <option value="">الكل</option>{boot.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select></div>
          <label className="flex items-center gap-2 text-sm font-bold cursor-pointer select-none pb-2">
            <input type="checkbox" checked={overOnly} onChange={(e) => { setOverOnly(e.target.checked); setPage(1); }} className="w-4 h-4 accent-[#b91c1c]" />
            التأخرات فوق {lateTh} دقائق فقط
          </label>
          {canWrite && <Button variant="gold" className="mr-auto" onClick={openAdd}><Plus size={16} /> تسجيل تأخر</Button>}
        </div>
      </Card>

      <Card>
        {loading ? <Spinner /> : (
          <>
            {overCount > 0 && (
              <div className="rounded-xl bg-warn-soft border border-warn/30 px-4 py-3 mb-4 flex items-center gap-2 text-sm font-bold text-warn">
                <AlertTriangle size={16} /> {overCount} حالة تأخر في هذه الصفحة تجاوزت عتبة {lateTh} دقائق — تتطلب إشعار الأولياء
              </div>
            )}
            <DataTable rows={rows} rowKey={(r) => r.id} empty={<Empty title="لا توجد تأخرات مسجلة" sub="غيّر الفلاتر أو سجّل تأخراً جديداً" />}
              columns={[
                { key: "student", label: "التلميذ(ة)", render: (r) => <div><div className="font-display font-extrabold">{r.full_name}</div><div className="text-[.68rem] text-ink-soft font-bold">{r.class_name} · {r.student_late_count} مرات</div></div> },
                { key: "date", label: "التاريخ والوقت", render: (r) => <div>{fmtDate(r.date)}<div className="text-[.68rem] text-ink-soft font-mono" dir="ltr">{r.time || ""}</div></div> },
                { key: "minutes", label: "مدة التأخر", render: (r) => <Badge tone={r.over_threshold ? "bad" : "gray"}>{r.minutes} دقيقة{r.over_threshold ? " ⚠" : ""}</Badge> },
                { key: "reason", label: "السبب", render: (r) => r.reason || "—" },
                { key: "just", label: "الحالة", render: (r) => <Badge tone={r.justified ? "ok" : "warn"}>{r.justified ? "مبرر" : "غير مبرر"}</Badge> },
                { key: "notified", label: "إشعار الولي", render: (r) => r.over_threshold ? (r.notified ? <Badge tone="ok">تم</Badge> : <Badge tone="bad">مطلوب</Badge>) : <span className="text-ink-soft text-xs">—</span> },
                { key: "actions", label: "إجراءات", render: (r) => (
                  <div className="flex items-center gap-1.5">
                    {can(boot.user, "justify") && (
                      <Button size="sm" variant="ghost" onClick={() => setJustForm({ id: r.id, justified: !!r.justified, reason: r.reason || "" })}>تبرير</Button>
                    )}
                    {can(boot.user, "notifications") && r.over_threshold && !r.notified && (
                      <Button size="sm" variant="gold" onClick={() => prepareNotice(r)}><MessageCircle size={13} /> إشعار الولي</Button>
                    )}
                  </div>
                )},
              ]} />
            <Pagination page={page} total={total} perPage={15} onPage={setPage} />
          </>
        )}
      </Card>

      {/* تسجيل تأخر جديد */}
      {addForm && (
        <Modal open onClose={() => setAddForm(null)} title="تسجيل تأخر جديد (بوابة الحراسة)">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="القسم" className="sm:col-span-2">
              <Select value={cls || boot.classes[0]?.id} onChange={async (e: any) => { const d = await api(`/classes/${e.target.value}/detail`); setStudents(d.students); }}>
                {boot.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="التلميذ(ة) *" className="sm:col-span-2">
              <Select value={addForm.student_id} onChange={(e: any) => setAddForm({ ...addForm, student_id: e.target.value })}>
                <option value="">— اختر —</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.massar_id})</option>)}
              </Select>
            </Field>
            <Field label="التاريخ"><Input type="date" value={addForm.date} onChange={(e: any) => setAddForm({ ...addForm, date: e.target.value })} /></Field>
            <Field label="وقت الوصول"><Input type="time" value={addForm.time} onChange={(e: any) => setAddForm({ ...addForm, time: e.target.value })} /></Field>
            <Field label="مدة التأخر (دقائق) *">
              <Input type="number" min={1} value={addForm.minutes} onChange={(e: any) => setAddForm({ ...addForm, minutes: e.target.value })} />
              {+addForm.minutes > lateTh && <p className="text-bad text-xs mt-1 font-bold">⚠ فوق عتبة {lateTh} دقائق — سيُحضّر إشعار الولي تلقائياً</p>}
            </Field>
            <Field label="مبرر؟">
              <Select value={addForm.justified ? "1" : "0"} onChange={(e: any) => setAddForm({ ...addForm, justified: e.target.value === "1" })}>
                <option value="0">غير مبرر</option><option value="1">مبرر</option>
              </Select>
            </Field>
            <Field label="السبب" className="sm:col-span-2"><Textarea rows={2} value={addForm.reason} onChange={(e: any) => setAddForm({ ...addForm, reason: e.target.value })} placeholder="ازدحام المرور، انقطاع النقل…" /></Field>
          </div>
          <div className="flex gap-2 justify-end mt-6">
            <Button variant="outline" onClick={() => setAddForm(null)}>إلغاء</Button>
            <Button variant="gold" onClick={add}>تسجيل</Button>
          </div>
        </Modal>
      )}

      {/* تبرير تأخر */}
      {justForm && (
        <Modal open onClose={() => setJustForm(null)} title="تبرير / تعديل حالة التأخر">
          <div className="space-y-4">
            <Field label="الحالة">
              <Select value={justForm.justified ? "1" : "0"} onChange={(e: any) => setJustForm({ ...justForm, justified: e.target.value === "1" })}>
                <option value="0">غير مبرر</option><option value="1">مبرر</option>
              </Select>
            </Field>
            <Field label="السبب / الوثيقة"><Textarea rows={2} value={justForm.reason} onChange={(e: any) => setJustForm({ ...justForm, reason: e.target.value })} /></Field>
          </div>
          <div className="flex gap-2 justify-end mt-6">
            <Button variant="outline" onClick={() => setJustForm(null)}>إلغاء</Button>
            <Button variant="gold" onClick={saveJust}>حفظ</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
