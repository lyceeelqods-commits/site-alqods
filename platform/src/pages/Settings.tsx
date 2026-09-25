import { useEffect, useState } from "react";
import { Building2, Clock3, MessageCircle, Save, ScrollText } from "lucide-react";
import { api } from "../api";
import { useApp, can } from "../store";
import { Badge, Button, Card, CardTitle, Field, Input, Select, Spinner, Tabs, Textarea } from "../ui";

export default function SettingsPage() {
  const { boot, toast, refreshBoot } = useApp();
  const [s, setS] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [tab, setTab] = useState("school");
  const readOnly = !can(boot.user, "settings.edit");

  const load = () => {
    api("/settings").then(setS).catch((e) => toast("err", e.message));
    api("/templates").then(setTemplates).catch(() => {});
  };
  useEffect(load, []);

  const save = async (keys: string[]) => {
    try {
      const body: any = {};
      keys.forEach((k) => (body[k] = s[k]));
      await api("/settings", { method: "PUT", body });
      toast("ok", "تم حفظ الإعدادات");
      await refreshBoot();
    } catch (e: any) { toast("err", e.message); }
  };

  const saveTpl = async (t: any) => {
    try {
      await api(`/templates/${t.id}`, { method: "PUT", body: { name: t.name, body: t.body } });
      toast("ok", "تم حفظ القالب");
    } catch (e: any) { toast("err", e.message); }
  };

  if (!s) return <Spinner />;

  return (
    <div className="space-y-4">
      {readOnly && (
        <div className="rounded-2xl bg-beige border border-line px-4 py-3 text-sm font-bold text-ink-soft">
          عرض فقط — تعديل الإعدادات من صلاحيات مدير المؤسسة.
        </div>
      )}
      <Tabs active={tab} onChange={setTab} tabs={[
        { key: "school", label: "معلومات المؤسسة" },
        { key: "thresholds", label: "عتبات التنبيه" },
        { key: "whatsapp", label: "WhatsApp" },
        { key: "templates", label: "القوالب" },
      ]} />

      {tab === "school" && (
        <Card>
          <CardTitle icon={<Building2 size={17} />} sub="تظهر هذه المعلومات في الواجهة والتقارير">معلومات المؤسسة والسنة الدراسية</CardTitle>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="اسم المؤسسة"><Input value={s.school_name} onChange={(e: any) => setS({ ...s, school_name: e.target.value })} disabled={readOnly} /></Field>
            <Field label="المدينة"><Input value={s.school_city} onChange={(e: any) => setS({ ...s, school_city: e.target.value })} disabled={readOnly} /></Field>
            <Field label="السنة الدراسية"><Input value={s.academic_year} onChange={(e: any) => setS({ ...s, academic_year: e.target.value })} placeholder="2026/2027" disabled={readOnly} /></Field>
            <Field label="الهاتف"><Input value={s.school_phone} onChange={(e: any) => setS({ ...s, school_phone: e.target.value })} dir="ltr" disabled={readOnly} /></Field>
            <Field label="البريد الإلكتروني"><Input value={s.school_email} onChange={(e: any) => setS({ ...s, school_email: e.target.value })} dir="ltr" disabled={readOnly} /></Field>
            <Field label="العنوان"><Input value={s.school_address} onChange={(e: any) => setS({ ...s, school_address: e.target.value })} disabled={readOnly} /></Field>
          </div>
          {!readOnly && <div className="flex justify-end mt-5"><Button variant="gold" onClick={() => save(["school_name", "school_city", "academic_year", "school_phone", "school_email", "school_address"])}><Save size={15} /> حفظ</Button></div>}
        </Card>
      )}

      {tab === "thresholds" && (
        <Card>
          <CardTitle icon={<Clock3 size={17} />} sub="قيم قابلة للتعديل — تُطبق فوراً على التنبيهات الآلية والتقارير">عتبات التنبيه الآلي</CardTitle>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="عتبة التأخر (دقائق)" sub="فوقها يُطلب إشعار الولي">
              <Input type="number" min={1} value={s.late_threshold_minutes} onChange={(e: any) => setS({ ...s, late_threshold_minutes: e.target.value })} disabled={readOnly} />
            </Field>
            <Field label="عتبة الغياب (ساعات)" sub="فوقها يدخل التلميذ قائمة التنبيه">
              <Input type="number" min={1} value={s.absence_threshold_hours} onChange={(e: any) => setS({ ...s, absence_threshold_hours: e.target.value })} disabled={readOnly} />
            </Field>
            <Field label="التأخر المتكرر (مرات)" sub="عدد المرات في تقرير التأخر المتكرر">
              <Input type="number" min={2} value={s.repeated_lates_count} onChange={(e: any) => setS({ ...s, repeated_lates_count: e.target.value })} disabled={readOnly} />
            </Field>
          </div>
          <div className="rounded-xl bg-beige/70 px-4 py-3 text-xs font-bold text-ink-soft mt-4">
            القيم الافتراضية الموصى بها: تأخر 10 دقائق · غياب 20 ساعة (القاعدة الوزنية لمتابعة التمدرس)
          </div>
          {!readOnly && <div className="flex justify-end mt-5"><Button variant="gold" onClick={() => save(["late_threshold_minutes", "absence_threshold_hours", "repeated_lates_count"])}><Save size={15} /> حفظ</Button></div>}
        </Card>
      )}

      {tab === "whatsapp" && (
        <Card>
          <CardTitle icon={<MessageCircle size={17} />} sub="WhatsApp Business Cloud API — بيانات Meta للمطورين">ربط خدمة WhatsApp</CardTitle>
          {!s.wa_configured && (
            <div className="rounded-xl bg-warn-soft border border-warn/30 px-4 py-3 text-sm font-bold text-warn mb-4">
              الوضع الحالي: غير مرتبط بخدمة WhatsApp — لا يتم أي إرسال آلي. الإشعارات تبقى «قيد الانتظار» ويتم الإرسال يدوياً عبر روابط wa.me مع تأكيد صريح.
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="تمكين الإرسال الآلي">
              <Select value={s.wa_enabled === "1" ? "1" : "0"} onChange={(e: any) => setS({ ...s, wa_enabled: e.target.value })} disabled={readOnly}>
                <option value="0">معطل (إرسال يدوي فقط)</option>
                <option value="1">مفعل (إرسال عبر API)</option>
              </Select>
            </Field>
            <Field label="نسخة الـ API"><Input value={s.wa_api_version} onChange={(e: any) => setS({ ...s, wa_api_version: e.target.value })} dir="ltr" disabled={readOnly} /></Field>
            <Field label="Phone Number ID" sub="من لوحة تطبيقات Meta"><Input value={s.wa_phone_number_id || ""} onChange={(e: any) => setS({ ...s, wa_phone_number_id: e.target.value })} dir="ltr" disabled={readOnly} /></Field>
            <Field label="رمز الوصول (Access Token)" sub="يُخزن مشفراً في قاعدة البيانات المحلية"><Input type="password" value={s.wa_token || ""} onChange={(e: any) => setS({ ...s, wa_token: e.target.value })} dir="ltr" disabled={readOnly} /></Field>
            <Field label="مفتاح الدول" sub="تحويل 06XXXXXXXX إلى 2126XXXXXXXX"><Input value={s.country_code} onChange={(e: any) => setS({ ...s, country_code: e.target.value })} dir="ltr" disabled={readOnly} /></Field>
          </div>
          <div className="rounded-xl bg-beige/70 px-4 py-3 text-[.72rem] font-bold text-ink-soft mt-4 leading-relaxed">
            البنية جاهزة للربط الرسمي: عند التمكين تُرسل الرسائل عبر graph.facebook.com بمحتوى نصي.
            في حال فشل الإرسال يُسجل الضع في الإشعار ويظهر سبب الخطأ — لا يُتظاهر أبداً بنجاح إرسال لم يحدث.
          </div>
          {!readOnly && <div className="flex justify-end mt-5"><Button variant="gold" onClick={() => save(["wa_enabled", "wa_api_version", "wa_phone_number_id", "wa_token", "country_code"])}><Save size={15} /> حفظ</Button></div>}
        </Card>
      )}

      {tab === "templates" && (
        <div className="space-y-4">
          {templates.map((t, i) => (
            <Card key={t.id}>
              <div className="flex items-center gap-2 mb-3">
                <ScrollText size={16} className="text-gold-deep" />
                <Input value={t.name} onChange={(e: any) => { const n = [...templates]; n[i] = { ...t, name: e.target.value }; setTemplates(n); }} className="!w-64 font-display font-bold" />
                <Badge tone="gold" >{t.key}</Badge>
              </div>
              <Textarea rows={5} value={t.body} onChange={(e: any) => { const n = [...templates]; n[i] = { ...t, body: e.target.value }; setTemplates(n); }} className="font-mono !text-xs" />
              <div className="flex justify-end mt-3">
                <Button size="sm" variant="gold" onClick={() => saveTpl(t)} disabled={readOnly}><Save size={13} /> حفظ القالب</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
