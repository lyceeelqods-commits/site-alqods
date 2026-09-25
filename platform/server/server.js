// خادم المنصة الداخلية — الثانوية التأهيلية القدس
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { db, initSchema, getSetting, getSettings } from "./db.js";
import { registerRoutes } from "./api.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

initSchema();

// إذا كانت القاعدة فارغة → تهيئة تلقائية بالبيانات التجريبية
const userCount = db.prepare("SELECT COUNT(*) c FROM users").get().c;
if (userCount === 0) {
  console.log("… قاعدة فارغة، جارٍ التهيئة بالبيانات التجريبية");
  await import("./seed.js");
}

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

// تسجيل المسارات
registerRoutes(app);

// تقديم واجهة الويب المبنية
const dist = path.join(__dirname, "..", "dist");
app.use(express.static(dist));
app.get(/^\/(?!api\/).*/, (req, res) => {
  const index = path.join(dist, "index.html");
  if (fs.existsSync(index)) res.sendFile(index);
  else res.status(503).send("الواجهة غير مبنية — نفّذ: npm run build");
});

// معالج الأخطاء
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "خطأ داخلي في الخادم" });
});

app.listen(PORT, "0.0.0.0", () => {
  const s = getSettings();
  console.log(`✅ منصة الحراسة العامة — الثانوية التأهيلية القدس`);
  console.log(`   http://localhost:${PORT}  |  السنة الدراسية ${s.academic_year}`);
  console.log(`   عتبة التأخر: ${s.late_threshold_minutes} د | عتبة الغياب: ${s.absence_threshold_hours} س`);
});
