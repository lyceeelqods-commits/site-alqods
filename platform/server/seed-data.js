// بيانات تجريبية واقعية — الثانوية التأهيلية القدس (القنيطرة)
// تُستعمل من طرف server/seed.js (CLI) أو تلقائياً عند أول تشغيل للخادم
import { db, initSchema, hashPassword, DEFAULT_SETTINGS, setSetting } from "./db.js";

export function seed() {
initSchema();

// ---------- مولد أرقام شبه عشوائي ثابت (نتائج قابلة للتكرار) ----------
let seedState = 20260925;
function rnd() {
  seedState |= 0; seedState = (seedState + 0x6D2B79F5) | 0;
  let t = Math.imul(seedState ^ (seedState >>> 15), 1 | seedState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));

// ---------- السنوات الدراسية ----------
const y2627 = db.prepare("INSERT INTO academic_years(label,start_date,end_date,is_current) VALUES(?,?,?,1)").run("2026/2027", "2026-09-07", "2027-07-10").lastInsertRowid;
db.prepare("INSERT INTO academic_years(label,start_date,end_date,is_current) VALUES(?,?,?,0)").run("2025/2026", "2025-09-08", "2026-07-10");

// ---------- المستويات والأقسام ----------
const levels = [
  ["الجذع المشترك العلمي", "TC", 1],
  ["الأولى باك علوم تجريبية", "1BAC-SE", 2],
  ["الأولى باك علوم اقتصادية وتدبيرية", "1BAC-SECO", 3],
  ["الثانية باك علوم فيزيائية", "2BAC-PC", 4],
  ["الثانية باك علوم الحياة والأرض", "2BAC-SVT", 5],
  ["الثانية باك آداب وعلوم إنسانية", "2BAC-LH", 6],
];
const levelIds = {};
for (const [name, short, sort] of levels) {
  levelIds[short] = db.prepare("INSERT INTO levels(name,short,sort) VALUES(?,?,?)").run(name, short, sort).lastInsertRowid;
}

const classDefs = [
  ["الجذع المشترك العلمي 1", "TC", "12"], ["الجذع المشترك العلمي 2", "TC", "11"],
  ["الأولى باك علوم تجريبية 1", "1BAC-SE", "09"], ["الأولى باك علوم تجريبية 2", "1BAC-SE", "10"],
  ["الأولى باك علوم اقتصادية 1", "1BAC-SECO", "07"], ["الأولى باك علوم اقتصادية 2", "1BAC-SECO", "08"],
  ["الثانية باك علوم فيزيائية 1", "2BAC-PC", "04"], ["الثانية باك علوم فيزيائية 2", "2BAC-PC", "05"],
  ["الثانية باك علوم الحياة والأرض 1", "2BAC-SVT", "02"], ["الثانية باك علوم الحياة والأرض 2", "2BAC-SVT", "03"],
  ["الثانية باك آداب 1", "2BAC-LH", "14"], ["الثانية باك آداب 2", "2BAC-LH", "15"],
];
const classIds = [];
for (const [name, lvl, room] of classDefs) {
  const id = db.prepare("INSERT INTO classes(name,level_id,academic_year_id,room) VALUES(?,?,?,?)").run(name, levelIds[lvl], y2627, room).lastInsertRowid;
  classIds.push({ id, level: lvl });
}

// ---------- المواد ----------
const subjects = [
  ["الرياضيات", "RIM"], ["الفيزياء والكيمياء", "PC"], ["علوم الحياة والأرض", "SVT"],
  ["اللغة العربية", "AR"], ["اللغة الفرنسية", "FR"], ["اللغة الإنجليزية", "EN"],
  ["الاجتماعيات", "HG"], ["التربية الإسلامية", "IE"], ["الفلسفة", "PH"], ["التربية البدنية", "EPS"],
];
const subjectIds = [];
for (const [name, short] of subjects) subjectIds.push(db.prepare("INSERT INTO subjects(name,short) VALUES(?,?)").run(name, short).lastInsertRowid);

// ---------- الأساتذة ----------
const teacherNames = [
  "نادية الزياني", "عبد الإله بنجلون", "سعاد الفيلالي", "محمد الحسني", "ليلى الشرقاوي",
  "كريم المرابط", "أمينة البقالي", "رشيد الودغيري", "حسناء السباعي", "ياسين العلمي",
  "فاطمة الزهراء الرامي", "عمر الإدريسي",
];
const teacherIds = [];
teacherNames.forEach((name, i) => {
  const id = db.prepare("INSERT INTO teachers(full_name,subject_id,phone,email) VALUES(?,?,?,?)")
    .run(name, subjectIds[i % subjectIds.length], `06${int(10, 79)}${int(1000000, 9999999)}`, `prof${i + 1}@alqods.ma`).lastInsertRowid;
  teacherIds.push(id);
});

// ---------- المستخدمون (كلمة السر الموحدة للعرض التجريبي: alqods123) ----------
const users = [
  ["moudir", "direction@alqods.ma", "عبد الرحيم بنشقرون", "director"],
  ["haraka", "surveillance@alqods.ma", "سعيد الودغيري", "surveillance"],
  ["idara", "admin@alqods.ma", "خديجة العلوي", "admin"],
  ["prof", "n.ziyani@alqods.ma", "نادية الزياني", "teacher"],
];
const userIds = {};
for (const [username, email, full, role] of users) {
  userIds[username] = db.prepare("INSERT INTO users(username,email,full_name,role,password_hash) VALUES(?,?,?,?,?)")
    .run(username, email, full, role, hashPassword("alqods123")).lastInsertRowid;
}

// ---------- الإعدادات ----------
for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) setSetting(k, v);

