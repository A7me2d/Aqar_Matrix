// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// ===== ☀️ تقرير اليوم — مشترك بين الإشعار ولوحة «النهارده» =====
(function (g) {
  const STAGES = { new: "جديد", contacted: "كلمته", viewing: "معاينة", negotiating: "تفاوض", won: "اتقفل ✅", lost: "مش مهتم" };
  const CAT1 = { land: "أراضي", apartment: "شقق", villa: "فيلا", other: "أخرى" };
  const endOfToday = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d.getTime(); };

  // المرحلة (متوافق مع الحالة القديمة "contacted")
  const stageOf = (m) => (m && (m.stage || (m.status === "contacted" ? "contacted" : ""))) || "new";

  function buildReport(items, leads, deals, leadMeta = {}, hours = 24) {
    const since = Date.now() - hours * 36e5;
    const seenAt = (p) => p.scannedAt || p.ts || 0;
    const fresh = items.filter((p) => seenAt(p) >= since && !p.outside); // بوستات محافظات تانية مش من شغلك — مش بتتعد
    const req = fresh.filter((p) => p.type === "request"), off = fresh.filter((p) => p.type === "offer");
    const byCat = {};
    for (const k of Object.keys(CAT1)) byCat[k] = { req: req.filter((p) => p.category === k).length, off: off.filter((p) => p.category === k).length };
    const regions = new Map();
    for (const p of req) if (p.region) regions.set(p.region, (regions.get(p.region) || 0) + 1);
    const topRegion = [...regions].sort((a, b) => b[1] - a[1])[0] || null;
    const active = (L) => !L.isBroker && !L.outside && !["hidden"].includes((leadMeta[L.key] || {}).status) && !["won", "lost"].includes(stageOf(leadMeta[L.key]));
    const hot = leads.filter((L) => L.level >= 3 && active(L) && L.last >= since && stageOf(leadMeta[L.key]) === "new");
    const warm = leads.filter((L) => L.level === 2 && active(L) && L.last >= since && stageOf(leadMeta[L.key]) === "new");
    const newDeals = off.filter((p) => deals.has(p.id));
    const due = leads.filter((L) => { const m = leadMeta[L.key]; return m && m.nextAt && m.nextAt <= endOfToday() && active(L); })
      .sort((a, b) => leadMeta[a.key].nextAt - leadMeta[b.key].nextAt);
    return { since, hours, req: req.length, off: off.length, byCat, topRegion, hot, warm, deals: newDeals, due };
  }

  function reportText(r) {
    const lines = [];
    if (r.hot.length) lines.push(`🔥🔥🔥 ${r.hot.length} عميل جاهز يشتري`);
    if (r.due.length) lines.push(`⏰ ${r.due.length} متابعة النهارده`);
    if (r.deals.length) lines.push(`🎯 ${r.deals.length} لقطة`);
    lines.push(`📋 ${r.req} طلب · ${r.off} عرض جديد`);
    if (r.topRegion) lines.push(`📍 أكتر منطقة طلبًا: ${r.topRegion[0]}`);
    return lines.join("\n");
  }

  g.REPORT = { buildReport, reportText, STAGES, stageOf, endOfToday };
})(globalThis);
