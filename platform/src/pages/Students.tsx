import { useEffect, useState } from "react";
import { Archive, ArchiveRestore, Eye, Pencil, Phone, Search, UserPlus, AlertTriangle, MessageCircle } from "lucide-react";
import { api, fmtDate, fmtDateTime, waLink } from "../api";
import { useApp, can } from "../store";
import { Badge, Button, Card, DataTable, Empty, Field, Input, Modal, Pagination, Select, Spinner, Tabs, Textarea } from "../ui";

const EMPTY_FORM = { full_name: "", gender: "M", birth_date: "", massar_id: "", level_id: "", class_id: "", father_name: "", mother_name: "", guardian_name: "", guardian_phone: "", whatsapp: "", address: "", notes: "" };

export default function Students() {
  const { boot, toast, confirm } = useApp();
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("");
  const [cls, setCls] = useState("");
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(null); // null | {mode, id, ...}
  const [errors, setErrors] = useState<any>({});
  const [profile, setProfile] = useState<any>(null);
  const [profileTab, setProfileTab] = useState("history");
  const canWrite = can(boot.user, "students.write");

  const load = () => {
    setLoading(true);
    api(`/students?page=${page}&per_page=12&q=${encodeURIComponent(q)}&level_id=${level}&class_id=${cls}&status=${status}`)
      .then((d) => { setRows(d.rows); setTotal(d.total); })
      .catch((e) => toast("err", e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, [page, q, level, cls, status]);

  const classes = level ? boot.classes.filter((c) => c.level_id === +level) : boot.classes;

  const save = async () => {
    const errs: any = {};
    if (!form.full_name?.trim()) errs.full_name = "الاسم الكامل إلزامي";
    if (form.guardian_phone && !/^[0+][0-9\s-]{8,}$/.test(form.guardian_phone)) errs.guardian_phone = "رقم الهاتف غير صحيح";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      const body = { ...form, level_id: form.level_id || null, class_id: form.class_id || null };
      if (form.mode === "add") await api("/students", { method: "POST", body });
      else await api(`/students/${form.id}`, { method: "PUT", body });
      toast("ok", form.mode === "add" ? "تمت إضافة التلميذ(ة) بنجاح" : "تم تحديث بيانات التلميذ(ة)");
      setForm(null);
      load();
    } catch (e: any) { toast("err", e.message); }
  };

  const archive = async (s: any) => {
    const ok = await confirm({
      title: `أرشفة: ${s.full_name}؟`,
      message: "لن يظهر التلميذ في القوائم النشطة، وستُحفظ كل بياناته وسجلّه في الأرشيف. يمكن استرجاعه لاحقاً.\nلا يتم الحذف النهائي أبداً حفاظاً على المعلومات.",
      danger: true, confirmLabel: "أرشفة",
    });
    if (!ok) return;
    try { await api(`/students/${s.id}/archive`, { method: "POST" }); toast("ok", "تمت أرشفة التلميذ(ة)"); load(); }
    catch (e: any) { toast("err", e.message); }
  };
  const restore = async (s: any) => {
    try { await api(`/students/${s.id}/restore`, { method: "POST" }); toast("ok", "تم استرجاع التلميذ(ة)"); load(); }
    catch (e: any) { toast("err", e.message); }
  };

  const openProfile = async (id: number) => {
    try { setProfile({ loading: true }); setProfile(await api(`/students/${id}`)); setProfileTab("history"); }
    catch (e: any) { toast("err", e.message); }
  };

  const formBody = form && (
    <Modal open wide onClose={() => setForm(null)} title={form.mode === "add" ? "إضافة تلميذ(ة) جديد" : `تعديل بيانات: ${form.full_name}`}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="الاسم الكامل *" error={errors.full_name}><Input value={form.full_name} onChange={(e: any) => setForm({ ...form, full_name: e.target.value })} /></Field>
        <Field label="رقم مسار" error={errors.massar} className=""><Input value={form.massar_id} onChange={(e: any) => setForm({ ...form, massar_id: e.target.value })} placeholder="R130xxxxx (اختياري — يُولَّد تلقائياً)" dir="ltr" /></Field>
        <Field label="الجنس">
          <Select value={form.gender} onChange={(e: any) => setForm({ ...form, gender: e.target.value })}>
            <option value="M">ذكر</option><option value="F">أنثى</option>
          </Select>
        </Field>
        <Field label="تاريخ الازدياد"><Input type="date" value={form.birth_date} onChange={(e: any) => setForm({ ...form, birth_date: e.target.value })} /></Field>
        <Field label="المستوى">
          <Select value={form.level_id} onChange={(e: any) => setForm({ ...form, level_id: e.target.value, class_id: "" })}>
            <option value="">— اختر —</option>
            {boot.levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </Select>
        </Field>
        <Field label="القسم">
          <Select value={form.class_id} onChange={(e: any) => setForm({ ...form, class_id: e.target.value })}>
            <option value="">— اختر —</option>
            {(form.level_id ? boot.classes.filter((c) => c.level_id === +form.level_id) : boot.classes).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="اسم الأب"><Input value={form.father_name} onChange={(e: any) => setForm({ ...form, father_name: e.target.value })} /></Field>
        <Field label="اسم الأم"><Input value={form.mother_name} onChange={(e: any) => setForm({ ...form, mother_name: e.target.value })} /></Field>
        <Field label="اسم الولي"><Input value={form.guardian_name} onChange={(e: any) => setForm({ ...form, guardian_name: e.target.value })} /></Field>
        <Field label="هاتف الولي" error={errors.guardian_phone}><Input value={form.guardian_phone} onChange={(e: any) => setForm({ ...form, guardian_phone: e.target.value })} placeholder="06XXXXXXXX" dir="ltr" /></Field>
        <Field label="رقم WhatsApp" className="sm:col-span-2"><Input value={form.whatsapp} onChange={(e: any) => setForm({ ...form, whatsapp: e.target.value })} placeholder="إن كان مختلفاً عن هاتف الولي" dir="ltr" /></Field>
        <Field label="العنوان" className="sm:col-span-2"><Input value={form.address} onChange={(e: any) => setForm({ ...form, address: e.target.value })} /></Field>
        <Field label="ملاحظات" className="sm:col-span-2"><Textarea rows={2} value={form.notes} onChange={(e: any) => setForm({ ...form, notes: e.target.value })} placeholder="حالة صحية، متابعة خاصة…" /></Field>
      </div>
      <div className="flex gap-2 justify-end mt-6">
        <Button variant="outline" onClick={() => setForm(null)}>إلغاء</Button>
        <Button variant="gold" onClick={save}>{form.mode === "add" ? "إضافة التلميذ(ة)" : "حفظ التعديلات"}</Button>
      </div>
    </Modal>
  );

  const profileBody = profile && !profile.loading && (
    <Modal open wide onClose={() => setProfile(null)} title={`ملف التلميذ(ة): ${profile.student.full_name}`}>
      {/* التنبيهات */}
      {(profile.alerts.absence_over || profile.alerts.late_over) && (
        <div className="rounded-xl bg-bad-soft border border-bad/30 px-4 py-3 mb-4 flex items-start gap-2.5 text-sm">
          <AlertTriangle size={17} className="text-bad shrink-0 mt-0.5" />
          <div className="font-bold text-bad">
            {profile.alerts.absence_over && <div>مجموع ساعات الغياب ({Number(profile.stats.absence_hours).toLocaleString("fr-MA")} س) تجاوز عتبة التنبيه ({boot.settings.absence_threshold_hours} ساعة) — يُنصح بإشعار الولي</div>}
            {profile.alerts.late_over && <div>سُجل تأخر قدره {profile.stats.max_minutes} دقيقة (فوق عتبة {boot.settings.late_threshold_minutes} دقائق)</div>}
          </div>
        </div>
      )}
      {/* معلومات شخصية */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
        {[
          ["رقم مسار", profile.student.massar_id], ["الجنس", profile.student.gender === "M" ? "ذكر" : "أنثى"],
          ["تاريخ الازدياد", fmtDate(profile.student.birth_date)], ["القسم", profile.student.class_name || "—"],
          ["اسم الأب", profile.student.father_name || "—"], ["اسم الأم", profile.student.mother_name || "—"],
          ["الولي", profile.student.guardian_name || "—"], ["هاتف الولي", profile.student.guardian_phone || "—"],
          ["WhatsApp", profile.student.whatsapp || "—"], ["العنوان", profile.student.address || "—"],
        ].map(([k, v]) => (
          <div key={k as string} className="rounded-xl bg-beige/60 px-3 py-2">
            <div className="text-[.65rem] font-bold text-ink-soft">{k}</div>
            <div className="font-bold text-[.8rem] mt-0.5 truncate" dir={(k as string).includes("مسار") || (k as string).includes("هاتف") ? "ltr" : undefined}>{v}</div>
          </div>
        ))}
      </div>
      {profile.student.notes && <div className="rounded-xl bg-warn-soft px-3.5 py-2.5 text-xs font-bold text-warn mb-4">ملاحظة: {profile.student.notes}</div>}
      {/* الإحصاءات */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mb-5">
        {[
          ["مجموع الغياب", `${Number(profile.stats.absence_hours).toLocaleString("fr-MA")} س`, "bad"],
          ["ساعات مبررة", `${Number(profile.stats.justified_hours).toLocaleString("fr-MA")} س`, "ok"],
          ["غير مبررة", `${Number(profile.stats.unjustified_hours).toLocaleString("fr-MA")} س`, "warn"],
          ["مرات التأخر", profile.stats.late_count, "warn"],
          ["أطول تأخر", `${profile.stats.max_minutes} د`, "gray"],
          ["إشعارات الأولياء", profile.notifications.length, "gold"],
        ].map(([k, v, tone]: any) => (
          <div key={k} className="rounded-xl border border-line px-3 py-2 text-center">
            <div className="text-[.62rem] font-bold text-ink-soft">{k}</div>
            <div className={`font-display font-black text-sm mt-0.5 ${tone === "bad" ? "text-bad" : tone === "warn" ? "text-warn" : tone === "ok" ? "text-ok" : ""}`}>{v}</div>
          </div>
        ))}
      </div>

      <Tabs active={profileTab} onChange={setProfileTab} tabs={[
        { key: "history", label: "سجل الحضور" }, { key: "lates", label: "التأخرات" }, { key: "notifs", label: "الرسائل المرسلة" },
      ]} />

      <div className="mt-3 max-h-72 overflow-y-auto">
        {profileTab === "history" && (
          <DataTable rows={profile.history} empty={<Empty title="لا يوجد سجل حضور بعد" />} rowKey={(r) => r.id}
            columns={[
              { key: "date", label: "التاريخ", render: (r) => fmtDate(r.date) },
              { key: "period", label: "الحصة", render: (r) => r.period ? `حصة ${r.period}` : "—" },
              { key: "subject", label: "المادة", render: (r) => r.subject_name || "—" },
              { key: "status", label: "الحالة", render: (r) => r.status === "present" ? <Badge tone="ok">حاضر</Badge> : r.status === "absent" ? <Badge tone="bad">غائب {r.justified ? "(مبرر)" : ""}</Badge> : <Badge tone="warn">متأخر {r.late_minutes}د</Badge> },
              { key: "hours", label: "الساعات", render: (r) => r.status === "absent" ? `${r.hours} س` : "—" },
              { key: "by", label: "رصده", render: (r) => "مستخدم #" + (r.recorded_by ?? "—") },
            ]} />
        )}
        {profileTab === "lates" && (
          <DataTable rows={profile.lates} empty={<Empty title="لا توجد تأخرات مسجلة" />} rowKey={(r) => r.id}
            columns={[
              { key: "date", label: "التاريخ", render: (r) => `${fmtDate(r.date)} — ${r.time || ""}` },
              { key: "minutes", label: "المدة", render: (r) => <Badge tone={r.minutes > boot.settings.late_threshold_minutes ? "bad" : "gray"}>{r.minutes} دقيقة</Badge> },
              { key: "reason", label: "السبب", render: (r) => r.reason || "—" },
              { key: "justified", label: "الحالة", render: (r) => r.justified ? <Badge tone="ok">مبرر</Badge> : <Badge tone="warn">غير مبرر</Badge> },
            ]} />
        )}
        {profileTab === "notifs" && (
          <DataTable rows={profile.notifications} empty={<Empty title="لم تُرسل رسائل لهذا الولي" />} rowKey={(r) => r.id}
            columns={[
              { key: "created", label: "التاريخ", render: (r) => fmtDateTime(r.created_at) },
              { key: "reason", label: "السبب" },
              { key: "status", label: "الحالة", render: (r) => r.status === "sent" ? <Badge tone="ok">مرسل</Badge> : r.status === "pending" ? <Badge tone="warn">قيد الانتظار</Badge> : <Badge tone="bad">فاشل</Badge> },
            ]} />
        )}
      </div>

      {can(boot.user, "notifications") && profile.student.guardian_phone && (
        <div className="flex gap-2 justify-end mt-5 pt-4 border-t border-line">
          <Button variant="outline" onClick={() => window.open(waLink(profile.student.whatsapp || profile.student.guardian_phone, `السلام عليكم، ${profile.student.guardian_name || ""}\nنتواصل معكم بخصوص وضعية ابنكم/ابنتكم ${profile.student.full_name} المتمدرس(ة) بالقسم ${profile.student.class_name}.\nإدارة الثانوية التأهيلية القدس.`), "_blank")}><Phone size={15} /> اتصال مباشر</Button>
          <Button variant="gold" onClick={async () => {
            try {
              const res: any = await api("/notifications", { method: "POST", body: { student_id: profile.student.id, template_key: "absence_notice", reason: "متابعة وضعية الغياب" } });
              window.open(res.wa_link, "_blank");
              toast("info", "تم تحضير الإشعار — أكّد الإرسال من صفحة الإشعارات");
            } catch (e: any) { toast("err", e.message); }
          }}><MessageCircle size={15} /> إشعار الولي</Button>
        </div>
      )}
    </Modal>
  );

  return (
    <div className="space-y-4">
      {/* شريط الأدوات */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-52">
            <label className="lbl">بحث</label>
            <Search size={15} className="absolute right-3 top-[2.35rem] text-ink-soft" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="الاسم أو رقم مسار…" className="pr-9" />
          </div>
          <div className="w-44"><label className="lbl">المستوى</label>
            <Select value={level} onChange={(e) => { setLevel(e.target.value); setCls(""); setPage(1); }}>
              <option value="">الكل</option>{boot.levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </Select></div>
          <div className="w-48"><label className="lbl">القسم</label>
            <Select value={cls} onChange={(e) => { setCls(e.target.value); setPage(1); }}>
              <option value="">الكل</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select></div>
          <div className="w-36"><label className="lbl">الحالة</label>
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="active">نشط</option><option value="archived">مؤرشف</option><option value="all">الكل</option>
            </Select></div>
          {canWrite && (
            <Button variant="gold" onClick={() => { setErrors({}); setForm({ mode: "add", ...EMPTY_FORM }); }}><UserPlus size={16} /> إضافة تلميذ(ة)</Button>
          )}
        </div>
      </Card>

      {/* الجدول */}
      <Card>
        {loading ? <Spinner /> : (
          <>
            <DataTable rows={rows} rowKey={(r) => r.id} empty={<Empty title="لا توجد نتائج" sub="جرّب تعديل معايير البحث أو الفلترة" />}
              columns={[
                { key: "massar", label: "رقم مسار", render: (r) => <span className="font-mono text-xs" dir="ltr">{r.massar_id}</span> },
                { key: "full_name", label: "الاسم الكامل", render: (r) => <button onClick={() => openProfile(r.id)} className="font-display font-extrabold hover:text-gold-deep">{r.full_name}</button> },
                { key: "gender", label: "الجنس", render: (r) => r.gender === "M" ? "ذكر" : "أنثى" },
                { key: "class", label: "القسم", render: (r) => r.class_name || "—" },
                { key: "phone", label: "هاتف الولي", render: (r) => <span className="font-mono text-xs" dir="ltr">{r.guardian_phone || "—"}</span> },
                { key: "abs", label: "ساعات الغياب", render: (r) => <Badge tone={r.absence_alert ? "bad" : r.absence_hours > 8 ? "warn" : "ok"}>{Number(r.absence_hours).toLocaleString("fr-MA")} س{r.absence_alert ? " ⚠" : ""}</Badge> },
                { key: "late", label: "التأخرات", render: (r) => r.late_count ? <Badge tone={r.late_count >= 3 ? "warn" : "gray"}>{r.late_count}</Badge> : "—" },
                { key: "actions", label: "إجراءات", render: (r) => (
                  <div className="flex items-center gap-1">
                    <button title="الملف" onClick={() => openProfile(r.id)} className="w-7 h-7 rounded-lg hover:bg-beige grid place-items-center text-ink-soft"><Eye size={15} /></button>
                    {canWrite && status !== "archived" && <>
                      <button title="تعديل" onClick={() => { setErrors({}); setForm({ mode: "edit", ...r, level_id: r.level_id || "", class_id: r.class_id || "" }); }} className="w-7 h-7 rounded-lg hover:bg-beige grid place-items-center text-ink-soft"><Pencil size={14} /></button>
                      <button title="أرشفة" onClick={() => archive(r)} className="w-7 h-7 rounded-lg hover:bg-bad-soft grid place-items-center text-bad"><Archive size={14} /></button>
                    </>}
                    {canWrite && r.status === "archived" && (
                      <button title="استرجاع" onClick={() => restore(r)} className="w-7 h-7 rounded-lg hover:bg-ok-soft grid place-items-center text-ok"><ArchiveRestore size={14} /></button>
                    )}
                  </div>
                )},
              ]} />
            <Pagination page={page} total={total} perPage={12} onPage={setPage} />
          </>
        )}
      </Card>
      {formBody}
      {profileBody}
    </div>
  );
}