// ---------- قوالب الإشعارات ----------
const templates = [
  ["late_notice", "إشعار تأخر",
    "السلام عليكم،\nنحيطكم علماً أن ابنكم/ابنتكم [اسم التلميذ]، المتمدرس(ة) بالقسم [القسم]، سجل(ت) تأخراً قدره [المدة] دقيقة بتاريخ [التاريخ].\nالمرجو أخذ العلم.\nإدارة الثانوية التأهيلية القدس."],
  ["absence_notice", "إشعار غياب (تجاوز العتبة)",
    "السلام عليكم،\nنحيطكم علماً أن مجموع ساعات غياب ابنكم/ابنتكم [اسم التلميذ]، المتمدرس(ة) بالقسم [القسم]، بلغ [عدد الساعات] ساعة.\nالمرجو التواصل مع إدارة المؤسسة لمتابعة وضعية الغياب.\nإدارة الثانوية التأهيلية القدس."],
  ["manual", "رسالة يدوية",
    "السلام عليكم،\nنحيطكم علماً أن ابنكم/ابنتكم [اسم التلميذ]، المتمدرس(ة) بالقسم [القسم]: [السبب].\nالمرجو أخذ العلم.\nإدارة الثانوية التأهيلية القدس."],
];
for (const [key, name, body] of templates) db.prepare("INSERT INTO notification_templates(key,name,body) VALUES(?,?,?)").run(key, name, body);

// ---------- التلاميذ ----------
const maleNames = ["يوسف", "أحمد", "محمد", "عمر", "أدهم", "أيوب", "إلياس", "أنس", "زكرياء", "سفيان", "مهدي", "نور الدين", "عبد الله", "علاء", "رضى", "حمزة", "إسماعيل", "بلال", "طارق", "أيمن"];
const femaleNames = ["مريم", "سلمى", "إيمان", "هبة", "زينب", "خديجة", "نورة", "سارة", "ريم", "لينا", "أسماء", "بشرى", "وفاء", "حنان", "إيمان", "شيماء", "هاجر", "رجاء", "دعاء", "سلوى"];
const familyNames = ["العلمي", "بنعلي", "الإدريسي", "العلوي", "البقالي", "الحسني", "الفاسي", "الزهراوي", "المرابط", "الشرقاوي", "بلحاج", "الزياني", "الكتاني", "السباعي", "بركة", "أولحاج", "بوعزة", "الحيمر", "الجهادي", "الودغيري", "بنعمر", "الصقلي", "لحلو", "المنصوري", "بوزيد"];
const cities = ["القنيطرة", "القنيطرة", "القنيطرة", "سيدي قاسم", "سيدي سليمان", "مقونة", "لعلوكوس", "المرشوش", "زهاونة"];

const studentRows = [];
let massarCounter = 1300000 + int(100, 900);
function massarId() { massarCounter += int(3, 17); return "R" + massarCounter; }

