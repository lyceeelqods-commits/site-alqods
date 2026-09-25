import { useState } from "react";
import { BarChart3, FileSpreadsheet, Printer } from "lucide-react";
import { api, exportCSV, monthStr, todayStr } from "../api";
import { useApp } from "../store";
import { Badge, Button, Card, Empty, Field, Input, Spinner } from "../ui";

const REPORTS = [
  { key: "daily_attendance", title: "الحضور اليومي", desc: "نسب الحضور والغياب لكل قسم في يوم محدد", params: ["date"] },
  { key: "monthly_attendance", title: "الحضور الشهري", desc: "مجموع الحصص وساعات الغياب لكل قسم خلال الشهر", params: ["month"] },
  { key: "absences_by_class", title: "الغياب حسب الأقسام", desc: "الساعات المبررة وغير المبررة لكل قسم", params: [] },
  { key: "absences_by_student", title: "الغياب حسب التلاميذ", desc: "ترتيب التلاميذ حسب مجموع ساعات الغياب", params: [] },
  { key: "lates_report", title: "التأخرات", desc: "كل حالات التأخر خلال الشهر مع الإشعارات", params: ["month"] },
  { key: "over_absence", title: "تلاميذ فوق عتبة الغياب", desc: "القائمة الرسمية للتلاميذ الذين تجاوزوا العتبة", params: [] },
  { key: "repeated_lates", title: "التأخر المتكرر", desc: "التلاميذ المتأخرون بشكل متكرر (3 مرات فأكثر)", params: [] },
  { key: "notifications_report", title: "إشعارات الأولياء", desc: "سجل كامل للرسائل المرسلة وحالاتها", params: [] },
];

export default function Reports() {
  const { toast } = useApp();
  const [current, setCurrent] = useState<any>(null);
  const [dateParam, setDateParam] = useState(todayStr());
  const [monthParam, setMonthParam] = useState(monthStr());

  const open = async (r: any) => {
    setCurrent({ loading: true, def: r });
    try {
      const qs = r.params.includes("date") ? `?date=${dateParam}` : r.params.includes("month") ? `?month=${monthParam}` : "";
      const data = await api(`/reports/${r.key}${qs}`);
      setCurrent({ ...data, def: r });
    } catch (e: any) { toast("err", e.message); setCurrent(null); }
  };

  const doExport = () => {
    if (!current?.rows) return;
    exportCSV(current.title, current.columns, current.rows.map((r: any) => current.columns.map((c: string) => {
      const rowKey = Object.keys(r).find((k) => r[k] !== undefined);
      return r[c] ?? r[Object.keys(r)[current.columns.indexOf(c)]] ?? "";
    })));
  };

  return (
    <div className="space-y-5">
      {!current && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {REPORTS.map((r) => (
              <Card key={r.key} className="cursor-pointer hover:border-gold transition-colors" onClick={() => open(r)}>
                <div className="w-10 h-10 rounded-xl bg-gold-soft text-gold-deep grid place-items-center mb-3"><BarChart3 size={18} /></div>
                <h3 className="font-display font-extrabold">{r.title}</h3>
                <p className="text-xs text-ink-soft font-bold mt-1 leading-relaxed">{r.desc}</p>
              </Card>
            ))}
          </div>
        </>
      )}

      {current?.loading && <Spinner label="جارٍ إعداد التقرير…" />}

      {current && !current.loading && (
        <Card>
          <div className="flex flex-wrap items-center gap-3 mb-5 no-print">
            <Button variant="ghost" onClick={() => setCurrent(null)}>← كل التقارير</Button>
            <h2 className="font-display font-black text-lg flex-1">{current.title}</h2>
            {current.def.params.includes("date") && (
              <div className="w-40"><Field label=""><Input type="date" value={dateParam} onChange={(e) => setDateParam(e.target.value)} /></Field></div>
            )}
            {current.def.params.includes("month") && (
              <div className="w-40"><Field label=""><Input type="month" value={monthParam} onChange={(e) => setMonthParam(e.target.value)} /></Field></div>
            )}
            {(current.def.params.length > 0) && <Button variant="outline" onClick={() => open(current.def)}>تحديث</Button>}
            <Button variant="outline" onClick={doExport}><FileSpreadsheet size={15} /> Excel</Button>
            <Button variant="dark" onClick={() => window.print()}><Printer size={15} /> طباعة / PDF</Button>
          </div>

          <div className="hidden print:block mb-4 text-center">
            <div className="font-display font-black text-xl">الثانوية التأهيلية القدس — القنيطرة</div>
            <div className="font-bold text-sm mt-1">{current.title}</div>
            <div className="text-xs text-ink-soft">سُلّم بتاريخ {new Date().toLocaleDateString("fr-MA")}</div>
          </div>

          {!current.rows.length ? <Empty title="لا توجد بيانات لهذا التقرير" /> : (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="tbl print-full">
                <thead><tr>{current.columns.map((c: string) => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>
                  {current.rows.map((r: any, i: number) => (
                    <tr key={i}>
                      {Object.values(r).map((v: any, j: number) => (
                        <td key={j} className={typeof v === "string" && (v.includes("تنبيه") || v.includes("يتطلب")) ? "text-bad font-bold" : ""}>
                          {typeof v === "number" ? v.toLocaleString("fr-MA") : (v ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[.68rem] text-ink-soft mt-4 font-bold">عدد السطور: {current.rows.length} · التقرير قابل للطباعة أو التصدير إلى Excel</p>
        </Card>
      )}
    </div>
  );
}
