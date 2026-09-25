import { useEffect, useState } from "react";
import { AlertTriangle, MessageCircle, Plus } from "lucide-react";
import { api, fmtDate, monthStr } from "../api";
import { useApp, can } from "../store";
import { Badge, Button, Card, DataTable, Empty, Field, Input, Modal, Pagination, Select, Spinner, Textarea } from "../ui";

export default function Absences() {
  const { boot, toast } = useApp();
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [cls, setCls] = useState("");
  const [month, setMonth] = useState(monthStr());
  const [just, setJust] = useState("");
  const [justForm, setJustForm] = useState<any>(null);
  const [addForm, setAddForm] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const canWrite = can(boot.user, "students.write");
  const absTh = boot.settings.absence_threshold_hours;

  const load = () => {
    api(`/absences?page=${page}&per_page=15&class_id=${cls}&month=${month}&justified=${just}`)
      .then(setData).catch((e) => toast("err", e.message));
  };
  useEffect(load, [page, cls, month, just]);

  const prepareNotice = async (s: any) => {
    try {
      const res: any = await api("/notifications", { method: "POST", body: { student_id: s.student_id ?? s.id, template_key: "absence_notice", reason: `تجاوز ${absTh} ساعة غياب` } });
      window.open(res.wa_link, "_blank");
      toast("info", "تم تحضير الإشعار — أكّد الإرسال من صفحة الإشعارات");
    } catch (e: any) { toast("err", e.message); }
  };

  const saveJust = async () => {
    try {
      await api(`/absences/${justForm.id}/justify`, { method: "POST", body: { justified: justForm.justified, reason: justForm.reason, document_ref: justForm.document_ref } });
      toast("ok", "تم تحديث حالة الغياب");
      setJustForm(null); load();
    } catch (e: any) { toast("err", e.message); }
  };

  const addAbsence = async () => {
    if (!addForm.student_id) { toast("err", "اختر التلميذ"); return; }
    try {
      await api("/absences/manual", { method: "POST", body: { ...addForm, hours: +addForm.hours || 1, justified: !!addForm.justified, student_id: +addForm.student_id } });
      toast("ok", "تم تسجيل الغياب");
      setAddForm(null); load();
    } catch (e: any) { toast("err", e.message); }
  };

  if (!data) return <Spinner />;
  const T = data.totals;

  return (
    <div className="space-y-4">
      {/* المجاميع */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          ["غياب اليوم", `${T.day.c} حالة`, `${Number(T.day.h).toLocaleString("fr-MA")} ساعة`],
          ["هذا الأسبوع", `${T.week.c} حالة`, `${Number(T.week.h).toLocaleString("fr-MA")} ساعة`],
          ["هذا الشهر", `${T.month.c} حالة`, `${Number(T.month.h).toLocaleString("fr-MA")} ساعة`],
          ["مجموع الساعات", Number(T.total_hours).toLocaleString("fr-MA"), "منذ بداية السنة"],
          ["ساعات مبررة", Number(T.justified_hours).toLocaleString("fr-MA"), "بوثائق مسندة"],
          ["غير مبررة", Number(T.unjustified_hours).toLocaleString("fr-MA"), "قيد المتابعة"],
        ].map(([t, v, s], i) => (
          <div key={t} className={`rounded-2xl border p-3.5 ${i === 5 ? "bg-bad-soft border-bad/25" : "bg-white border-line"}`}>
            <div className={`text-[.68rem] font-bold ${i === 5 ? "text-bad" : "text-ink-soft"}`}>{t}</div>
            <div className="font-display font-black text-lg mt-0.5">{v}</div>
            <div className="text-[.65rem] text-ink-soft mt-0.5">{s}</div>
          </div>
        ))}
      </div>

      {/* تلاميذ فوق العتبة */}
      {data.watchlist.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-bad-soft text-bad grid place-items-center"><AlertTriangle size={17} /></div>
            <div>
              <h3 className="font-display font-extrabold">تلاميذ يحتاجون إلى تنبيه</h3>
              <p className="text-xs text-ink-soft font-bold">مجموع غيابهم تجاوز {absTh} ساعة — يُنصح بإشعار الأولياء رسمياً</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {data.watchlist.map((s: any) => (
              <div key={s.id} className="rounded-xl border border-bad/25 bg-bad-soft/50 px-3.5 py-2.5 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-display font-extrabold text-sm truncate">{s.full_name}</div>
                  <div className="text-[.68rem] text-ink-soft font-bold">{s.class_name} · <span dir="ltr">{s.guardian_phone || "بدون هاتف"}</span></div>
                </div>
                <Badge tone="bad">{Number(s.hours).toLocaleString("fr-MA")} س</Badge>
                {can(boot.user, "notifications") && s.guardian_phone && (
                  <Button size="sm" variant="gold" onClick={() => prepareNotice(s)}><MessageCircle size={13} /></Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* الفلاتر */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-44"><label className="lbl">الشهر</label><Input type="month" value={month} onChange={(e) => { setMonth(e.target.value); setPage(1); }} /></div>
          <div className="w-52"><label className="lbl">القسم</label>
            <Select value={cls} onChange={(e) => { setCls(e.target.value); setPage(1); }}>
              <option value="">الكل</option>{boot.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select></div>
          <div className="w-40"><label className="lbl">الحالة</label>
            <Select value={just} onChange={(e) => { setJust(e.target.value); setPage(1); }}>
              <option value="">الكل</option><option value="0">غير مبرر</option><option value="1">مبرر</option>
            </Select></div>
          {canWrite && <Button variant="gold" className="mr-auto" onClick={async () => {
            setAddForm({ student_id: "", date: new Date().toISOString().slice(0, 10), hours: 1, period: "", justified: false, reason: "" });
            try { const d = await api(`/classes/${cls || boot.classes[0].id}/detail`); setStudents(d.students); } catch { setStudents([]); }
          }}><Plus size={16} /> غياب يدوي</Button>}
        </div>
      </Card>

      <Card>
        <DataTable rows={data.rows} rowKey={(r: any) => r.id} empty={<Empty title="لا توجد غيابات بهذه المعايير" />}
          columns={[
            { key: "student", label: "التلميذ(ة)", render: (r) => <div><div className="font-display font-extrabold">{r.full_name}</div><div className="text-[.68rem] text-ink-soft font-bold" dir="ltr">{r.massar_id}</div></div> },
            { key: "class", label: "القسم" },
            { key: "date", label: "التاريخ", render: (r) => <div>{fmtDate(r.date)}<div className="text-[.68rem] text-ink-soft">{r.period ? `حصة ${r.period}` : ""}</div></div> },
            { key: "hours", label: "الساعات", render: (r) => <Badge tone="gray">{r.hours} س</Badge> },
            { key: "subject", label: "المادة", render: (r) => r.subject_name || "—" },
            { key: "total", label: "مجموع التلميذ", render: (r) => <Badge tone={r.over_threshold ? "bad" : "gray"}>{Number(r.total_hours).toLocaleString("fr-MA")} س{r.over_threshold ? " ⚠" : ""}</Badge> },
            { key: "just", label: "الحالة", render: (r) => r.justified ? <Badge tone="ok">مبرر</Badge> : <Badge tone="warn">غير مبرر</Badge> },
            { key: "doc", label: "الوثيقة", render: (r) => r.document_ref ? <span className="font-mono text-[.7rem]" dir="ltr">{r.document_ref}</span> : "—" },
            { key: "actions", label: "إجراءات", render: (r) => (
              <div className="flex gap-1.5">
                {can(boot.user, "justify") && (
                  <Button size="sm" variant="ghost" onClick={() => setJustForm({ id: r.id, justified: !!r.justified, reason: r.reason || "", document_ref: r.document_ref || "" })}>
                    {r.justified ? "تعديل" : "تبرير"}
                  </Button>
                )}
              </div>
            )},
          ]} />
        <Pagination page={page} total={data.total} perPage={15} onPage={setPage} />
      </Card>

      {/* تبرير غياب */}
      {justForm && (
        <Modal open onClose={() => setJustForm(null)} title="تبرير الغياب">
          <div className="space-y-4">
            <Field label="الحالة">
              <Select value={justForm.justified ? "1" : "0"} onChange={(e: any) => setJustForm({ ...justForm, justified: e.target.value === "1" })}>
                <option value="0">غير مبرر</option><option value="1">مبرر</option>
              </Select>
            </Field>
            <Field label="السبب"><Textarea rows={2} value={justForm.reason} onChange={(e: any) => setJustForm({ ...justForm, reason: e.target.value })} placeholder="مرض، إذن إداري، ظرف عائلي…" /></Field>
            <Field label="مرجع الوثيقة المؤيدة"><Input value={justForm.document_ref} onChange={(e: any) => setJustForm({ ...justForm, document_ref: e.target.value })} placeholder="مثال: CERT-1234/2026" dir="ltr" /></Field>
          </div>
          <div className="flex gap-2 justify-end mt-6">
            <Button variant="outline" onClick={() => setJustForm(null)}>إلغاء</Button>
            <Button variant="gold" onClick={saveJust}>حفظ</Button>
          </div>
        </Modal>
      )}

      {/* غياب يدوي */}
      {addForm && (
        <Modal open onClose={() => setAddForm(null)} title="تسجيل غياب يدوي">
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
            <Field label="عدد الساعات"><Input type="number" min={0.5} step={0.5} value={addForm.hours} onChange={(e: any) => setAddForm({ ...addForm, hours: e.target.value })} /></Field>
            <Field label="الحالة">
              <Select value={addForm.justified ? "1" : "0"} onChange={(e: any) => setAddForm({ ...addForm, justified: e.target.value === "1" })}>
                <option value="0">غير مبرر</option><option value="1">مبرر</option>
              </Select>
            </Field>
            <Field label="السبب"><Input value={addForm.reason} onChange={(e: any) => setAddForm({ ...addForm, reason: e.target.value })} /></Field>
          </div>
          <div className="flex gap-2 justify-end mt-6">
            <Button variant="outline" onClick={() => setAddForm(null)}>إلغاء</Button>
            <Button variant="gold" onClick={addAbsence}>تسجيل</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