for (const cls of classIds) {
  const n = int(14, 17);
  for (let i = 0; i < n; i++) {
    const gender = rnd() < 0.52 ? "F" : "M";
    const first = gender === "F" ? pick(femaleNames) : pick(maleNames);
    const last = pick(familyNames);
    const birthYear = cls.level.startsWith("2BAC") ? 2008 : cls.level.startsWith("1BAC") ? 2009 : 2010;
    const guardian = rnd() < 0.85 ? "الأب" : "الأم";
    const fatherName = `${pick(maleNames)} ${last}`;
    const motherName = `${pick(femaleNames)} ${pick(familyNames)}`;
    const guardianName = guardian === "الأب" ? fatherName : motherName;
    const phone = `06${int(10, 99)}${int(100000, 999999)}`;
    const hasWa = rnd() < 0.9;
    studentRows.push({
      massar_id: massarId(), full_name: `${first} ${last}`,
      gender, birth_date: `${birthYear}-${String(int(1, 12)).padStart(2, "0")}-${String(int(1, 28)).padStart(2, "0")}`,
      level_id: levelIds[cls.level], class_id: cls.id,
      father_name: fatherName, mother_name: motherName,
      guardian_name: guardianName, guardian_phone: phone, whatsapp: hasWa ? phone : "",
      address: `حي ${pick(["السلام", "المغرب العربي", "أول نكلة", "الحقانية", "بنسودة", "التقدم", "الياسمين"])}, ${pick(cities)}`,
      notes: rnd() < 0.08 ? pick(["حالة صحية تحت المتابعة", "معفى من الرياضة (شهادة طبية)", "متابعة خاصة من الحراسة", "أخية بالمؤسسة"]) : "",
      status: "active",
    });
  }
}
const studentIds = [];
for (const s of studentRows) {
  const { status, ...row } = s; // node:sqlite يرفض المعاملات الزائدة
  const id = db.prepare(`INSERT INTO students(massar_id,full_name,gender,birth_date,level_id,class_id,father_name,mother_name,guardian_name,guardian_phone,whatsapp,address,notes,status)
    VALUES(@massar_id,@full_name,@gender,@birth_date,@level_id,@class_id,@father_name,@mother_name,@guardian_name,@guardian_phone,@whatsapp,@address,@notes,'active')`).run(row).lastInsertRowid;
  studentIds.push(id);
}

// ---------- أيام الدراسة (الاثنين→الجمعة) من 7 شتنبر إلى اليوم ----------
function schoolDays() {
  const days = [];
  const start = new Date(2026, 8, 7);
  const today = new Date();
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const wd = d.getDay();
    if (wd >= 1 && wd <= 5) days.push(d.toISOString().slice(0, 10));
  }
  return days;
}
const days = schoolDays();

// الدورات اليومية: 4 حصص (ساعتان مزدوجتان)
const dayPeriods = [
  { period: "1", hours: 1 }, { period: "2", hours: 2 }, { period: "3", hours: 1 }, { period: "4", hours: 2 },
];

// ---------- تلاميذ «مشكلون» لاختبار العتبات (فهارس ثابتة) ----------
const problemStudents = new Map(); // studentIndex -> {pAbsent, targetHours}
const problemTargets = [27, 24.5, 22.5, 21.5, 20.5, 18, 15, 13];
const problemIndexes = [];
{
  const step = Math.floor(studentIds.length / (problemTargets.length + 2));
  for (let i = 0; i < problemTargets.length; i++) problemIndexes.push((i + 1) * step);
  problemIndexes.forEach((idx, i) => problemStudents.set(studentIds[idx], { pAbsent: 0.16 + i * 0.012, target: problemTargets[i] }));
}
const lateOffenders = new Map(); // studentId -> عدد مرات التأخر
{
  const step = Math.floor(studentIds.length / 12);
  [2, 5, 9].forEach((i) => lateOffenders.set(studentIds[i * step], 4 - (i % 2))); // 4 أو 3 مرات
  [0, 3, 6, 11].forEach((i) => lateOffenders.set(studentIds[i * step], 1));
}

