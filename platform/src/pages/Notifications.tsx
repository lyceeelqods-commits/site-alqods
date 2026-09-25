import { useEffect, useState } from "react";
import { AlertCircle, BellRing, CheckCheck, ExternalLink, Pencil, Send, Settings2 } from "lucide-react";
import { api, fmtDateTime, waLink } from "../api";
import { useApp, can } from "../store";
import { Badge, Button, Card, DataTable, Empty, Field, Input, Modal, Pagination, Select, Spinner, Tabs, Textarea } from "../ui";

const STATUS: any = { pending: ["قيد الانتظار", "warn"], sent: ["مرسل", "ok"], failed: ["فاشل", "bad"] };

export default function Notifications() {
  const { boot, toast, setPage } = useApp();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState("all");
  const [page, setPageN] = useState(1);
  const [templates, setTemplates] = useState<any[]>([]);
  const [compose, setCompose] = useState<any>(null);
  const [editTpl, setEditTpl] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [waError, setWaError] = useState<any>(null);
  const canSend = can(boot.user, "notifications");

  const load = () => {
    api(`/notifications?page=${page}&per_page=15&status=${tab}`).then(setData).catch((e) => toast("err", e.message));
    api("/templates").then(setTemplates).catch(() => {});
  };
  useEffect(load, [page, tab]);

  const openCompose = async () => {
    setCompose({ student_id: "", template_key: "manual", reason: "", message: "" });
    try {
      const d = await api("/students?page=1&per_page=1000");
      setStudents(d.rows);
    } catch { setStudents([]); }
  };

  // عند اختيار تلميذ/قالب → توليد معاينة
  const generatePreview = async (c: any) => {
    if (!c.student_id) return c;
    try {
      const s = await api(`/students/${c.student_id}`);
      const tpl = templates.find((t) => t.key === c.template_key);
      if (!tpl) return c;
      const msg = tpl.body
        .split("[اسم التلميذ]").join(s.student.full_name)
        .split("[القسم]").join(s.student.class_name || "—")
        .split("[عدد الساعات]").join(String(Math.ceil(s.stats.absence_hours)))
        .split("[المدة]").join("…")
        .split("[التاريخ]").join(new Date().toISOString().slice(0, 10))
        .split("[السبب]").join(c.reason || "…");
      return { ...c, message: msg };
    } catch { return c; }
  };

  const sendCompose = async () => {
    if (!compose.message.trim()) { toast("err", "نص الرسالة فارغ"); return; }
    try {
      const res: any = await api("/notifications", { method: "POST", body: compose });
      setCompose(null);
      toast("ok", "تم إنشاء الإشعار — في انتظار الإرسال");
      if (boot.settings.wa_enabled) sendNow(res.id);
      else window.open(res.wa_link, "_blank");
      load();
    } catch (e: any) { toast("err", e.message); }
  };

  const sendNow = async (id: number) => {
    try {
      await api(`/notifications/${id}/send`, { method: "POST" });
      toast("ok", "تم الإرسال عبر WhatsApp API بنجاح");
      load();
    } catch (e: any) {
      if (e.wa_link) {
        setWaError({ id, hint: e.hint, wa_link: e.wa_link });
      } else toast("err", e.message);
      load();
    }
  };

  const confirmManual = async (id: number) => {
    try {
      await api(`/notifications/${id}/confirm-manual`, { method: "POST" });
      toast("ok", "تم تأكيد الإرسال اليدوي");
      load();
    } catch (e: any) { toast("err", e.message); }
  };

  const saveTpl = async () => {
    try {
      await api(`/templates/${editTpl.id}`, { method: "PUT", body: { name: editTpl.name, body: editTpl.body } });
      toast("ok", "تم حفظ القالب");
      setEditTpl(null); load();
    } catch (e: any) { toast("err", e.message); }
  };

  if (!data) return <Spinner />;

  return (
    <div className="space-y-4">
      {/* حالة الربط */}
      {!boot.settings.wa_enabled ? (
        <div className="rounded-2xl bg-warn-soft border border-warn/30 px-4 py-3.5 flex flex-wrap items-center gap-3">
          <AlertCircle size={18} className="text-warn shrink-0" />
          <div className="text-sm font-bold text-warn flex-1 min-w-48">
            غير مرتبط بخدمة WhatsApp — الإرسال يتم يدوياً: انقر «فتح في واتساب» ثم أكّد الإرسال.
            لربط WhatsApp Business Cloud API، أدخل مفاتيح الحساب من الإعدادات.
          </div>
          {boot.user.role === "director" && <Button size="sm" variant="outline" onClick={() => setPage("settings")}><Settings2 size={14} /> الإعدادات</Button>}
        </div>
      ) : (
        <div className="rounded-2xl bg-ok-soft border border-ok/30 px-4 py-3 text-sm font-bold text-ok flex items-center gap-2">
          <CheckCheck size={17} /> WhatsApp Business API مربوط — الإرسال آلي مباشر من المنصة
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Tabs active={tab} onChange={(k) => { setTab(k); setPageN(1); }} tabs={[
          { key: "all", label: "الكل", count: data.counts.all },
          { key: "pending", label: "قيد الانتظار", count: data.counts.pending },
          { key: "sent", label: "مرسلة", count: data.counts.sent },
          { key: "failed", label: "فاشلة", count: data.counts.failed },
        ]} />
        {canSend && <Button variant="gold" className="mr-auto" onClick={openCompose}><Send size={15} /> رسالة جديدة</Button>}
      </div>

      <Card>
        <DataTable rows={data.rows} rowKey={(r) => r.id} empty={<Empty icon={<BellRing size={24} />} title="لا توجد إشعارات" />}
          columns={[
            { key: "student", label: "التلميذ(ة)", render: (r) => r.student_name ? <div><div className="font-display font-extrabold">{r.student_name}</div><div className="text-[.68rem] text-ink-soft font-bold" dir="ltr">{r.massar_id}</div></div> : "—" },
            { key: "guardian", label: "الولي / الهاتف", render: (r) => <div><div className="text-xs font-bold">{r.guardian_name || "—"}</div><div className="font-mono text-[.7rem] text-ink-soft" dir="ltr">{r.phone}</div></div> },
            { key: "reason", label: "السبب" },
            { key: "message", label: "الرسالة", render: (r) => <div className="max-w-56 truncate text-xs text-ink-soft" title={r.message}>{r.message.split("\n")[0]}…</div> },
            { key: "created", label: "التاريخ", render: (r) => fmtDateTime(r.created_at) },
            { key: "status", label: "الحالة", render: (r) => {
              const [label, tone] = STATUS[r.status];
              return <Badge tone={tone}>{label}{r.sent_via ? ` · ${r.sent_via}` : ""}</Badge>;
            }},
            { key: "actions", label: "إجراءات", render: (r) => (
              <div className="flex flex-wrap gap-1.5">
                {r.status !== "sent" && (
                  <a href={waLink(r.phone, r.message)} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[.72rem] font-display font-extrabold hover:border-gold">
                    <ExternalLink size={12} /> فتح في واتساب
                  </a>
                )}
                {r.status === "pending" && canSend && boot.settings.wa_enabled && (
                  <Button size="sm" variant="gold" onClick={() => sendNow(r.id)}>إرسال API</Button>
                )}
                {r.status === "pending" && canSend && (
                  <Button size="sm" variant="outline" onClick={() => confirmManual(r.id)}>تأكيد الإرسال</Button>
                )}
                {r.status === "failed" && canSend && (
                  <Button size="sm" variant="outline" onClick={() => sendNow(r.id)}>إعادة المحاولة</Button>
                )}
              </div>
            )},
          ]} />
        <Pagination page={page} total={data.total} perPage={15} onPage={setPageN} />
      </Card>

      {/* القوالب */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-extrabold">قوالب رسائل الأولياء</h3>
            <p className="text-xs text-ink-soft font-bold">المتغيرات المتاحة: [اسم التلميذ] [القسم] [المدة] [التاريخ] [عدد الساعات] [السبب]</p>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-xl border border-line p-4">
              <div className="flex items-center justify-between mb-2">
                <Badge tone="gold">{t.name}</Badge>
                {boot.user.role === "director" || boot.user.role === "admin" ? (
                  <button onClick={() => setEditTpl({ ...t })} className="w-7 h-7 rounded-lg hover:bg-beige grid place-items-center text-ink-soft"><Pencil size={13} /></button>
                ) : null}
              </div>
              <p className="text-[.72rem] text-ink-soft whitespace-pre-line leading-relaxed max-h-32 overflow-y-auto">{t.body}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* رسالة جديدة */}
      {compose && (
        <Modal open wide onClose={() => setCompose(null)} title="رسالة جديدة إلى ولي التلميذ">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Field label="التلميذ(ة) *">
                <Select value={compose.student_id} onChange={async (e: any) => setCompose(await generatePreview({ ...compose, student_id: e.target.value }))}>
                  <option value="">— اختر —</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} — {s.class_name}</option>)}
                </Select>
              </Field>
              <Field label="القالب">
                <Select value={compose.template_key} onChange={async (e: any) => setCompose(await generatePreview({ ...compose, template_key: e.target.value }))}>
                  {templates.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
                </Select>
              </Field>
              <Field label="السبب (يظهر في السجل)"><Input value={compose.reason} onChange={(e: any) => setCompose({ ...compose, reason: e.target.value })} placeholder="مثال: متابعة وضعية الغياب" /></Field>
            </div>
            <Field label="نص الرسالة *">
              <Textarea rows={9} value={compose.message} onChange={(e: any) => setCompose({ ...compose, message: e.target.value })} placeholder="اختر التلميذ والقالب للتوليد الآلي، أو اكتب الرسالة…" />
            </Field>
          </div>
          <div className="flex gap-2 justify-end mt-6">
            <Button variant="outline" onClick={() => setCompose(null)}>إلغاء</Button>
            <Button variant="gold" onClick={sendCompose} disabled={!compose.student_id}><Send size={15} /> إنشاء الإشعار</Button>
          </div>
        </Modal>
      )}

      {/* تعديل قالب */}
      {editTpl && (
        <Modal open onClose={() => setEditTpl(null)} title={`تعديل القالب: ${editTpl.name}`}>
          <Field label="الاسم"><Input value={editTpl.name} onChange={(e: any) => setEditTpl({ ...editTpl, name: e.target.value })} /></Field>
          <Field label="النص" className="mt-4"><Textarea rows={7} value={editTpl.body} onChange={(e: any) => setEditTpl({ ...editTpl, body: e.target.value })} /></Field>
          <div className="flex gap-2 justify-end mt-6">
            <Button variant="outline" onClick={() => setEditTpl(null)}>إلغاء</Button>
            <Button variant="gold" onClick={saveTpl}>حفظ القالب</Button>
          </div>
        </Modal>
      )}

      {/* تعذر الإرسال الآلي */}
      {waError && (
        <Modal open onClose={() => setWaError(null)} title="تعذر الإرسال الآلي">
          <p className="text-sm text-ink-soft leading-relaxed">{waError.hint || "غير مرتبط بخدمة WhatsApp"}</p>
          <div className="flex gap-2 justify-end mt-5">
            <a href={waError.wa_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-sm font-display font-bold text-white hover:bg-gold-deep"><ExternalLink size={15} /> فتح في واتساب</a>
            <Button variant="outline" onClick={() => { confirmManual(waError.id); setWaError(null); }}>أكّدت الإرسال يدوياً</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
