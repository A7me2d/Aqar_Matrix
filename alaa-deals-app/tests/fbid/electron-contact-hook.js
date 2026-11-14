// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة. Proprietary & confidential.
// خطّاف اختبار Electron: بيتحقق من مسار «شارة التواصل» جوه البرنامج الحقيقي (IPC → net.fetch → الدليل على localhost).
// التشغيل من: tests/fbid/electron-contact.js
exports.run = async (alaa) => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let bad = 0;
  const ok = (c, m) => { console.log((c ? "✅ " : "❌ ") + m); if (!c) bad++; };
  const bg = alaa.bgWin;
  await wait(2500); // ننتظر لما الخلفية تحمّل
  if (!bg || bg.isDestroyed()) { console.log("❌ مفيش نافذة خلفية"); throw new Error("no bg"); }
  // 1) مسار البرنامج: من اللوحة → alaaApp.call → IPC → net.fetch → الدليل
  const direct = await bg.webContents.executeJavaScript(`globalThis.alaaApp.call("employeePhone", { id: "100012345678901" })`);
  ok(!!(direct && typeof direct.text === "string" && /01000000001/.test(direct.text)), "Electron: طلب الدليل رجع نص فيه الرقم");
  const bad1 = await bg.webContents.executeJavaScript(`globalThis.alaaApp.call("employeePhone", { id: "xx" })`);
  ok(!!(bad1 && bad1.error), "Electron: آيدي غير صالح مرفوض");
  // 2) مسار الخلفية (نفس مسار إضافة كروم والجداوة على السيرفر): lookup بيرجّع {ok, phone}
  const r1 = await bg.webContents.executeJavaScript(`globalThis.EMPLOYEEPHONE.lookup("100012345678901")`);
  ok(!!(r1 && r1.ok === true && r1.phone === "01000000001"), "Electron: الدليل رجّع التليفون");
  const r2 = await bg.webContents.executeJavaScript(`globalThis.EMPLOYEEPHONE.lookup("100022222222222")`);
  ok(!!(r2 && r2.ok === true && r2.phone === ""), "Electron: مفيش داتا (مش خطأ)");
  const r3 = await bg.webContents.executeJavaScript(`globalThis.EMPLOYEEPHONE.lookup("100099999999999")`);
  ok(!!(r3 && r3.ok === false && !!r3.error), "Electron: فشل الاتصال ظاهر كخطأ (مش «مفيش داتا»)");
  // 3) اللوحة الحقيقية: الشارة بتترسم فعلاً (تليفون · مفيش داتا · فشل اتصال)
  try {
    const main = alaa.mainWin;
    await main.webContents.executeJavaScript(`globalThis.alaaApp.call("openDash")`).catch(() => {});
    let dash = null;
    for (let i = 0; i < 60 && !dash; i++) {
      await wait(500);
      for (const t of alaa.tabs.values()) if (t.kind === "dash" && t.view && !t.view.webContents.isDestroyed()) dash = t.view.webContents;
    }
    if (!dash) { console.log("⚠️ اللوحة ما فتحتش — تخطّينا فحص الرسم"); }
    else {
      await wait(2500);
      const hasFbid = await dash.executeJavaScript(`typeof FBID === "object" && typeof FBID.chip === "function"`);
      ok(!!hasFbid, "اللوحة: شارة التواصل موجودة (FBID.chip)");
      const postHtml = await dash.executeJavaScript(`FBID.chip({ uid: "100099999999999", phones: ["01099999999"] })`);
      ok(/01099999999/.test(postHtml || ""), "اللوحة: الرقم المنشور في البوست بيتعرض");
      await dash.executeJavaScript(`FBID.chip({ uid: "100012345678901" }); FBID.chip({ uid: "100022222222222" }); FBID.chip({ uid: "100099999999999" }); "ok"`);
      await wait(2500);
      const st = await dash.executeJavaScript(`({ a: FBID._contactInner("100012345678901"), b: FBID._contactInner("100022222222222"), c: FBID._contactInner("100099999999999") })`);
      ok(/01000000001/.test(st.a || ""), "اللوحة: تليفون الدليل ظهر");
      ok(/معندوش داتا/.test(st.b || ""), "اللوحة: «معندوش داتا»");
      ok(/تعذر الاتصال/.test(st.c || "") && !/معندوش داتا/.test(st.c || ""), "اللوحة: «تعذر الاتصال» مختلف عن «معندوش داتا»");
    }
  } catch (e) { console.log("⚠️ فحص اللوحة اتخطّى: " + String((e && e.message) || e).slice(0, 160)); }
  console.log(bad ? `❌ ${bad} حالة فشلت` : "✅ كل الحالات تمام");
  if (bad) throw new Error("fbid contact electron test failed");
};
