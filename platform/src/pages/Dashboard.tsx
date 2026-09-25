import { useEffect, useState } from "react";
import { AlertTriangle, BellRing, Clock3, DoorOpen, TrendingDown, UserMinus, Users } from "lucide-react";
import { api, fmtDate, waLink } from "../api";
import { useApp, can } from "../store";
import { Badge, Button, Card, CardTitle, Empty, Spinner, StatCard } from "../ui";
import { Donut, HBars, LineArea, VBars } from "../charts";

export default function Dashboard() {
  const { boot, setPage, toast } = useApp();
  const [data, setData] = useState<any>(null);

  useEffect(() => { api("/dashboard").then(setData).catch((e) => toast("err", e.message)); }, []);

  if (!data) return <Spinner />;
  const absTh = boot.settings.absence_threshold_hours;
  const lateTh = boot.settings.late_threshold_minutes;
  const waOn = boot.settings.wa_enabled;

  const notifyParent = async (student: any, kind: "absence" | "late", hours?: number, minutes?: number) => {
    try {
      const res: any = await api("/notifications", {
        method: "POST",
        body: {
          student_id: student.id, template_key: kind === "absence" ? "absence_notice" : "late_notice",
          reason: kind === "absence" ? `تجاوز ${absTh} ساعة غياب` : `تأخر ${minutes} دقيقة (> ${lateTh} د)`,
        },
      });
      window.open(res.wa_link, "_blank");
      toast("info", "تم تحضير إشعار الولي — أكمل الإرسال من صفحة الإشعارات ثم أكّده");
      setPage("notifications");
    } catch (e: any) { toast("err", e.message); }
  };

  return (
    <div className="space-y-6">
      {/* الإحصاءات */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
        <StatCard title="عدد التلاميذ" value={data.stats.students} icon={<Users size={20} />} tone="gold" sub="المسجلون حالياً" />
        <StatCard title="عدد الأقسام" value={data.stats.classes} icon={<DoorOpen size={20} />} tone="ink" sub={`${boot.levels.length} مستويات دراسية`} />
        <StatCard title="الغياب اليوم" value={data.stats.today_absences} icon={<UserMinus size={20} />} tone="bad" sub={`بتاريخ ${fmtDate(data.today)}`} onClick={() => setPage("absences")} />
        <StatCard title="حالات التأخر اليوم" value={data.stats.today_lates} icon={<Clock3 size={20} />} tone="warn" sub="عند بوابة الحراسة" onClick={() => setPage("lates")} />
        <StatCard title="ساعات غياب غير مبررة" value={Number(data.stats.unjustified_hours).toLocaleString("fr-MA")} icon={<AlertTriangle size={20} />} tone="warn" sub="السنة الدراسية الحالية" onClick={() => setPage("absences")} />
        <StatCard title={`تلاميذ تجاوزوا ${absTh} ساعة غياب`} value={data.stats.over_absence} icon={<TrendingDown size={20} />} tone="bad" sub="يتطلب إشعار الأولياء" onClick={() => setPage("reports")} />
        <StatCard title={`تلاميذ تجاوز تأخرهم ${lateTh} دقيقة`} value={data.stats.over_late} icon={<Clock3 size={20} />} tone="warn" sub="تأخر واحد على الأقل" onClick={() => setPage("lates")} />
        <StatCard title="إشعارات في الانتظار" value={boot.pending_notifications} icon={<BellRing size={20} />} tone={boot.pending_notifications ? "bad" : "ok"} sub={waOn ? "WhatsApp API مربوط" : "غير مرتبط بخدمة WhatsApp"} onClick={() => setPage("notifications")} />
      </div>

      {/* المخططات */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardTitle sub="مجموع ساعات الغياب خلال آخر 30 يوماً">الغياب حسب الأقسام</CardTitle>
          <HBars data={data.charts.byClass.slice(0, 8)} unit=" س" tone="bad" />
        </Card>
        <Card>
          <CardTitle sub="عدد التلاميذ الغائبين يومياً">الغياب خلال آخر 7 أيام</CardTitle>
          <LineArea data={data.charts.last7} />
        </Card>
        <Card>
          <CardTitle sub="عدد حالات التأخر يومياً خلال الشهر الحالي">التأخر خلال الشهر</CardTitle>
          <VBars data={data.charts.monthLates} color="#b45309" />
        </Card>
        <Card>
          <CardTitle sub="حسب المستوى الدراسي">توزيع التلاميذ</CardTitle>
          <Donut data={data.charts.byLevel} />
        </Card>
      </div>

      {/* قوائم المتابعة */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardTitle icon={<AlertTriangle size={17} />} sub={`مجموع الغياب تجاوز ${absTh} ساعة — يجب إشعار الأولياء`}>تلاميذ يحتاجون إلى تنبيه</CardTitle>
          {data.watchlist.length === 0 ? <Empty title="لا يوجد تلاميذ فوق العتبة" /> : (
            <div className="space-y-2">
              {data.watchlist.map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border border-bad/25 bg-bad-soft/60 px-3.5 py-2.5">
                  <div className="min-w-0 flex-1">
                    <button onClick={() => setPage("students")} className="font-display font-extrabold text-sm hover:text-gold-deep">{s.full_name}</button>
                    <div className="text-[.7rem] text-ink-soft font-bold">{s.class_name} · {s.massar_id}</div>
                  </div>
                  <Badge tone="bad">{Number(s.hours).toLocaleString("fr-MA")} ساعة</Badge>
                  {can(boot.user, "notifications") && (
                    <Button size="sm" variant="outline" onClick={() => notifyParent(s, "absence", Math.ceil(s.hours))}>إشعار الولي</Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <CardTitle icon={<Clock3 size={17} />} sub={`تأخر واحد على الأقل تجاوز ${lateTh} دقيقة`}>متابعة التأخرات</CardTitle>
          {data.lateWatch.length === 0 ? <Empty title="لا توجد تأخرات فوق العتبة" /> : (
            <div className="space-y-2">
              {data.lateWatch.map((s: any) => (
                <div key={s.id} className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 ${s.max_minutes > lateTh ? "border-warn/25 bg-warn-soft/60" : "border-line bg-white"}`}>
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-extrabold text-sm">{s.full_name}</div>
                    <div className="text-[.7rem] text-ink-soft font-bold">{s.class_name} · {s.times} مرات</div>
                  </div>
                  <Badge tone={s.max_minutes > lateTh ? "warn" : "gray"}>{s.max_minutes} دقيقة</Badge>
                  {can(boot.user, "notifications") && s.max_minutes > lateTh && (
                    <Button size="sm" variant="outline" onClick={() => notifyParent(s, "late", undefined, s.max_minutes)}>إشعار الولي</Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
