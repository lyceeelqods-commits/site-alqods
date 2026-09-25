// واجهة API — الثانوية التأهيلية القدس
import crypto from "crypto";
import { db, verifyPassword, hashPassword, audit, getSetting, getSettings, setSetting, renderTemplate, normalizePhone, studentAbsenceStats, needsAbsenceAlert, needsLateAlert } from "./db.js";

const SESSION_COOKIE = "alqods_sid";

// ---------- أدوات الجلسات ----------
function parseCookies(req) {
  const out = {};
  const raw = req.headers.cookie;
  if (!raw) return out;
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

// هل الطلب قادم عبر HTTPS (بروكسي المعاينة)؟
// في iframe عابر للمواقع يجب SameSite=None; Secure وإلا يرفض المتصفح الكوكي
function isSecureRequest(req) {
  if (req.socket?.encrypted) return true;
  const xf = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  if (xf) return xf === "https";
  const host = req.headers.host || "";
  return !/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);
}
function cookieFlags(req) {
  return isSecureRequest(req)
    ? "Path=/; HttpOnly; Secure; SameSite=None"
    : "Path=/; HttpOnly; SameSite=Lax";
}

export function createSession(req, res, userId, remember) {
  const token = crypto.randomBytes(32).toString("hex");
  const days = remember ? 30 : 1;
  const expires = new Date(Date.now() + days * 86400e3).toISOString();
  db.prepare("INSERT INTO sessions(token,user_id,expires_at) VALUES(?,?,?)").run(token, userId, expires);
  db.prepare("UPDATE users SET last_login_at=datetime('now','localtime') WHERE id=?").run(userId);
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${token}; ${cookieFlags(req)}; Max-Age=${days * 86400}`);
  return token;
}

export function destroySession(req, res) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) db.prepare("DELETE FROM sessions WHERE token=?").run(token);
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; ${cookieFlags(req)}; Max-Age=0`);
}

export function currentUser(req) {
  // التوكن: من الكوكي (المتصفح) أو من ترويسة Authorization (احتياطاً لبيئات iframe التي تحجب الكوكيز)
  let token = parseCookies(req)[SESSION_COOKIE];
  const auth = req.headers.authorization;
  if (!token && auth?.startsWith("Bearer ")) token = auth.slice(7);
  if (!token) return null;
  const row = db.prepare(`
    SELECT u.id, u.username, u.email, u.full_name, u.role, u.active, u.last_login_at
    FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token=? AND s.expires_at > datetime('now','localtime')`).get(token);
  return row && row.active ? row : null;
}

// حماية المسارات
function requireAuth(req, res, next) {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "انتهت الجلسة، المرجو تسجيل الدخول من جديد" });
  req.user = user;
  next();
}
function requireRole(...roles) {
  return (req, res, next) => {
    const user = currentUser(req);
    if (!user) return res.status(401).json({ error: "انتهت الجلسة، المرجو تسجيل الدخول من جديد" });
    if (!roles.includes(user.role)) return res.status(403).json({ error: "ليست لديك الصلاحية للقيام بهذا الإجراء" });
    req.user = user;
    next();
  };
}
const clean = (v) => (v == null ? null : String(v).trim() || null);

// ---------- الإعدادات العامة للرد ----------
export function bootstrapPayload(user) {
  const s = getSettings();
  return {
    user,
    settings: {
      school_name: s.school_name, school_city: s.school_city, academic_year: s.academic_year,
      late_threshold_minutes: parseInt(s.late_threshold_minutes), absence_threshold_hours: parseFloat(s.absence_threshold_hours),
      wa_enabled: s.wa_enabled === "1",
    },
    levels: db.prepare("SELECT * FROM levels ORDER BY sort").all(),
    classes: db.prepare(`
      SELECT c.*, l.name AS level_name, l.short AS level_short,
        (SELECT COUNT(*) FROM students st WHERE st.class_id=c.id AND st.status='active') AS student_count
      FROM classes c JOIN levels l ON l.id=c.level_id WHERE c.archived=0 ORDER BY l.sort, c.name`).all(),
    subjects: db.prepare("SELECT * FROM subjects ORDER BY id").all(),
    teachers: db.prepare("SELECT id, full_name, subject_id FROM teachers WHERE archived=0 ORDER BY full_name").all(),
    pending_notifications: db.prepare("SELECT COUNT(*) c FROM notifications WHERE status='pending'").get().c,
  };
}

// ---------- حساب إشعار الولي ----------
function composeNotice(student, reason, vars) {
  const tpl = db.prepare("SELECT * FROM notification_templates WHERE key=?").get(vars.templateKey || "manual");
  const body = tpl ? tpl.body : "";
  const msg = renderTemplate(body, {
    "اسم التلميذ": student.full_name,
    "القسم": student.class_name || "",
    "المدة": vars.minutes ?? "",
    "التاريخ": vars.date ?? "",
    "عدد الساعات": vars.hours ?? "",
    "السبب": vars.cause ?? "",
  });
  return { message: msg, template: tpl?.key || "manual" };
}

