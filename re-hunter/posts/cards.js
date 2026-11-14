// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة.
// Presentation for the posts screen. Existing data-act handlers remain in dashboard.js.
function postCard(p, opts, { more, ms, open, cl, dupOpen }) {
  const text = String(p.text || "");
  const preview = text.length > 240 ? text.slice(0, 240).trimEnd() + "…" : text;
  const specs = [
    p.price ? [p.type === "request" ? "الميزانية" : "السعر", PH.fmtPrice(p.price)] : null,
    p.areaM2 ? ["المساحة", p.areaM2 + " م²"] : p.area ? ["المساحة", p.area] : null,
    p.rooms ? ["الغرف", p.rooms] : null,
  ].filter(Boolean);
  const sources = (p.srcs || []).map((x) => `<span class="post-source">${esc(SRC1[x] || x)}</span>`).join("");
  return `<article class="card sgn post-card${p.done ? " done" : ""} t-${p.type}" data-id="${esc(p.id)}">
    <header class="post-card-head">
      <div class="post-card-heading"><span class="post-kind ${p.type}">${esc(TYPE1[p.type] || "بوست")}</span><h3>${esc(CATS[p.category] || "عقار")}${p.region ? `<span class="post-region">${esc(p.region)}</span>` : ""}</h3>${p.done ? `<span class="post-finished">خلصت</span>` : ""}</div>
      <div class="post-card-meta">${sources}<span class="when">${fmtWhen(p)}</span></div>
    </header>
    ${specs.length ? `<dl class="post-facts">${specs.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl>` : ""}
    <div class="post-card-body">${p.summary ? `<p class="post-summary"><span class="post-summary-label">ملخص الإعلان</span>${esc(p.summary)}</p>` : `<p class="post-preview">${OH(preview)}</p>`}</div>
    <div class="post-person"><div class="post-person-name"><span class="post-eyebrow">${p.type === "request" ? "صاحب الطلب" : "صاحب العرض"}</span><b>${esc(p.sender || "الاسم غير متاح")}</b>${purChip(p)}</div><div class="post-person-contact">${window.FBID ? FBID.chip(p, { inline: true }) : ""}</div></div>
    <details class="post-details"><summary>تفاصيل المنشور</summary><div class="post-detail-body">
      <div class="post-classification">${head(p)}${chips(p)}</div>
      ${text ? `<div class="post-original"><span class="post-eyebrow">النص الأصلي</span><div>${OH(text)}</div></div>` : ""}
      ${p.hasOcr ? `<details class="ocrbox"><summary>النص المستخرج من الصورة${p.ocrGain && p.ocrGain.length ? " · " + esc(p.ocrGain.join("، ")) : ""}</summary><div class="ocrtxt">${esc(p.ocr || "")}</div></details>` : ""}
      <div class="post-source-links"><span class="muted">${esc(p.groups[0] || "المصدر غير محدد")}${more}</span>${postLink(p)}</div>
      ${p.phones.length ? `<div class="phones">${phonesHtml(p)}</div>` : ""}
    </div></details>
    <footer class="post-card-footer">
      <div class="post-primary-actions">
        ${ms.length && !opts.hideMatchBtn ? `<button type="button" class="btn sm primary" data-act="matches">${ms.length} ${p.type === "request" ? "عرض مناسب" : "طلب مناسب"} ${open ? "▲" : "▼"}</button>` : ""}
        ${(p.type === "offer" || p.type === "request") && !opts.hideMatchBtn ? `<button type="button" class="btn sm" data-act="toListing">${p.type === "request" ? "هاتلي بايع" : "هاتلي مشتري"}</button>` : ""}
        ${p.type === "request" && (p.phones.length || p.uid) ? `<button type="button" class="btn sm" data-act="tplPost">رد جاهز</button>` : ""}
      </div>
      <details class="post-more-actions"><summary>إجراءات إضافية</summary><div class="post-secondary-actions">
        ${cl ? `<button type="button" class="btn sm" data-act="dups">${cl.count} ناشرين لنفس الوحدة${cl.minPrice ? " · أقل سعر " + PH.fmtPrice(cl.minPrice) : ""} ${dupOpen ? "▲" : "▼"}</button>` : ""}
        ${p.type === "offer" ? crmBtn(p.id) : ""}
        <button type="button" class="btn sm" data-act="fix">تصحيح البيانات</button>
        <button type="button" class="btn sm" data-act="copyText">نسخ النص</button>
        <button type="button" class="btn sm" data-act="done">${p.done ? "رجّعه للقائمة" : "✓ خلصت"}</button>
        <button type="button" class="btn sm danger" data-act="del" aria-label="حذف البوست">حذف</button>
      </div></details>
    </footer>
    ${state.tplFor === "p:" + p.id ? tplMenu("p:" + p.id) : ""}
    ${open && ms.length ? `<div class="mbox">${ms.map(miniMatch).join("")}</div>` : ""}
    ${dupOpen && cl ? `<div class="mbox"><div class="why">نفس الوحدة غالبًا · ${cl.posters} ناشرين${cl.minPrice && cl.maxPrice && cl.minPrice !== cl.maxPrice ? ` · الأسعار من ${PH.fmtPrice(cl.minPrice)} لـ ${PH.fmtPrice(cl.maxPrice)}` : ""}</div>${cl.ids.filter((id) => id !== p.id).map((id) => byId.get(id)).filter(Boolean).sort((a, b) => (a.price || 9e15) - (b.price || 9e15)).map((o) => miniMatch({ id: o.id, score: o.id === cl.cheapestId ? "الأرخص" : o.id === cl.ownerId ? "الأصل؟" : "", why: [o.id === cl.firstId ? "أول واحد نزّلها" : "", o.isBroker === false ? "شكله المالك" : ""].filter(Boolean) })).join("")}</div>` : ""}
  </article>`;
}
