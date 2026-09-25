import { useEffect, useState } from "react";
import { api, fmtDateTime } from "../api";
import { useApp } from "../store";
import { Badge, Card, DataTable, Empty, Pagination, Select, Spinner } from "../ui";

const ACTIONS: Record<string, [string, string]> = {
  login: ["تسجيل دخول", "ok"], logout: ["خروج", "gray"], login_failed: ["محاولة دخول فاشلة", "bad"],
  create: ["إنشاء", "gold"], update: ["تعديل", "gold"], archive: ["أرشفة", "warn"], restore: ["استرجاع", "ok"],
  attendance_save: ["رصد حضور", "gold"], justify: ["تبرير", "gold"],
  send: ["إرسال إشعار", "gold"], send_failed: ["فشل إرسال", "bad"], confirm_manual: ["تأكيد إرسال يدوي", "gold"],
  reset_password: ["إعادة تعيين كلمة سر", "warn"], delete: ["حذف", "bad"],
  seed: ["تهيئة", "gray"], report: ["استخراج تقرير", "gray"],
};

export default function Audit() {
  const { toast } = useApp();
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("all");

  const load = () => {
    api(`/audit?page=${page}&per_page=25&action=${action}`).then(setData).catch((e) => toast("err", e.message));
  };
  useEffect(load, [page, action]);

  if (!data) return <Spinner />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft font-bold">
        سجل تدقيق كامل: كل عملية إنشاء أو تعديل أو إرسال أو دخول مسجلة باسم منفذها وتاريخها — للشفافية والمساءلة.
      </p>
      <Card className="!p-4">
        <div className="w-56">
          <Select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
            <option value="all">كل الإجراءات</option>
            {Object.keys(ACTIONS).map((k) => <option key={k} value={k}>{ACTIONS[k][0]}</option>)}
          </Select>
        </div>
      </Card>
      <Card>
        <DataTable rows={data.rows} rowKey={(r) => r.id} empty={<Empty title="السجل فارغ" />}
          columns={[
            { key: "created", label: "التاريخ والوقت", render: (r) => <span className="text-xs font-mono">{fmtDateTime(r.created_at)}</span> },
            { key: "username", label: "منفذ العملية", render: (r) => <span className="font-display font-extrabold">{r.username || "نظام"}</span> },
            { key: "action", label: "الإجراء", render: (r) => { const [label, tone] = ACTIONS[r.action] || [r.action, "gray"]; return <Badge tone={tone as any}>{label}</Badge>; } },
            { key: "entity", label: "الكيان", render: (r) => r.entity || "—" },
            { key: "details", label: "التفاصيل", render: (r) => <span className="text-xs">{r.details || "—"}</span> },
          ]} />
        <Pagination page={page} total={data.total} perPage={25} onPage={setPage} />
      </Card>
    </div>
  );
}
