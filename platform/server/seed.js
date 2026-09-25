// CLI: npm run seed — يعيد بناء القاعدة من الصفر ببيانات تجريبية
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "data", "alqods.db");

// حذف الملفات قبل أي فتح للاتصال
for (const f of [DB_PATH, DB_PATH + "-wal", DB_PATH + "-shm"]) {
  if (fs.existsSync(f)) fs.unlinkSync(f);
}

const { seed } = await import("./seed-data.js");
seed();
