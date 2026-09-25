import { createContext, useContext } from "react";

// ---------- أنواع ----------
export type Role = "director" | "surveillance" | "teacher" | "admin";
export const ROLE_LABEL: Record<Role, string> = {
  director: "مدير المؤسسة",
  surveillance: "الحراسة العامة",
  teacher: "أستاذ(ة)",
  admin: "الإدارة",
};

export interface Boot {
  user: { id: number; username: string; full_name: string; role: Role; email?: string };
  settings: { school_name: string; school_city: string; academic_year: string; late_threshold_minutes: number; absence_threshold_hours: number; wa_enabled: boolean };
  levels: { id: number; name: string; short: string }[];
  classes: { id: number; name: string; level_id: number; level_name: string; room?: string; student_count: number }[];
  subjects: { id: number; name: string }[];
  teachers: { id: number; full_name: string; subject_id?: number }[];
  pending_notifications: number;
}

export interface Toast { id: number; kind: "ok" | "err" | "info"; text: string }

export interface Ctx {
  boot: Boot;
  refreshBoot: () => Promise<void>;
  logout: () => Promise<void>;
  toasts: Toast[];
  toast: (kind: Toast["kind"], text: string) => void;
  confirm: (opts: { title: string; message: string; danger?: boolean; confirmLabel?: string }) => Promise<boolean>;
  page: string;
  setPage: (p: string) => void;
}
export const AppCtx = createContext<Ctx>(null as any);
export const useApp = () => useContext(AppCtx);

export const can = (user: { role: Role } | null | undefined, action: string): boolean => {
  if (!user) return false;
  const r = user.role;
  switch (action) {
    case "students.write": return r === "director" || r === "surveillance" || r === "admin";
    case "classes.write": return r === "director" || r === "admin";
    case "attendance.write": return r === "director" || r === "surveillance" || r === "teacher";
    case "justify": return r === "director" || r === "surveillance" || r === "admin";
    case "notifications": return r === "director" || r === "surveillance" || r === "admin";
    case "reports": return r === "director" || r === "surveillance" || r === "admin";
    case "settings.view": return r === "director" || r === "surveillance" || r === "admin";
    case "settings.edit": return r === "director";
    case "users": return r === "director";
    case "audit": return r === "director";
    default: return false;
  }
};