// ---------- توليد الحضور والغياب ----------
const insAtt = db.prepare(`INSERT INTO attendance(student_id,class_id,date,period,subject_id,teacher_id,status,hours,late_minutes,justified,reason,document_ref,note,recorded_by)
  VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
const reasonsJ = ["مرض بتخطي طبي", "إذن من الإدارة", "ظرف عائلي", "موعد طبي", "مشاركة في نشاط مخول"];
let attendanceRows = 0;

for (let di = 0; di < days.length; di++) {
  const date = days[di];
  for (let ci = 0; ci < classIds.length; ci++) {
    const cls = classIds[ci];
    // الأساتذة والمواد لهذا اليوم/القسم
    const sessions = dayPeriods.map((p, k) => ({
      ...p,
      subject_id: subjectIds[(ci + di + k * 2) % subjectIds.length],
      teacher_id: teacherIds[(ci * 2 + di + k) % teacherIds.length],
    }));
    const classStudentIds = studentRows
      .map((s, idx) => (s.class_id === cls.id ? studentIds[idx] : null))
      .filter(Boolean);
    for (const sess of sessions) {
      for (const sid of classStudentIds) {
        const prob = problemStudents.get(sid);
        const absent = rnd() < (prob ? prob.pAbsent : 0.038);
        const lateHere = !absent && lateOffenders.has(sid) && rnd() < 0.06 && di > days.length - 12;
        if (absent) {
          const justified = prob ? rnd() < 0.22 : rnd() < 0.42;
          insAtt.run(sid, cls.id, date, sess.period, sess.subject_id, sess.teacher_id, "absent", sess.hours, 0,
            justified ? 1 : 0, justified ? pick(reasonsJ) : null, justified ? `CERT-${int(1000, 9999)}/2026` : null,
            "", userIds.haraka);
        } else if (lateHere) {
          insAtt.run(sid, cls.id, date, sess.period, sess.subject_id, sess.teacher_id, "late", sess.hours, int(5, 25), 0, null, null, "دخل متأخراً", userIds.haraka);
        } else {
          insAtt.run(sid, cls.id, date, sess.period, sess.subject_id, sess.teacher_id, "present", sess.hours, 0, 0, null, null, "", userIds.haraka);
        }
        attendanceRows++;
      }
    }
  }
}

// ---------- تعويض الغياب للمشكلين حتى بلوغ العتبة المستهدفة ----------
const markAbsent = db.prepare("UPDATE attendance SET status='absent', justified=0, reason=NULL, document_ref=NULL WHERE id=?");
for (const [sid, { target }] of problemStudents) {
  let agg = db.prepare("SELECT COALESCE(SUM(hours),0) h FROM attendance WHERE student_id=? AND status='absent'").get(sid).h;
  if (agg >= target) continue;
  const presents = db.prepare("SELECT id, hours FROM attendance WHERE student_id=? AND status='present' ORDER BY date DESC, id DESC").all(sid);
  for (const row of presents) {
    if (agg >= target) break;
    markAbsent.run(row.id);
    agg += row.hours;
  }
}

// ---------- التأخرات (بوابة الحراسة) ----------
const insLate = db.prepare(`INSERT INTO late_arrivals(student_id,class_id,date,time,minutes,reason,justified,notified,source,recorded_by)
  VALUES(?,?,?,?,?,?,?,?,?,?)`);
const lateReasons = ["ازدحام المرور", "انقطاع النقل", "تأخر الحافلة", "ظرف عائلي صباحي", "استيقاظ متأخر"];
let lateIdRows = [];
for (const [sid, count] of lateOffenders) {
  const s = studentRows[studentIds.indexOf(sid)];
  for (let i = 0; i < count; i++) {
    const dayIdx = Math.max(0, days.length - 1 - int(0, 13));
    const minutes = pick([5, 7, 8, 10, 12, 12, 15, 18, 20, 25, 30]);
    const justified = rnd() < 0.25;
    const notified = minutes > 10 && rnd() < 0.4 ? 1 : 0;
    lateIdRows.push(sid);
    insLate.run(sid, s.class_id, days[dayIdx], `0${int(8, 10)}:${pick(["05", "10", "15", "20", "25", "35", "40"])}`, minutes,
      justified ? pick(lateReasons) : pick(lateReasons), justified ? 1 : 0, notified, "gate", userIds.haraka);
  }
}
// تأخرات متناثرة إضافية (أول ثلاث اليوم للحياة اليومية)
for (let i = 0; i < 14; i++) {
  const idx = int(0, studentIds.length - 1);
  const sid = studentIds[idx];
  const s = studentRows[idx];
  const minutes = i < 3 ? pick([5, 8, 12, 15]) : pick([3, 5, 6, 8, 10, 11, 14, 16]);
  const date = i < 3 ? days[days.length - 1] : days[int(0, days.length - 1)];
  insLate.run(sid, s.class_id, date, `0${int(8, 9)}:${pick(["10", "20", "30", "45"])}`, minutes, pick(lateReasons), rnd() < 0.3 ? 1 : 0, 0, "gate", userIds.haraka);
}

// ---------- إشعارات سابقة ----------
const insNotif = db.prepare(`INSERT INTO notifications(student_id,guardian_name,phone,reason,message,status,channel,created_by,created_at,sent_at,sent_via)
  VALUES(?,?,?,?,?,?,?,?,?,?,?)`);
const studentById = (id) => db.prepare("SELECT s.*, c.name AS class_name FROM students s LEFT JOIN classes c ON c.id=s.class_id WHERE s.id=?").get(id);
const tplLate = templates[0][2], tplAbs = templates[1][2];

let notifCount = 0;
for (const [sid, { target }] of problemStudents) {
  if (target < 20) continue;
  const st = studentById(sid);
  const msg = tplAbs.split("[اسم التلميذ]").join(st.full_name).split("[القسم]").join(st.class_name).split("[عدد الساعات]").join(String(Math.round(target)));
  const sent = notifCount % 3 !== 2;
  insNotif.run(sid, st.guardian_name, st.guardian_phone, "تجاوز عتبة الغياب (" + Math.round(target) + " ساعة)", msg,
    sent ? "sent" : "pending", "whatsapp", userIds.haraka,
    `2026-09-${String(int(15, 24)).padStart(2, "0")} 10:${pick(["15", "30", "45"])}`, sent ? "manual (wa.me)" : null);
  if (sent) db.prepare("UPDATE late_arrivals SET notified=1 WHERE student_id=?").run(sid);
  notifCount++;
}
for (let i = 0; i < 6; i++) {
  const sid = lateIdRows[i * 3] ?? studentIds[i + 7];
  const st = studentById(sid);
  const mins = pick([12, 15, 20, 25]);
  const dateStr = days[Math.max(0, days.length - 2 - i)];
  const msg = tplLate.split("[اسم التلميذ]").join(st.full_name).split("[القسم]").join(st.class_name).split("[المدة]").join(String(mins)).split("[التاريخ]").join(dateStr);
  const sent = i % 2 === 0;
  insNotif.run(sid, st.guardian_name, st.guardian_phone, `تأخر ${mins} دقيقة (> العتبة)`, msg,
    i === 5 ? "failed" : sent ? "sent" : "pending", "whatsapp", userIds.haraka,
    `${dateStr} 09:${pick(["40", "55"])}`, i === 5 ? null : sent ? "manual (wa.me)" : null);
  if (i === 5) db.prepare("UPDATE notifications SET error=? WHERE id=?").run("غير مرتبط بخدمة WhatsApp — تعذر الإرسال الآلي", db.prepare("SELECT MAX(id) id FROM notifications").get().id);
  notifCount++;
}

// ---------- سجل التدقيق الافتتاحي ----------
const insAudit = db.prepare("INSERT INTO audit_logs(user_id,username,action,entity,entity_id,details) VALUES(?,?,?,?,?,?)");
insAudit.run(null, "نظام", "seed", "database", null, "تهيئة قاعدة البيانات بالبيانات التجريبية");
insAudit.run(userIds.moudir, "moudir", "create", "users", null, "إنشاء حسابات المستخدمين الافتراضية");

// ---------- ملخص ----------
const count = (t) => db.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c;
console.log("✅ تمت تهيئة قاعدة البيانات:");
console.log(`   التلاميذ: ${count("students")} | الأقسام: ${count("classes")} | المستويات: ${count("levels")}`);
console.log(`   سجلات الحضور: ${count("attendance")} | التأخرات: ${count("late_arrivals")} | الإشعارات: ${count("notifications")}`);
console.log(`   المستخدمون: ${count("users")} | أيام الدراسة: ${days.length}`);
const over20 = db.prepare(`SELECT COUNT(DISTINCT student_id) c FROM attendance WHERE status='absent' GROUP BY student_id HAVING SUM(hours)>20`).all();
console.log(`   تلاميذ تجاوزوا 20 ساعة غياب: ${db.prepare("SELECT COUNT(*) c FROM (SELECT student_id FROM attendance WHERE status='absent' GROUP BY student_id HAVING SUM(hours)>20)").get().c}`);
}
