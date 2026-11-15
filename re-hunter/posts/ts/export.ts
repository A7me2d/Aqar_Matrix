function exportPosts() {
  const list = filtered();
  if (!list.length) return toast("مفيش حاجة تتصدر");
  const q = csvQ;
  const head = ["المصدر", "النوع", "التصنيف", "المنطقة", "السعر", "المقدم", "المساحة", "سعر المتر", "الغرف", "الدور", "التشطيب", "الدفع",
    "المجاورة", "رقم القطعة", "الأوفر", "المدفوع", "الباقي", "نوع الأرض", "حالة الأرض", "مميزات",
    "مطابقات", "لقطة %", "مكررة (ناشرين)", "الأرقام", "المرسل", "سمسار؟", "الجروبات", "التاريخ", "خلصت", "الرابط", "ملخص AI", "النص"];
  const rows = [head.join(",")];
  for (const p of list) rows.push([p.srcs.map((x) => SRC1[x]).join(" / "), TYPE1[p.type], CAT1[p.category], p.region || "",
    p.price || "", p.down || "", p.area || "", PH.ppm(p) || "", p.rooms || "", p.floor || "", p.finishing || "", p.payment || "",
    (p.land || {}).mugawra || "", (p.land || {}).plot || "", (p.land || {}).over || "", (p.land || {}).paid || ((p.land || {}).paidPct ? (p.land || {}).paidPct + "%" : ""), (p.land || {}).remaining || "", (p.land || {}).type || "", ((p.land || {}).status || []).join(" / "), ((p.land || {}).features || []).join(" / "),
    (matches.get(p.id) || []).length, (deals.get(p.id) || {}).pct || "", (clusters.get(p.id) || {}).count || "", p.phones.map((n) => "'" + n).join(" / "), p.sender, p.isBroker === true ? "سمسار" : p.isBroker === false ? "مالك" : "",
    p.groups.join(" / "), fmtWhen(p), p.done ? "نعم" : "", p.url || "", p.summary || "", p.text].map(q).join(","));
  const d = new Date();
  download(`طلبات-عقارية_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}.csv`, "﻿" + rows.join("\r\n"), "text/csv;charset=utf-8");
  toast(`اتصدر ${list.length} صف`);
}