// ---------- واجهات REST ----------
export function registerRoutes(app) {

  // ===== المصادقة =====
  app.post("/api/auth/login", (req, res) => {
    const { username, password, remember } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "المرجو إدخال اسم المستخدم وكلمة السر" });
    const user = db.prepare("SELECT * FROM users WHERE username=? OR email=?").get(String(username).trim(), String(username).trim());
    // رسالة موحدة لتفادي كشف الحسابات الموجودة
    if (!user || !verifyPassword(password, user.password_hash)) {
      audit(null, "login_failed", "auth", null, `محاولة دخول فاشلة: ${username}`);
      return res.status(401).json({ error: "اسم المستخدم أو كلمة السر غير صحيحة" });
    }
    if (!user.active) return res.status(403).json({ error: "هذا الحساب موقوف، المرجو الاتصال بالمدير" });
    const token = createSession(req, res, user.id, !!remember);
    audit(user, "login", "auth", user.id, "تسجيل دخول");
    // التوكن يُعاد أيضاً في JSON: احتياط لبيئات المعاينة التي تحجب كوكيز الطرف الثالث
    res.json({ user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role, email: user.email }, token });
  });

  app.post("/api/auth/logout", (req, res) => {
    const user = currentUser(req);
    if (user) audit(user, "logout", "auth", user.id, "تسجيل الخروج");
    destroySession(req, res);
    res.json({ ok: true });
  });

  app.get("/api/auth/me", (req, res) => {
    const user = currentUser(req);
    if (!user) return res.status(401).json({ error: "غير متصل" });
    res.json({ user });
  });

  // كل المسارات التالية تتطلب مصادقة
  const auth = requireAuth;

  app.get("/api/bootstrap", auth, (req, res) => res.json(bootstrapPayload(req.user)));

  // ===== لوحة التحكم =====
  app.get("/api/dashboard", auth, (req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const absTh = parseFloat(getSetting("absence_threshold_hours") || "20");
    const lateTh = parseInt(getSetting("late_threshold_minutes") || "10", 10);

    const stats = {
      students: db.prepare("SELECT COUNT(*) c FROM students WHERE status='active'").get().c,
      classes: db.prepare("SELECT COUNT(*) c FROM classes WHERE archived=0").get().c,
      today_absences: db.prepare("SELECT COUNT(DISTINCT student_id) c FROM attendance WHERE date=? AND status='absent'").get(today).c,
      today_lates: db.prepare("SELECT COUNT(DISTINCT student_id) c FROM late_arrivals WHERE date=?").get(today).c,
      unjustified_hours: db.prepare("SELECT COALESCE(SUM(hours),0) c FROM attendance WHERE status='absent' AND justified=0").get().c,
      over_absence: db.prepare("SELECT COUNT(*) c FROM (SELECT student_id FROM attendance WHERE status='absent' GROUP BY student_id HAVING SUM(hours) > ?)").get(absTh).c,
      over_late: db.prepare("SELECT COUNT(*) c FROM (SELECT student_id FROM late_arrivals GROUP BY student_id HAVING MAX(minutes) > ?)").get(lateTh).c,
    };

    // الغياب حسب الأقسام (آخر 30 يوماً)
    const byClass = db.prepare(`
      SELECT c.name AS label, COALESCE(SUM(a.hours),0) AS value
      FROM classes c LEFT JOIN attendance a ON a.class_id=c.id AND a.status='absent' AND a.date >= date('now','localtime','-30 days')
      WHERE c.archived=0 GROUP BY c.id ORDER BY value DESC`).all();

    // الغياب آخر 7 أيام
    const last7 = db.prepare(`
      SELECT date AS label, COUNT(DISTINCT student_id) AS value
      FROM attendance WHERE status='absent' AND date >= date('now','localtime','-6 days')
      GROUP BY date ORDER BY date`).all();
    // املأ الأيام الفارغة
    const last7Filled = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400e3).toISOString().slice(0, 10);
      last7Filled.push({ label: d.slice(5).split("-").reverse().join("/"), value: last7.find((r) => r.label === d)?.value ?? 0 });
    }

    // التأخر خلال الشهر الحالي
    const monthLates = db.prepare(`
      SELECT strftime('%d', date) AS label, COUNT(*) AS value
      FROM late_arrivals WHERE strftime('%Y-%m', date) = strftime('%Y-%m','now','localtime')
      GROUP BY date ORDER BY date`).all();

    // توزيع التلاميذ حسب المستوى
    const byLevel = db.prepare(`
      SELECT l.short AS label, COUNT(s.id) AS value
      FROM levels l LEFT JOIN students s ON s.level_id=l.id AND s.status='active'
      GROUP BY l.id ORDER BY l.sort`).all();

    // تلاميذ يحتاجون إلى تنبيه
    const watchlist = db.prepare(`
      SELECT s.id, s.full_name, s.massar_id, c.name AS class_name, SUM(a.hours) AS hours
      FROM students s JOIN attendance a ON a.student_id=s.id AND a.status='absent'
      LEFT JOIN classes c ON c.id=s.class_id
      WHERE s.status='active'
      GROUP BY s.id HAVING SUM(a.hours) > ?
      ORDER BY hours DESC LIMIT 10`).all(absTh);
    const lateWatch = db.prepare(`
      SELECT s.id, s.full_name, c.name AS class_name, MAX(l.minutes) AS max_minutes, COUNT(*) AS times
      FROM late_arrivals l JOIN students s ON s.id=l.student_id LEFT JOIN classes c ON c.id=l.class_id
      WHERE s.status='active' GROUP BY s.id HAVING MAX(l.minutes) > ? ORDER BY max_minutes DESC LIMIT 10`).all(lateTh);

    res.json({ stats, charts: { byClass, last7: last7Filled, monthLates, byLevel }, watchlist, lateWatch, today });
  });

  // ===== التلاميذ =====
  app.get("/api/students", auth, (req, res) => {
    const { q, level_id, class_id, status = "active", page = "1", per_page = "15" } = req.query;
    const where = ["1=1"];
    const args = [];
    if (status !== "all") { where.push("s.status=?"); args.push(status); }
    if (q) { where.push("(s.full_name LIKE ? OR s.massar_id LIKE ?)"); args.push(`%${q}%`, `%${q}%`); }
    if (level_id) { where.push("s.level_id=?"); args.push(level_id); }
    if (class_id) { where.push("s.class_id=?"); args.push(class_id); }
    const w = where.join(" AND ");
    const total = db.prepare(`SELECT COUNT(*) c FROM students s WHERE ${w}`).get(...args).c;
    const rows = db.prepare(`
      SELECT s.*, c.name AS class_name, l.name AS level_name,
        (SELECT COALESCE(SUM(hours),0) FROM attendance WHERE student_id=s.id AND status='absent') AS absence_hours,
        (SELECT COUNT(*) FROM late_arrivals WHERE student_id=s.id) AS late_count
      FROM students s LEFT JOIN classes c ON c.id=s.class_id LEFT JOIN levels l ON l.id=s.level_id
      WHERE ${w} ORDER BY s.full_name LIMIT ? OFFSET ?`).all(...args, +per_page, (+page - 1) * +per_page);
    // علامات التنبيه
    const absTh = parseFloat(getSetting("absence_threshold_hours") || "20");
    for (const r of rows) { r.absence_alert = r.absence_hours > absTh ? 1 : 0; }
    res.json({ rows, total, page: +page, per_page: +per_page });
  });

  app.post("/api/students", requireRole("director", "surveillance", "admin"), (req, res) => {
    const b = req.body || {};
    if (!b.full_name) return res.status(400).json({ error: "الاسم الكامل إلزامي" });
    let massar = clean(b.massar_id);
    if (massar && db.prepare("SELECT 1 FROM students WHERE massar_id=?").get(massar)) return res.status(400).json({ error: "رقم مسار مستعمل من قبل تلميذ آخر" });
    if (!massar) {
      do { massar = "R" + (1300000 + Math.floor(Math.random() * 699999)); } while (db.prepare("SELECT 1 FROM students WHERE massar_id=?").get(massar));
    }
    const info = db.prepare(`INSERT INTO students(massar_id,full_name,gender,birth_date,level_id,class_id,father_name,mother_name,guardian_name,guardian_phone,whatsapp,address,notes,status,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,'active',datetime('now','localtime'))`)
      .run(massar, clean(b.full_name), b.gender || "M", clean(b.birth_date), b.level_id || null, b.class_id || null,
        clean(b.father_name), clean(b.mother_name), clean(b.guardian_name), clean(b.guardian_phone), clean(b.whatsapp),
        clean(b.address), clean(b.notes));
    audit(req.user, "create", "students", info.lastInsertRowid, `إضافة التلميذ: ${b.full_name} (${massar})`);
    res.json({ ok: true, id: info.lastInsertRowid });
  });

  app.put("/api/students/:id", requireRole("director", "surveillance", "admin"), (req, res) => {
    const b = req.body || {};
    const st = db.prepare("SELECT * FROM students WHERE id=?").get(req.params.id);
    if (!st) return res.status(404).json({ error: "التلميذ غير موجود" });
    db.prepare(`UPDATE students SET full_name=?,gender=?,birth_date=?,level_id=?,class_id=?,father_name=?,mother_name=?,guardian_name=?,guardian_phone=?,whatsapp=?,address=?,notes=?,status=?,updated_at=datetime('now','localtime') WHERE id=?`)
      .run(clean(b.full_name) ?? st.full_name, b.gender ?? st.gender, clean(b.birth_date) ?? st.birth_date,
        b.level_id ?? st.level_id, b.class_id ?? st.class_id, clean(b.father_name) ?? st.father_name,
        clean(b.mother_name) ?? st.mother_name, clean(b.guardian_name) ?? st.guardian_name,
        clean(b.guardian_phone) ?? st.guardian_phone, clean(b.whatsapp) ?? st.whatsapp,
        clean(b.address) ?? st.address, clean(b.notes) ?? st.notes, b.status ?? st.status, st.id);
    audit(req.user, "update", "students", st.id, `تعديل بيانات التلميذ: ${st.full_name}`);
    res.json({ ok: true });
  });

  // الأرشفة بدل الحذف النهائي
  app.post("/api/students/:id/archive", requireRole("director", "surveillance", "admin"), (req, res) => {
    const st = db.prepare("SELECT * FROM students WHERE id=?").get(req.params.id);
    if (!st) return res.status(404).json({ error: "التلميذ غير موجود" });
    db.prepare("UPDATE students SET status='archived', updated_at=datetime('now','localtime') WHERE id=?").run(st.id);
    audit(req.user, "archive", "students", st.id, `أرشفة التلميذ: ${st.full_name}`);
    res.json({ ok: true });
  });
  app.post("/api/students/:id/restore", requireRole("director", "surveillance", "admin"), (req, res) => {
    db.prepare("UPDATE students SET status='active', updated_at=datetime('now','localtime') WHERE id=?").run(req.params.id);
    audit(req.user, "restore", "students", req.params.id, "استرجاع تلميذ مؤرشف");
    res.json({ ok: true });
  });

  // ملف التلميذ
  app.get("/api/students/:id", auth, (req, res) => {
    const s = db.prepare(`
      SELECT s.*, c.name AS class_name, l.name AS level_name
      FROM students s LEFT JOIN classes c ON c.id=s.class_id LEFT JOIN levels l ON l.id=s.level_id
      WHERE s.id=?`).get(req.params.id);
    if (!s) return res.status(404).json({ error: "التلميذ غير موجود" });
    const stats = studentAbsenceStats(s.id);
    const absTh = parseFloat(getSetting("absence_threshold_hours") || "20");
    const lateTh = parseInt(getSetting("late_threshold_minutes") || "10", 10);
    const history = db.prepare(`
      SELECT a.*, sub.name AS subject_name, t.full_name AS teacher_name
      FROM attendance a LEFT JOIN subjects sub ON sub.id=a.subject_id LEFT JOIN teachers t ON t.id=a.teacher_id
      WHERE a.student_id=? ORDER BY a.date DESC, a.period DESC LIMIT 60`).all(s.id);
    const lates = db.prepare(`
      SELECT la.*, sub.name AS subject_name FROM late_arrivals la
      LEFT JOIN subjects sub ON sub.id=la.subject_id
      WHERE la.student_id=? ORDER BY la.date DESC, la.id DESC LIMIT 30`).all(s.id);
    const notifications = db.prepare(`
      SELECT id, reason, message, status, created_at, sent_at FROM notifications
      WHERE student_id=? ORDER BY id DESC LIMIT 20`).all(s.id);
    // إحصائيات شهرية
    const monthly = db.prepare(`
      SELECT strftime('%Y-%m', date) AS month, SUM(hours) AS hours FROM attendance
      WHERE student_id=? AND status='absent' GROUP BY month ORDER BY month DESC LIMIT 6`).all(s.id);
    res.json({
      student: s, stats, history, lates, notifications, monthly,
      alerts: { absence_over: stats.absence_hours > absTh, late_over: stats.max_minutes > lateTh },
    });
  });

  // ===== الأقسام =====
  app.post("/api/classes", requireRole("director", "admin"), (req, res) => {
    const b = req.body || {};
    if (!b.name || !b.level_id) return res.status(400).json({ error: "اسم القسم والمستوى إلزاميان" });
    const info = db.prepare("INSERT INTO classes(name,level_id,academic_year_id,room) VALUES(?,?,(SELECT id FROM academic_years WHERE is_current=1),?)")
      .run(clean(b.name), b.level_id, clean(b.room));
    audit(req.user, "create", "classes", info.lastInsertRowid, `إنشاء القسم: ${b.name}`);
    res.json({ ok: true, id: info.lastInsertRowid });
  });
  app.put("/api/classes/:id", requireRole("director", "admin"), (req, res) => {
    const c = db.prepare("SELECT * FROM classes WHERE id=?").get(req.params.id);
    if (!c) return res.status(404).json({ error: "القسم غير موجود" });
    const b = req.body || {};
    db.prepare("UPDATE classes SET name=?, level_id=?, room=? WHERE id=?").run(clean(b.name) ?? c.name, b.level_id ?? c.level_id, clean(b.room) ?? c.room, c.id);
    audit(req.user, "update", "classes", c.id, `تعديل القسم: ${c.name}`);
    res.json({ ok: true });
  });
  app.post("/api/classes/:id/archive", requireRole("director", "admin"), (req, res) => {
    db.prepare("UPDATE classes SET archived=1 WHERE id=?").run(req.params.id);
    audit(req.user, "archive", "classes", req.params.id, "أرشفة قسم");
    res.json({ ok: true });
  });

  app.get("/api/classes/:id/detail", auth, (req, res) => {
    const c = db.prepare(`
      SELECT c.*, l.name AS level_name,
        (SELECT COUNT(*) FROM students WHERE class_id=c.id AND status='active') AS student_count
      FROM classes c JOIN levels l ON l.id=c.level_id WHERE c.id=?`).get(req.params.id);
    const today = new Date().toISOString().slice(0, 10);
    c.today_absences = db.prepare("SELECT COUNT(DISTINCT student_id) c FROM attendance WHERE class_id=? AND date=? AND status='absent'").get(c.id, today).c;
    c.today_lates = db.prepare("SELECT COUNT(DISTINCT student_id) c FROM late_arrivals WHERE class_id=? AND date=?").get(c.id, today).c;
    c.absence_hours_month = db.prepare("SELECT COALESCE(SUM(hours),0) c FROM attendance WHERE class_id=? AND status='absent' AND strftime('%Y-%m',date)=strftime('%Y-%m','now','localtime')").get(c.id).c;
    const students = db.prepare("SELECT id, full_name, massar_id, gender FROM students WHERE class_id=? AND status='active' ORDER BY full_name").all(c.id);
    res.json({ class: c, students });
  });

  // ===== الحضور =====
  app.get("/api/attendance/session", auth, (req, res) => {
    const { date, class_id, subject_id, teacher_id, period } = req.query;
    if (!date || !class_id) return res.status(400).json({ error: "التاريخ والقسم إلزاميان" });
    const students = db.prepare(`
      SELECT s.id, s.full_name, s.massar_id, s.gender,
        (SELECT COALESCE(SUM(hours),0) FROM attendance WHERE student_id=s.id AND status='absent') AS absence_hours
      FROM students s WHERE s.class_id=? AND s.status='active' ORDER BY s.full_name`).all(class_id);
    const existing = db.prepare(`
      SELECT a.* FROM attendance a
      WHERE a.date=? AND a.class_id=? AND IFNULL(a.period,'')=IFNULL(NULLIF(?,''),'') AND IFNULL(a.subject_id,0)=IFNULL(NULLIF(?,''),0)`)
      .all(date, class_id, period ?? "", subject_id ?? "");
    const byStudent = Object.fromEntries(existing.map((e) => [e.student_id, e]));
    const records = students.map((s) => {
      const e = byStudent[s.id];
      return {
        student_id: s.id, full_name: s.full_name, massar_id: s.massar_id, absence_hours: s.absence_hours,
        status: e?.status ?? null, late_minutes: e?.late_minutes ?? 0, justified: !!e?.justified,
        reason: e?.reason ?? "", note: e?.note ?? "", attendance_id: e?.id ?? null,
        absence_alert: s.absence_hours > parseFloat(getSetting("absence_threshold_hours") || "20"),
      };
    });
    res.json({ records, saved: existing.length > 0 });
  });

  app.post("/api/attendance/save", requireRole("director", "surveillance", "teacher"), (req, res) => {
    const { date, class_id, subject_id, teacher_id, period, records } = req.body || {};
    if (!date || !class_id || !Array.isArray(records)) return res.status(400).json({ error: "بيانات غير مكتملة" });
    const findExisting = db.prepare(`
      SELECT id FROM attendance
      WHERE student_id=? AND date=? AND IFNULL(period,'')=IFNULL(NULLIF(?,''),'') AND IFNULL(subject_id,0)=IFNULL(NULLIF(?,''),0)`);
    const insertRow = db.prepare(`
      INSERT INTO attendance(student_id,class_id,date,period,subject_id,teacher_id,status,hours,late_minutes,justified,reason,document_ref,note,recorded_by)
      VALUES(@student_id,@class_id,@date,@period,@subject_id,@teacher_id,@status,@hours,@late_minutes,@justified,@reason,@document_ref,@note,@recorded_by)`);
    const updateRow = db.prepare(`
      UPDATE attendance SET status=@status, hours=@hours, late_minutes=@late_minutes,
        justified=@justified, reason=@reason, note=@note, recorded_by=@recorded_by,
        updated_at=datetime('now','localtime') WHERE id=@id`);
    const insertLate = db.prepare(`
      INSERT INTO late_arrivals(student_id,class_id,date,time,minutes,subject_id,period,justified,notified,source,attendance_id,recorded_by)
      VALUES(?,?,?,?,?,?,?,?,0,'attendance',NULL,?)`);
    const cls = db.prepare("SELECT name FROM classes WHERE id=?").get(class_id);
    let absentCount = 0, lateCount = 0, lateAlerts = 0;
    const lateTh = parseInt(getSetting("late_threshold_minutes") || "10", 10);
    db.exec("BEGIN");
    try {
      for (const r of records) {
        const status = r.status || "present";
        if (status === "absent") absentCount++;
        if (status === "late") lateCount++;
        const row = {
          student_id: r.student_id, class_id, date, period: period || null,
          subject_id: subject_id || null, teacher_id: teacher_id || null,
          status, hours: r.hours ?? 1, late_minutes: status === "late" ? (r.late_minutes || 0) : 0,
          justified: status === "absent" && r.justified ? 1 : 0, reason: r.reason || null,
          document_ref: null, note: r.note || null, recorded_by: req.user.id,
        };
        const ex = findExisting.get(r.student_id, date, period || "", subject_id || 0);
        if (ex) updateRow.run({
          id: ex.id, status: row.status, hours: row.hours, late_minutes: row.late_minutes,
          justified: row.justified, reason: row.reason, note: row.note, recorded_by: row.recorded_by,
        });
        else insertRow.run(row);
        // أتمتة: التأخر > العتبة → تسجيل في التأخرات + طلب إشعار الولي
        if (status === "late" && (r.late_minutes || 0) > lateTh) {
          const exists = db.prepare("SELECT 1 FROM late_arrivals WHERE student_id=? AND date=? AND source='attendance' AND IFNULL(period,'')=IFNULL(NULLIF(?,''),'')").get(r.student_id, date, period || "");
          if (!exists) {
            insertLate.run(r.student_id, class_id, date, r.time || "08:15", r.late_minutes || 0, subject_id || null, period || null, 0, req.user.id);
            lateAlerts++;
          }
        }
      }
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
    audit(req.user, "attendance_save", "attendance", `${date}/${class_id}`, `تسجيل حضور القسم ${cls?.name ?? class_id} — غياب: ${absentCount}, تأخر: ${lateCount}`);
    res.json({ ok: true, absent: absentCount, late: lateCount, late_alerts: lateAlerts });
  });

  // ===== الغيابات =====
  app.get("/api/absences", auth, (req, res) => {
    const { class_id, month, justified, page = "1", per_page = "20" } = req.query;
    const where = ["a.status='absent'", "s.status='active'"];
    const args = [];
    if (class_id) { where.push("a.class_id=?"); args.push(class_id); }
    if (month) { where.push("strftime('%Y-%m',a.date)=?"); args.push(month); }
    if (justified === "1") where.push("a.justified=1");
    if (justified === "0") where.push("a.justified=0");
    const w = where.join(" AND ");
    const total = db.prepare(`SELECT COUNT(*) c FROM attendance a JOIN students s ON s.id=a.student_id WHERE ${w}`).get(...args).c;
    const rows = db.prepare(`
      SELECT a.id, a.date, a.hours, a.justified, a.reason, a.document_ref, a.period,
        s.id AS student_id, s.full_name, s.massar_id, s.guardian_phone, s.whatsapp, s.guardian_name,
        c.name AS class_name, sub.name AS subject_name,
        (SELECT COALESCE(SUM(hours),0) FROM attendance WHERE student_id=s.id AND status='absent') AS total_hours
      FROM attendance a JOIN students s ON s.id=a.student_id
      LEFT JOIN classes c ON c.id=a.class_id LEFT JOIN subjects sub ON sub.id=a.subject_id
      WHERE ${w} ORDER BY a.date DESC, s.full_name LIMIT ? OFFSET ?`).all(...args, +per_page, (+page - 1) * +per_page);
    const absTh = parseFloat(getSetting("absence_threshold_hours") || "20");
    for (const r of rows) r.over_threshold = r.total_hours > absTh;
    // مجموعات
    const today = new Date().toISOString().slice(0, 10);
    const weekStart = new Date(Date.now() - 6 * 86400e3).toISOString().slice(0, 10);
    const monthStart = today.slice(0, 7) + "-01";
    const totals = {
      day: db.prepare("SELECT COUNT(*) c, COALESCE(SUM(hours),0) h FROM attendance WHERE status='absent' AND date=?").get(today),
      week: db.prepare("SELECT COUNT(*) c, COALESCE(SUM(hours),0) h FROM attendance WHERE status='absent' AND date>=?").get(weekStart),
      month: db.prepare("SELECT COUNT(*) c, COALESCE(SUM(hours),0) h FROM attendance WHERE status='absent' AND date>=?").get(monthStart),
      total_hours: db.prepare("SELECT COALESCE(SUM(hours),0) h FROM attendance WHERE status='absent'").get().h,
      justified_hours: db.prepare("SELECT COALESCE(SUM(hours),0) h FROM attendance WHERE status='absent' AND justified=1").get().h,
      unjustified_hours: db.prepare("SELECT COALESCE(SUM(hours),0) h FROM attendance WHERE status='absent' AND justified=0").get().h,
    };
    const watchlist = db.prepare(`
      SELECT s.id, s.full_name, c.name AS class_name, SUM(a.hours) AS hours, s.guardian_phone
      FROM students s JOIN attendance a ON a.student_id=s.id AND a.status='absent'
      LEFT JOIN classes c ON c.id=s.class_id WHERE s.status='active'
      GROUP BY s.id HAVING SUM(a.hours) > ? ORDER BY SUM(a.hours) DESC`).all(absTh);
    res.json({ rows, total, page: +page, totals, watchlist });
  });

  app.post("/api/absences/:id/justify", requireRole("director", "surveillance", "admin"), (req, res) => {
    const a = db.prepare("SELECT * FROM attendance WHERE id=? AND status='absent'").get(req.params.id);
    if (!a) return res.status(404).json({ error: "سجل الغياب غير موجود" });
    const { justified, reason, document_ref } = req.body || {};
    db.prepare("UPDATE attendance SET justified=?, reason=?, document_ref=?, updated_at=datetime('now','localtime') WHERE id=?")
      .run(justified ? 1 : 0, clean(reason), clean(document_ref), a.id);
    audit(req.user, "justify", "attendance", a.id, justified ? `تبرير غياب (${reason ?? ""})` : "إلغاء تبرير غياب");
    res.json({ ok: true });
  });

  app.post("/api/absences/manual", requireRole("director", "surveillance", "admin"), (req, res) => {
    const { student_id, date, hours, subject_id, period, justified, reason, note } = req.body || {};
    const s = db.prepare("SELECT * FROM students WHERE id=?").get(student_id);
    if (!s) return res.status(404).json({ error: "التلميذ غير موجود" });
    db.prepare(`INSERT INTO attendance(student_id,class_id,date,period,subject_id,status,hours,justified,reason,note,recorded_by)
      VALUES(?,?,?,?,?,'absent',?,?,?,?,?)`)
      .run(student_id, s.class_id, date || new Date().toISOString().slice(0, 10), period || null, subject_id || null,
        hours || 1, justified ? 1 : 0, clean(reason), clean(note), req.user.id);
    audit(req.user, "create", "attendance", student_id, `تسجيل غياب يدوي للتلميذ ${s.full_name}`);
    res.json({ ok: true });
  });

  // ===== التأخرات =====
  app.get("/api/lates", auth, (req, res) => {
    const { class_id, month, over_threshold, page = "1", per_page = "20" } = req.query;
    const where = ["1=1"];
    const args = [];
    if (class_id) { where.push("la.class_id=?"); args.push(class_id); }
    if (month) { where.push("strftime('%Y-%m',la.date)=?"); args.push(month); }
    const lateTh = parseInt(getSetting("late_threshold_minutes") || "10", 10);
    if (over_threshold === "1") { where.push("la.minutes>?"); args.push(lateTh); }
    const w = where.join(" AND ");
    const total = db.prepare(`SELECT COUNT(*) c FROM late_arrivals la JOIN students s ON s.id=la.student_id WHERE ${w}`).get(...args).c;
    const rows = db.prepare(`
      SELECT la.*, s.full_name, s.massar_id, s.guardian_phone, s.whatsapp, s.guardian_name,
        c.name AS class_name, sub.name AS subject_name,
        (SELECT COUNT(*) FROM late_arrivals WHERE student_id=s.id) AS student_late_count
      FROM late_arrivals la JOIN students s ON s.id=la.student_id
      LEFT JOIN classes c ON c.id=la.class_id LEFT JOIN subjects sub ON sub.id=la.subject_id
      WHERE ${w} ORDER BY la.date DESC, la.id DESC LIMIT ? OFFSET ?`).all(...args, +per_page, (+page - 1) * +per_page);
    for (const r of rows) { r.over_threshold = r.minutes > lateTh; r.reason_type = r.justified ? "مبرر" : "غير مبرر"; }
    res.json({ rows, total, page: +page, late_threshold: lateTh });
  });

  app.post("/api/lates", requireRole("director", "surveillance", "teacher"), (req, res) => {
    const { student_id, date, time, minutes, reason, justified } = req.body || {};
    const s = db.prepare("SELECT s.*, c.name AS class_name FROM students s LEFT JOIN classes c ON c.id=s.class_id WHERE s.id=?").get(student_id);
    if (!s) return res.status(404).json({ error: "التلميذ غير موجود" });
    const lateTh = parseInt(getSetting("late_threshold_minutes") || "10", 10);
    const info = db.prepare(`INSERT INTO late_arrivals(student_id,class_id,date,time,minutes,reason,justified,notified,source,recorded_by)
      VALUES(?,?,?,?,?,?,?,0,'gate',?)`).run(student_id, s.class_id, date || new Date().toISOString().slice(0, 10), time || "08:00",
      minutes || 0, clean(reason), justified ? 1 : 0, req.user.id);
    audit(req.user, "create", "late_arrivals", info.lastInsertRowid, `تسجيل تأخر ${minutes} د — ${s.full_name}`);
    res.json({ ok: true, id: info.lastInsertRowid, over_threshold: (minutes || 0) > lateTh });
  });

  app.post("/api/lates/:id/justify", requireRole("director", "surveillance", "admin"), (req, res) => {
    const la = db.prepare("SELECT * FROM late_arrivals WHERE id=?").get(req.params.id);
    if (!la) return res.status(404).json({ error: "سجل التأخر غير موجود" });
    const { justified, reason } = req.body || {};
    db.prepare("UPDATE late_arrivals SET justified=?, reason=? WHERE id=?").run(justified ? 1 : 0, clean(reason) ?? la.reason, la.id);
    audit(req.user, "justify", "late_arrivals", la.id, justified ? "تبرير تأخر" : "إلغاء تبرير تأخر");
    res.json({ ok: true });
  });
  app.post("/api/lates/:id/mark-notified", requireRole("director", "surveillance", "admin"), (req, res) => {
    db.prepare("UPDATE late_arrivals SET notified=1 WHERE id=?").run(req.params.id);
    audit(req.user, "update", "late_arrivals", req.params.id, "تعليم التأخر: تم إشعار الولي");
    res.json({ ok: true });
  });

  // ===== الإشعارات =====
  app.get("/api/notifications", auth, (req, res) => {
    const { status, page = "1", per_page = "20" } = req.query;
    const where = []; const args = [];
    if (status && status !== "all") { where.push("n.status=?"); args.push(status); }
    const w = where.length ? "WHERE " + where.join(" AND ") : "";
    const total = db.prepare(`SELECT COUNT(*) c FROM notifications n ${w}`).get(...args).c;
    const rows = db.prepare(`
      SELECT n.*, s.full_name AS student_name, s.massar_id
      FROM notifications n LEFT JOIN students s ON s.id=n.student_id
      ${w} ORDER BY n.id DESC LIMIT ? OFFSET ?`).all(...args, +per_page, (+page - 1) * +per_page);
    const counts = {
      all: db.prepare("SELECT COUNT(*) c FROM notifications").get().c,
      pending: db.prepare("SELECT COUNT(*) c FROM notifications WHERE status='pending'").get().c,
      sent: db.prepare("SELECT COUNT(*) c FROM notifications WHERE status='sent'").get().c,
      failed: db.prepare("SELECT COUNT(*) c FROM notifications WHERE status='failed'").get().c,
    };
    res.json({ rows, total, page: +page, counts, wa_enabled: getSetting("wa_enabled") === "1" });
  });

  // إنشاء إشعار (يدوي أو من قالب)
  app.post("/api/notifications", requireRole("director", "surveillance", "admin"), (req, res) => {
    const { student_id, template_key, message, reason, phone } = req.body || {};
    let finalMsg = message;
    let guardPhone = phone;
    let guardName = null;
    let st = null;
    if (student_id) {
      st = db.prepare("SELECT s.*, c.name AS class_name FROM students s LEFT JOIN classes c ON c.id=s.class_id WHERE s.id=?").get(student_id);
      if (!st) return res.status(404).json({ error: "التلميذ غير موجود" });
      guardPhone = guardPhone || st.whatsapp || st.guardian_phone;
      guardName = st.guardian_name;
    }
    if (!finalMsg && template_key && st) {
      const stats = studentAbsenceStats(st.id);
      const composed = composeNotice(st, reason, {
        templateKey: template_key,
        hours: Math.ceil(stats.absence_hours),
        date: new Date().toISOString().slice(0, 10),
      });
      finalMsg = composed.message;
    }
    if (!finalMsg) return res.status(400).json({ error: "نص الرسالة فارغ" });
    if (!guardPhone) return res.status(400).json({ error: "لا يوجد رقم هاتف للولي — أكمل معلومات التلميذ أولاً" });
    const info = db.prepare(`INSERT INTO notifications(student_id,guardian_name,phone,reason,message,status,channel,created_by)
      VALUES(?,?,?,?,?, 'pending', 'whatsapp', ?)`).run(student_id || null, guardName, guardPhone, clean(reason) || "رسالة إدارية", finalMsg, req.user.id);
    audit(req.user, "create", "notifications", info.lastInsertRowid, "تحضير إشعار ولي" + (st ? ` — ${st.full_name}` : ""));
    res.json({ ok: true, id: info.lastInsertRowid, wa_link: `https://wa.me/${normalizePhone(guardPhone, getSetting("country_code"))}?text=${encodeURIComponent(finalMsg)}` });
  });

  // الإرسال الفعلي — لا يُفعل إلا إذا كانت الخدمة مربوطة فعلاً
  app.post("/api/notifications/:id/send", requireRole("director", "surveillance", "admin"), async (req, res) => {
    const n = db.prepare("SELECT n.*, s.full_name AS student_name FROM notifications n LEFT JOIN students s ON s.id=n.student_id WHERE n.id=?").get(req.params.id);
    if (!n) return res.status(404).json({ error: "الإشعار غير موجود" });
    if (n.status === "sent") return res.status(400).json({ error: "الإشعار مُرسل من قبل" });
    if (getSetting("wa_enabled") !== "1" || !getSetting("wa_token") || !getSetting("wa_phone_number_id")) {
      // لا نتظاهر بالإرسال: نبقى في حالة انتظار مع رابط wa.me للإرسال اليدوي
      const waLink = `https://wa.me/${normalizePhone(n.phone, getSetting("country_code"))}?text=${encodeURIComponent(n.message)}`;
      return res.status(409).json({
        error: "غير مرتبط بخدمة WhatsApp",
        hint: "استعمل زر «فتح في واتساب» للإرسال اليدوي ثم أكّد الإرسال، أو اربط واتساب للأعمال من الإعدادات.",
        wa_link: waLink,
      });
    }
    try {
      const ver = getSetting("wa_api_version") || "v21.0";
      const resp = await fetch(`https://graph.facebook.com/${ver}/${getSetting("wa_phone_number_id")}/messages`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${getSetting("wa_token")}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp", to: normalizePhone(n.phone, getSetting("country_code")),
          type: "text", text: { preview_url: false, body: n.message },
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data?.error?.message || `HTTP ${resp.status}`);
      db.prepare("UPDATE notifications SET status='sent', sent_at=datetime('now','localtime'), sent_via='api' WHERE id=?").run(n.id);
      audit(req.user, "send", "notifications", n.id, `إرسال إشعار عبر WhatsApp API${n.student_name ? ` — ${n.student_name}` : ""}`);
      res.json({ ok: true, status: "sent" });
    } catch (e) {
      db.prepare("UPDATE notifications SET status='failed', error=? WHERE id=?").run(String(e.message || e), n.id);
      audit(req.user, "send_failed", "notifications", n.id, `فشل إرسال: ${e.message || e}`);
      res.status(502).json({ error: `فشل الإرسال: ${e.message || e}` });
    }
  });

  // تأكيد إرسال يدوي (بعد استعمال wa.me)
  app.post("/api/notifications/:id/confirm-manual", requireRole("director", "surveillance", "admin"), (req, res) => {
    const n = db.prepare("SELECT * FROM notifications WHERE id=?").get(req.params.id);
    if (!n) return res.status(404).json({ error: "الإشعار غير موجود" });
    db.prepare("UPDATE notifications SET status='sent', sent_at=datetime('now','localtime'), sent_via='manual (wa.me)' WHERE id=?").run(n.id);
    audit(req.user, "confirm_manual", "notifications", n.id, "تأكيد إرسال يدوي عبر wa.me");
    // تعليم التأخر المقابل كمشعار إن وُجد
    if (n.student_id && (n.reason || "").startsWith("تأخر")) {
      db.prepare("UPDATE late_arrivals SET notified=1 WHERE student_id=? AND notified=0 AND date=date('now','localtime')").run(n.student_id);
    }
    res.json({ ok: true });
  });

  app.get("/api/templates", auth, (req, res) => res.json(db.prepare("SELECT * FROM notification_templates ORDER BY id").all()));
  app.put("/api/templates/:id", requireRole("director", "admin"), (req, res) => {
    const { name, body } = req.body || {};
    db.prepare("UPDATE notification_templates SET name=?, body=? WHERE id=?").run(clean(name), clean(body), req.params.id);
    audit(req.user, "update", "notification_templates", req.params.id, "تعديل قالب إشعار");
    res.json({ ok: true });
  });

  // ===== التقارير =====
  app.get("/api/reports/:key", auth, (req, res) => {
    const key = req.params.key;
    const { date, month } = req.query;
    const monthFilter = month || new Date().toISOString().slice(0, 7);
    let title = "", columns = [], rows = [];

    if (key === "daily_attendance") {
      title = `تقرير الحضور اليومي — ${date || new Date().toISOString().slice(0, 10)}`;
      columns = ["القسم", "عدد التلاميذ", "حاضر", "غائب", "متأخر", "نسبة الحضور"];
      rows = db.prepare(`
        SELECT c.name,
          (SELECT COUNT(*) FROM students WHERE class_id=c.id AND status='active') AS total,
          COALESCE(SUM(CASE WHEN a.status='present' THEN 1 END),0) AS present,
          COALESCE(SUM(CASE WHEN a.status='absent' THEN 1 END),0) AS absent,
          COALESCE(SUM(CASE WHEN a.status='late' THEN 1 END),0) AS late
        FROM classes c LEFT JOIN attendance a ON a.class_id=c.id AND a.date=?
        WHERE c.archived=0 GROUP BY c.id ORDER BY c.name`).all(date || new Date().toISOString().slice(0, 10))
        .map((r) => ({ ...r, rate: r.total ? ((r.present + r.late) / r.total * 100).toFixed(1) + "٪" : "—" }));
    } else if (key === "monthly_attendance") {
      title = `تقرير الحضور الشهري — ${monthFilter}`;
      columns = ["القسم", "الحصص المسجلة", "حضور", "غياب (حصص)", "ساعات الغياب", "نسبة الحضور"];
      rows = db.prepare(`
        SELECT c.name,
          COUNT(a.id) AS sessions,
          COALESCE(SUM(CASE WHEN a.status='present' THEN 1 END),0) AS present,
          COALESCE(SUM(CASE WHEN a.status='absent' THEN 1 END),0) AS absent,
          COALESCE(SUM(CASE WHEN a.status='absent' THEN a.hours END),0) AS hours
        FROM classes c LEFT JOIN attendance a ON a.class_id=c.id AND strftime('%Y-%m',a.date)=?
        WHERE c.archived=0 GROUP BY c.id ORDER BY c.name`).all(monthFilter)
        .map((r) => ({ ...r, rate: r.sessions ? ((r.present / r.sessions) * 100).toFixed(1) + "٪" : "—" }));
    } else if (key === "absences_by_class") {
      title = "الغيابات حسب الأقسام";
      columns = ["القسم", "عدد الغيابات", "ساعات مبررة", "ساعات غير مبررة", "المجموع (ساعات)"];
      rows = db.prepare(`
        SELECT c.name, COUNT(a.id) AS count,
          COALESCE(SUM(CASE WHEN a.justified=1 THEN a.hours END),0) AS justified,
          COALESCE(SUM(CASE WHEN a.justified=0 THEN a.hours END),0) AS unjustified,
          COALESCE(SUM(a.hours),0) AS total
        FROM classes c LEFT JOIN attendance a ON a.class_id=c.id AND a.status='absent'
        WHERE c.archived=0 GROUP BY c.id ORDER BY total DESC`).all();
    } else if (key === "absences_by_student") {
      title = "الغيابات حسب التلاميذ";
      columns = ["التلميذ", "رقم مسار", "القسم", "عدد الغيابات", "ساعات مبررة", "غير مبررة", "المجموع"];
      rows = db.prepare(`
        SELECT s.full_name, s.massar_id, c.name AS class_name,
          COUNT(a.id) AS count,
          COALESCE(SUM(CASE WHEN a.justified=1 THEN a.hours END),0) AS justified,
          COALESCE(SUM(CASE WHEN a.justified=0 THEN a.hours END),0) AS unjustified,
          COALESCE(SUM(a.hours),0) AS total
        FROM students s JOIN attendance a ON a.student_id=s.id AND a.status='absent'
        LEFT JOIN classes c ON c.id=s.class_id
        WHERE s.status='active' GROUP BY s.id HAVING SUM(a.hours) > 0 ORDER BY SUM(a.hours) DESC`).all();
    } else if (key === "lates_report") {
      title = `تقرير التأخرات — ${monthFilter}`;
      columns = ["التلميذ", "القسم", "التاريخ", "الوقت", "المدة (د)", "السبب", "الحالة", "إشعار الولي"];
      rows = db.prepare(`
        SELECT s.full_name, c.name AS class_name, la.date, la.time, la.minutes, la.reason,
          CASE WHEN la.justified=1 THEN 'مبرر' ELSE 'غير مبرر' END AS status_label,
          CASE WHEN la.notified=1 THEN 'نعم' ELSE 'لا' END AS notified_label
        FROM late_arrivals la JOIN students s ON s.id=la.student_id LEFT JOIN classes c ON c.id=la.class_id
        WHERE strftime('%Y-%m',la.date)=? ORDER BY la.date DESC`).all(monthFilter);
    } else if (key === "over_absence") {
      const th = parseFloat(getSetting("absence_threshold_hours") || "20");
      title = `التلاميذ الذين تجاوزوا ${th} ساعة غياب`;
      columns = ["التلميذ", "رقم مسار", "القسم", "هاتف الولي", "مجموع الساعات", "غير مبررة", "الحالة"];
      rows = db.prepare(`
        SELECT s.full_name, s.massar_id, c.name AS class_name, s.guardian_phone,
          SUM(a.hours) AS total,
          COALESCE(SUM(CASE WHEN a.justified=0 THEN a.hours END),0) AS unjustified,
          CASE WHEN SUM(a.hours) > ? THEN 'يتطلب تنبيه' ELSE 'مراقبة' END AS alert
        FROM students s JOIN attendance a ON a.student_id=s.id AND a.status='absent'
        LEFT JOIN classes c ON c.id=s.class_id
        WHERE s.status='active' GROUP BY s.id HAVING SUM(a.hours) >= ? ORDER BY SUM(a.hours) DESC`).all(th, th);
    } else if (key === "repeated_lates") {
      const minCount = parseInt(getSetting("repeated_lates_count") || "3", 10);
      title = `التلاميذ ذوو التأخر المتكرر (${minCount} مرات فأكثر)`;
      columns = ["التلميذ", "القسم", "عدد مرات التأخر", "أطول تأخر (د)", "مجموع الدقائق", "إشعارات مرسلة"];
      rows = db.prepare(`
        SELECT s.full_name, c.name AS class_name, COUNT(*) AS times, MAX(la.minutes) AS max_minutes,
          SUM(la.minutes) AS total_minutes,
          SUM(CASE WHEN la.notified=1 THEN 1 ELSE 0 END) AS notified_count
        FROM late_arrivals la JOIN students s ON s.id=la.student_id LEFT JOIN classes c ON c.id=la.class_id
        WHERE s.status='active' GROUP BY s.id HAVING COUNT(*) >= ? ORDER BY COUNT(*) DESC, MAX(la.minutes) DESC`).all(minCount);
    } else if (key === "notifications_report") {
      title = "سجل إشعارات أولياء التلاميذ";
      columns = ["التلميذ", "الهاتف", "السبب", "الحالة", "القناة", "تاريخ الإنشاء", "تاريخ الإرسال"];
      rows = db.prepare(`
        SELECT s.full_name, n.phone, n.reason,
          CASE n.status WHEN 'sent' THEN 'مرسل' WHEN 'pending' THEN 'قيد الانتظار' ELSE 'فاشل' END AS status_label,
          n.sent_via, n.created_at, n.sent_at
        FROM notifications n LEFT JOIN students s ON s.id=n.student_id ORDER BY n.id DESC`).all();
    } else {
      return res.status(404).json({ error: "تقرير غير معروف" });
    }
    audit(req.user, "report", "reports", key, title);
    res.json({ title, columns, rows });
  });

  // ===== الإعدادات =====
  app.get("/api/settings", requireRole("director", "surveillance", "admin"), (req, res) => {
    const s = getSettings();
    if (req.user.role !== "director") {
      // إخفاء البيانات الحساسة عن غير المدير
      delete s.wa_token; delete s.wa_phone_number_id;
      s.wa_configured = s.wa_enabled === "1";
    } else {
      s.wa_configured = s.wa_enabled === "1" && !!s.wa_token && !!s.wa_phone_number_id;
    }
    res.json(s);
  });

  app.put("/api/settings", requireRole("director"), (req, res) => {
    const allowed = ["school_name", "school_city", "school_address", "school_phone", "school_email", "academic_year",
      "late_threshold_minutes", "absence_threshold_hours", "repeated_lates_count", "country_code",
      "wa_enabled", "wa_phone_number_id", "wa_token", "wa_api_version"];
    const changes = [];
    for (const k of allowed) if (k in (req.body || {})) { setSetting(k, req.body[k]); changes.push(k); }
    audit(req.user, "update", "settings", null, `تعديل الإعدادات: ${changes.join(", ")}`);
    res.json({ ok: true });
  });

  // ===== المستخدمون =====
  app.get("/api/users", requireRole("director"), (req, res) => {
    res.json(db.prepare(`
      SELECT u.id, u.username, u.email, u.full_name, u.role, u.active, u.last_login_at, u.created_at, t.full_name AS teacher_name
      FROM users u LEFT JOIN teachers t ON t.id=u.teacher_id ORDER BY u.id`).all());
  });
  app.post("/api/users", requireRole("director"), (req, res) => {
    const { username, email, full_name, role, password, teacher_id } = req.body || {};
    if (!username || !full_name || !role || !password) return res.status(400).json({ error: "جميع الحقول إلزامية" });
    if (String(password).length < 6) return res.status(400).json({ error: "كلمة السر يجب أن تكون 6 أحرف على الأقل" });
    if (db.prepare("SELECT 1 FROM users WHERE username=?").get(username)) return res.status(400).json({ error: "اسم المستخدم موجود مسبقاً" });
    const info = db.prepare("INSERT INTO users(username,email,full_name,role,password_hash,teacher_id) VALUES(?,?,?,?,?,?)")
      .run(clean(username), clean(email), clean(full_name), role, hashPassword(password), teacher_id || null);
    audit(req.user, "create", "users", info.lastInsertRowid, `إنشاء حساب: ${username} (${role})`);
    res.json({ ok: true, id: info.lastInsertRowid });
  });
  app.put("/api/users/:id", requireRole("director"), (req, res) => {
    const u = db.prepare("SELECT * FROM users WHERE id=?").get(req.params.id);
    if (!u) return res.status(404).json({ error: "المستخدم غير موجود" });
    const { full_name, email, role, active } = req.body || {};
    if (u.role === "director" && active === 0) return res.status(400).json({ error: "لا يمكن إيقاف حساب المدير" });
    db.prepare("UPDATE users SET full_name=?, email=?, role=?, active=? WHERE id=?")
      .run(clean(full_name) ?? u.full_name, clean(email) ?? u.email, role ?? u.role, active !== undefined ? active : u.active, u.id);
    audit(req.user, "update", "users", u.id, `تعديل المستخدم: ${u.username}`);
    res.json({ ok: true });
  });
  app.post("/api/users/:id/reset-password", requireRole("director"), (req, res) => {
    const u = db.prepare("SELECT * FROM users WHERE id=?").get(req.params.id);
    if (!u) return res.status(404).json({ error: "المستخدم غير موجود" });
    const { password } = req.body || {};
    if (!password || String(password).length < 6) return res.status(400).json({ error: "كلمة السر يجب أن تكون 6 أحرف على الأقل" });
    db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(hashPassword(password), u.id);
    db.prepare("DELETE FROM sessions WHERE user_id=?").run(u.id);
    audit(req.user, "reset_password", "users", u.id, `إعادة تعيين كلمة سر: ${u.username}`);
    res.json({ ok: true });
  });

  // ===== سجل التدقيق =====
  app.get("/api/audit", requireRole("director"), (req, res) => {
    const { page = "1", per_page = "30", action } = req.query;
    const where = []; const args = [];
    if (action && action !== "all") { where.push("action=?"); args.push(action); }
    const w = where.length ? "WHERE " + where.join(" AND ") : "";
    const total = db.prepare(`SELECT COUNT(*) c FROM audit_logs ${w}`).get(...args).c;
    const rows = db.prepare(`SELECT * FROM audit_logs ${w} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...args, +per_page, (+page - 1) * +per_page);
    res.json({ rows, total, page: +page });
  });
}
