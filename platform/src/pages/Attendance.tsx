import { useEffect, useState } from "react";
import { AlertTriangle, CheckCheck, ClipboardCheck, Eraser, MessageCircle, Save } from "lucide-react";
import { api, todayStr, waLink } from "../api";
import { useApp } from "../store";
import { Badge, Button, Card, CardTitle, Empty, Field, Input, Modal, Select, Spinner } from "../ui";

type Rec = { student_id: number; full_name: string; massar_id: string; absence_hours: number; absence_alert: boolean; status: string | null; late_minutes: number; justified: boolean; reason: string; note: string };

export default function Attendance() {
  const { boot, toast } = useApp();
  const [date, setDate] = useState(todayStr());
  const [levelId, setLevelId] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [period, setPeriod] = useState("1");
  const [records, setRecords] = useState<Rec[] | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lateAlerts, setLateAlerts] = useState<any[]>([]); // تلاميذ تجاوزوا عتبة التأخر بعد الحفظ

  const cls = boot.classes.find((c) => c.id === +classId);

  const loadSession = () => {
    if (!classId) { toast("err", "اختر القسم أولاً"); return; }
    setRecords(null);
    api(`/attendance/session?date=${date}&class_id=${classId}&subject_id=${subjectId}&teacher_id=${teacherId}&period=${period}`)
      .then((d) => { setRecords(d.records); setSaved(d.saved); })
      .catch((e) => toast("err", e.message));
  };

  const setStatus = (i: number, status: string) => {
    setRecords((r) => r!.map((rec, k) => k === i ? { ...rec, status, late_minutes: status === "late" ? (rec.late_minutes || 5) : 0 } : rec));
  };
  const patch = (i: number, p: Partial<Rec>) => setRecords((r) => r!.map((rec, k) => k === i ? { ...rec, ...p } : rec));

  const markAllPresent = () => setRecords((r) => r!.map((rec) => ({ ...rec, status: "present" })));
  const markAllAbsent = () => setRecords((r) => r!.map((rec) => ({ ...rec, status: "absent" })));
  const clearAll = () => setRecords((r) => r!.map((rec) => ({ ...rec, status: null, late_minutes: 0, justified: false, reason: "", note: "" })));

  const save = async () => {
    if (!records) return;
    const unset = records.filter((r) => !r.status).length;
    if (unset > 0) {
      const ok = await new Promise<boolean>((resolve) => {
        if (window.confirm(`${unset} تلميذ(ة) بدون تحديد — سيُعتبرون حاضرين. متابعة؟`)) resolve(true); else resolve(false);
      });
      if (!ok) return;
    }
    setSaving(true);
    try {
      const res: any = await api("/attendance/save", {
        method: "POST",
        body: {
          date, class_id: +classId, subject_id: subjectId || null, teacher_id: teacherId || null, period,
          records: records.map((r) => ({ student_id: r.student_id, status: r.status || "present", late_minutes: r.late_minutes, justified: r.justified, reason: r.reason, note: r.note })),
        },
      });
      setSaved(true);
      toast("ok", `تم تسجيل الحضور — الحاضرون: ${records.length - res.absent - res.late} | الغياب: ${res.absent} | التأخر: ${res.late}`);
      // الأتمتة: تحضير إشعارات للذين تجاوزوا عتبة التأخر
      if (res.late_alerts > 0) {
        const lates = await api(`/lates?over_threshold=1&per_page=50&month=${date.slice(0, 7)}`);
        const todayOver = (lates.rows as any[]).filter((r) => r.date === date && r.source === "attendance");
        setLateAlerts(todayOver.map((r) => ({ student_id: r.student_id, full_name: r.full_name, class_name: r.class_name, minutes: r.minutes, guardian_phone: r.guardian_phone })));
      }
    } catch (e: any) { toast("err", e.message); }
    finally { setSaving(false); }
  };

  const prepareNotice = async (s: any) => {
    try {
      const res: any = await api("/notifications", { method: "POST", body: { student_id: s.student_id, template_key: "late_notice", reason: `تأخر ${s.minutes} دقيقة — أتمتة ورقة الحضور` } });
      window.open(res.wa_link, "_blank");
      toast("info", "تم تحضير إشعار الولي — أكّد الإرسال من صفحة الإشعارات");
    } catch (e: any) { toast("err", e.message); }
  };

  const stats = records ? {
    present: records.filter((r) => r.status === "present").length,
    absent: records.filter((r) => r.status === "absent").length,
    late: records.filter((r) => r.status === "late").length,
    unset: records.filter((r) => !r.status).length,
  } : null;

  return (
    <div className="space-y-5">
      {/* اختيار الحصة */}
      <Card>
        <CardTitle icon={<ClipboardCheck size={17} />} sub="اختر التاريخ والقسم والمادة ثم اعرض قائمة التلاميذ للرصد السريع">ورقة الحضور والغياب</CardTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 items-end">
          <Field label="التاريخ"><Input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="المستوى">
            <Select value={levelId} onChange={(e) => { setLevelId(e.target.value); setClassId(""); }}>
              <option value="">الكل</option>{boot.levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </Select>
          </Field>
          <Field label="القسم *">
            <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">— اختر —</option>
              {(levelId ? boot.classes.filter((c) => c.level_id === +levelId) : boot.classes).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="المادة">
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">—</option>{boot.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="الأستاذ(ة)">
            <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">—</option>{boot.teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </Select>
          </Field>
          <Field label="الحصة">
            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>الحصة {n}</option>)}
            </Select>
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Button onClick={loadSession} disabled={!classId}>عرض قائمة التلاميذ</Button>
          {saved && <Badge tone="ok">محفوظ — يمكنك التعديل وإعادة الحفظ</Badge>}
          {cls && <span className="text-xs text-ink-soft font-bold">{cls.name} — {cls.student_count} تلميذ(ة)</span>}
        </div>
      </Card>

      {records === null ? (
        <Card><Empty icon={<ClipboardCheck size={24} />} title="لم تُعرض أي قائمة بعد" sub="اختر التاريخ والقسم ثم انقر «عرض قائمة التلاميذ»" /></Card>
      ) : records.length === 0 ? (
        <Card><Empty title="لا يوجد تلاميذ بهذا القسم" /></Card>
      ) : (
        <Card>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge tone="ok">حاضر: {stats!.present}</Badge>
            <Badge tone="bad">غائب: {stats!.absent}</Badge>
            <Badge tone="warn">متأخر: {stats!.late}</Badge>
            {stats!.unset > 0 && <Badge tone="gray">غير محدد: {stats!.unset}</Badge>}
            <div className="mr-auto flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={markAllPresent}><CheckCheck size={14} /> تسجيل الحضور للجميع</Button>
              <Button size="sm" variant="outline" onClick={markAllAbsent}>تسجيل الغياب للجميع</Button>
              <Button size="sm" variant="ghost" onClick={clearAll}><Eraser size={14} /> مسح</Button>
              <Button size="sm" variant="gold" onClick={save} disabled={saving}><Save size={15} /> {saving ? "جارٍ الحفظ…" : "حفظ الحضور"}</Button>
            </div>
          </div>

          <div className="overflow-x-auto -mx-5 px-5">
            <table className="tbl">
              <thead>
                <tr>
                  <th>#</th><th>التلميذ(ة)</th><th>رقم مسار</th><th>الحالة</th><th>مدة التأخر</th><th>مبرر / غير مبرر</th><th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.student_id} className={r.absence_alert ? "!bg-bad-soft/40" : ""}>
                    <td className="text-ink-soft">{i + 1}</td>
                    <td>
                      <div className="font-display font-extrabold flex items-center gap-1.5">
                        {r.full_name}
                        {r.absence_alert && <span title={`مجموع غياب ${Number(r.absence_hours).toLocaleString("fr-MA")} ساعة`}><AlertTriangle size={13} className="text-bad" /></span>}
                      </div>
                      {r.absence_alert && <div className="text-[.65rem] font-bold text-bad">{Number(r.absence_hours).toLocaleString("fr-MA")} ساعة غياب</div>}
                    </td>
                    <td className="font-mono text-xs" dir="ltr">{r.massar_id}</td>
                    <td>
                      <div className="flex gap-1">
                        {[["present", "حاضر", "ok"], ["absent", "غائب", "bad"], ["late", "متأخر", "warn"]].map(([val, label, tone]: any) => (
                          <button key={val} onClick={() => setStatus(i, val)}
                            className={`rounded-lg px-2.5 py-1 text-[.72rem] font-display font-extrabold border transition-all ${r.status === val ? tone === "ok" ? "bg-ok text-white border-ok" : tone === "bad" ? "bg-bad text-white border-bad" : "bg-warn text-white border-warn" : "bg-white border-line text-ink-soft hover:border-gold"}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td>
                      {r.status === "late" ? (
                        <div className="flex items-center gap-1.5">
                          <Input type="number" min={1} max={120} value={r.late_minutes || ""} onChange={(e) => patch(i, { late_minutes: +e.target.value })} className="!w-20 !py-1 text-center" dir="ltr" />
                          <span className="text-xs font-bold text-ink-soft">دقيقة</span>
                          {r.late_minutes > boot.settings.late_threshold_minutes && <Badge tone="bad">⚠ {boot.settings.late_threshold_minutes}+</Badge>}
                        </div>
                      ) : "—"}
                    </td>
                    <td>
                      {r.status === "absent" ? (
                        <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer select-none">
                          <input type="checkbox" checked={r.justified} onChange={(e) => patch(i, { justified: e.target.checked })} className="w-4 h-4 accent-[#c09a3e]" />
                          {r.justified ? "مبرر" : "غير مبرر"}
                        </label>
                      ) : "—"}
                    </td>
                    <td><Input value={r.note} onChange={(e) => patch(i, { note: e.target.value })} className="!py-1 !text-xs min-w-32" placeholder="…" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* نافذة أتمتة التأخر */}
      {lateAlerts.length > 0 && (
        <Modal open onClose={() => setLateAlerts([])} title="أتمتة: تلاميذ تجاوزوا عتبة التأخر">
          <div className="rounded-xl bg-warn-soft border border-warn/30 px-4 py-3 text-sm font-bold text-warn mb-4">
            سُجّل تأخر تجاوز عتبة {boot.settings.late_threshold_minutes} دقائق لهؤلاء التلاميذ — تحضير إشعارات الأولياء مطلوب:
          </div>
          <div className="space-y-2">
            {lateAlerts.map((s) => (
              <div key={s.student_id} className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="font-display font-extrabold text-sm">{s.full_name}</div>
                  <div className="text-[.7rem] text-ink-soft font-bold">{s.class_name} · <span dir="ltr">{s.guardian_phone}</span></div>
                </div>
                <Badge tone="bad">{s.minutes} دقيقة</Badge>
                <Button size="sm" variant="gold" onClick={() => prepareNotice(s)}><MessageCircle size={14} /> تحضير إشعار</Button>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-5"><Button variant="outline" onClick={() => setLateAlerts([])}>لاحقاً</Button></div>
        </Modal>
      )}
    </div>
  );
}
