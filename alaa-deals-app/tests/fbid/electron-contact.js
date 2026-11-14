// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة. Proprietary & confidential.
// اختبار تكامل: برنامج Electron الحقيقي + دليل موظفين على localhost ← IPC ← net.fetch.
// التشغيل:  node tests/fbid/electron-contact.js   (بعد npm run sync)
const { spawn } = require("child_process");
const path = require("path"), os = require("os"), fs = require("fs"), http = require("http");
const electronPath = require("electron");
const DIR = {
  "100012345678901": JSON.stringify([{ Phone: "01000000001" }]), // رقم
  "100022222222222": "[]",                                        // مفيش داتا
};
const server = http.createServer((req, res) => {
  const id = new URL(req.url, "http://127.0.0.1").searchParams.get("id") || "";
  const body = DIR[id];
  if (body == null) { res.writeHead(500); return res.end("boom"); } // فشل اتصال
  res.writeHead(200, { "content-type": "text/plain; charset=utf-8" }); res.end(body);
});
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${server.address().port}/alaa-data.php`;
  const ud = path.join(os.tmpdir(), "alaa-elec-contact-" + Date.now());
  const env = { ...process.env, ALAA_TEST: "1", ALAA_TEST_SCRIPT: path.join(__dirname, "electron-contact-hook.js"),
    EMPLOYEE_PHONE_URL: url, ALAA_USERDATA: ud, ALAA_PARTITION: "persist:contacttest" + Date.now() };
  delete env.ELECTRON_RUN_AS_NODE; // لو متظبّط في البيئة، البرنامج بيشتغل كـNode مش Electron
  const p = spawn(electronPath, [path.join(__dirname, "../../app/main.js")], { env, stdio: "inherit" });
  p.on("exit", (code) => {
    server.close();
    try { fs.rmSync(ud, { recursive: true, force: true }); } catch {}
    console.log(code === 0 ? "✅Electron test OK" : `❌ Electron test failed (${code})`);
    process.exit(code == null ? 1 : code);
  });
})();
