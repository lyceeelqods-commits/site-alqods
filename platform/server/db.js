// قاعدة البيانات — الثانوية التأهيلية القدس
// SQLite (node:sqlite) — مخطط علائقي كامل
import { DatabaseSync } from "node:sqlite";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(path.join(DATA_DIR, "alqods.db"));
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// ---------- تجزئة كلمات السر (scrypt + salt) ----------
export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
export function verifyPassword(pw, stored) {
  try {
    const [salt, hash] = stored.split(":");
    const test = crypto.scryptSync(pw, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(test, "hex"));
  } catch { return false; }
}

export function initSchema() {
  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('director','surveillance','teacher','admin')),
    password_hash TEXT NOT NULL,
    teacher_id INTEGER,
    active INTEGER NOT NULL DEFAULT 1,
    last_login_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
  CREATE TABLE IF NOT EXISTS academic_years (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT UNIQUE NOT NULL,
    start_date TEXT, end_date TEXT,
    is_current INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS levels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, short TEXT, sort INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    level_id INTEGER NOT NULL REFERENCES levels(id),
    academic_year_id INTEGER REFERENCES academic_years(id),
    room TEXT, archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
  CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, short TEXT
  );
  CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    subject_id INTEGER REFERENCES subjects(id),
    phone TEXT, email TEXT,
    archived INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    massar_id TEXT UNIQUE,
    full_name TEXT NOT NULL,
    gender TEXT CHECK(gender IN ('M','F')),
    birth_date TEXT,
    level_id INTEGER REFERENCES levels(id),
    class_id INTEGER REFERENCES classes(id),
    father_name TEXT, mother_name TEXT, guardian_name TEXT,
    guardian_phone TEXT, whatsapp TEXT, address TEXT, notes TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
  CREATE INDEX IF NOT EXISTS idx_students_massar ON students(massar_id);
  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id),
    class_id INTEGER REFERENCES classes(id),
    date TEXT NOT NULL,
    period TEXT,
    subject_id INTEGER REFERENCES subjects(id),
    teacher_id INTEGER REFERENCES teachers(id),
    status TEXT NOT NULL CHECK(status IN ('present','absent','late')),
    hours REAL NOT NULL DEFAULT 1,
    late_minutes INTEGER NOT NULL DEFAULT 0,
    justified INTEGER NOT NULL DEFAULT 0,
    reason TEXT, document_ref TEXT, note TEXT,
    recorded_by INTEGER REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT,
    UNIQUE(student_id, date, period, subject_id)
  );
  CREATE INDEX IF NOT EXISTS idx_att_student ON attendance(student_id);
  CREATE INDEX IF NOT EXISTS idx_att_date ON attendance(date);
  CREATE TABLE IF NOT EXISTS late_arrivals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id),
    class_id INTEGER REFERENCES classes(id),
    date TEXT NOT NULL,
    time TEXT,
    minutes INTEGER NOT NULL,
    subject_id INTEGER, period TEXT,
    reason TEXT,
    justified INTEGER NOT NULL DEFAULT 0,
    notified INTEGER NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'gate',
    attendance_id INTEGER,
    recorded_by INTEGER REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
  CREATE INDEX IF NOT EXISTS idx_late_student ON late_arrivals(student_id);
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES students(id),
    guardian_name TEXT, phone TEXT,
    reason TEXT, message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sent','failed')),
    channel TEXT NOT NULL DEFAULT 'whatsapp',
    error TEXT,
    created_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    sent_at TEXT, sent_via TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_notif_student ON notifications(student_id);
  CREATE TABLE IF NOT EXISTS notification_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE,
    name TEXT NOT NULL,
    body TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, username TEXT,
    action TEXT NOT NULL, entity TEXT, entity_id TEXT, details TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
  CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_logs(created_at);
  `);
}

// ---------- الإعدادات ----------
export const DEFAULT_SETTINGS = {
  school_name: "الثانوية التأهيلية القدس",
  school_city: "القنيطرة",
  school_address: "شارع محمد الخامس، القنيطرة، المغرب",
  school_phone: "053737XXXX",
  school_email: "contact@lyceealqods.ma",
  academic_year: "2026/2027",
  late_threshold_minutes: "10",
  absence_threshold_hours: "20",
  repeated_lates_count: "3",
  country_code: "+212",
  wa_enabled: "0",
  wa_phone_number_id: "",
  wa_token: "",
  wa_api_version: "v21.0",
};

export function getSetting(key) {
  const r = db.prepare("SELECT value FROM settings WHERE key=?").get(key);
  return r ? r.value : DEFAULT_SETTINGS[key] ?? null;
}
export function getSettings() {
  const rows = db.prepare("SELECT key, value FROM settings").all();
  const out = { ...DEFAULT_SETTINGS };
  for (const r of rows) out[r.key] = r.value;
  return out;
}
export function setSetting(key, value) {
  db.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(key, String(value));
}

// ---------- سجل التدقيق ----------
export function audit(user, action, entity, entityId, details) {
  db.prepare("INSERT INTO audit_logs(user_id,username,action,entity,entity_id,details) VALUES(?,?,?,?,?,?)")
    .run(user?.id ?? null, user?.username ?? "نظام", action, entity ?? null, entityId != null ? String(entityId) : null, details ?? null);
}

// ---------- قوالب الرسائل ----------
export function renderTemplate(body, vars) {
  let out = body;
  for (const [k, v] of Object.entries(vars)) out = out.split(`[${k}]`).join(v);
  return out;
}

// ---------- تنسيق الهاتف لواتساب (2126XXXXXXXX) ----------
export function normalizePhone(phone, cc = "+212") {
  if (!phone) return null;
  let p = String(phone).replace(/[\s\-().]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  const ccClean = cc.replace("+", "");
  if (p.startsWith(ccClean)) return p;
  if (p.startsWith("0")) return ccClean + p.slice(1);
  return p;
}

// ---------- إحصائيات التلميذ ----------
export function studentAbsenceStats(studentId) {
  const row = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN status='absent' THEN hours END),0) AS absence_hours,
      COALESCE(SUM(CASE WHEN status='absent' AND justified=1 THEN hours END),0) AS justified_hours,
      COALESCE(SUM(CASE WHEN status='absent' AND justified=0 THEN hours END),0) AS unjustified_hours,
      COUNT(CASE WHEN status='absent' THEN 1 END) AS absence_count,
      COUNT(CASE WHEN status='late' THEN 1 END) AS late_sessions
    FROM attendance WHERE student_id=?`).get(studentId);
  const late = db.prepare(`
    SELECT COUNT(*) AS late_count, COALESCE(MAX(minutes),0) AS max_minutes, COALESCE(SUM(minutes),0) AS total_minutes
    FROM late_arrivals WHERE student_id=?`).get(studentId);
  return { ...row, ...late };
}

export function needsAbsenceAlert(stats) {
  const th = parseFloat(getSetting("absence_threshold_hours") || "20");
  return stats.absence_hours > th;
}
export function needsLateAlert(minutes) {
  const th = parseInt(getSetting("late_threshold_minutes") || "10", 10);
  return minutes > th;
}
