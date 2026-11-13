// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// بينسخ محرك الإضافة (re-hunter) جوه البرنامج
const fs = require("fs"), path = require("path");
const src = path.resolve(__dirname, "../../re-hunter"), dst = path.resolve(__dirname, "../app/engine");
fs.rmSync(dst, { recursive: true, force: true });
fs.cpSync(src, dst, { recursive: true, filter: (p) => !/manifest\.json$/.test(p) });
console.log("engine synced:", fs.readdirSync(dst).join(", "));
// اسم البرنامج بدل اسم الإضافة
for (const f of fs.readdirSync(dst)) {
  if (!/\.(js|html)$/.test(f)) continue;
  const p = path.join(dst, f);
  const s = fs.readFileSync(p, "utf8");
  const t = s.replace(/Alaa Deals Ext/g, "Aqar Matrix");
  if (t !== s) fs.writeFileSync(p, t);
}
