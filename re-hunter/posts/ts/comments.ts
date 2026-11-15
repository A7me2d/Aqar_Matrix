function renderPostTool() {
  const el = $("postTool"); if (!el) return;
  $("postJobMsg").textContent = postJob ? (postJob.result ? `✅ آخر سحب: ${postJob.result.people} معلّق من «${postJob.result.author}»` : "⏳ بيسحب في تاب البوست...") : "";
  const posts = Object.values(adPosts).sort((x, y) => y.scrapedAt - x.scrapedAt);
  $("postToolN").textContent = posts.length ? posts.length + " بوست" : "";
  if (!el.open) { $("postToolBody").innerHTML = ""; return; }
  $("postToolBody").innerHTML = posts.length ? `<div class="list">${posts.map((p) => {
      const open = state.open.has("ap:" + p.key);
      return `<article class="card" data-apkey="${esc(p.key)}">
        <div class="c-top"><b>💬 ${esc(p.author || "بوست")}</b><span class="badge b-cat">${p.people.length} معلّق</span><span class="when">${relDay(p.scrapedAt)}</span></div>
        <div class="text">${esc((p.text || "").slice(0, 300))}</div>
        <div class="c-bot"><a class="open-link" href="${esc(p.url)}" target="_blank">🔗 افتح البوست</a><span class="acts">
          <button class="btn sm" data-aptoggle>${open ? "▲ اخفي المعلّقين" : "👥 اعرض المعلّقين"}</button><button class="btn sm primary" data-apcsv>⬇️ المعلّقين Excel</button><button class="btn sm" data-aprerun>🔄 اسحب تاني</button></span></div>
        ${open ? `<div class="tbl-wrap"><table class="learn-t"><tr><th>الاسم</th><th>ID / اليوزر</th><th>التعليق</th><th></th></tr>${p.people.map((c) => {
          const it = c.text ? PH.interest(c.text, compiledG) : { w: 0, tags: [] };
          return `<tr><td><b>${esc(c.name)}</b>${c.reply ? ' <span class="tag-c">رد</span>' : ""}</td><td class="ltr">${esc(c.uid || "—")}</td><td>${esc((c.text || "—").slice(0, 160))}${it.w >= 25 ? ` <span class="chip hot">🔥 ${esc(it.tags.join("، "))}</span>` : ""}</td>
            <td>${c.profileUrl ? `<a class="btn sm" href="${esc(c.profileUrl)}" target="_blank">👤</a>` : ""}</td></tr>`; }).join("")}</table></div>` : ""}
      </article>`; }).join("")}</div>` : `<div class="empty"><b>لسه ما سحبتش تعليقات بوست</b>حط لينك أي بوست فوق ودوس «💬 افتحه واسحب التعليقات».</div>`;
}
function adPostCsv(p) {
  const q = csvQ;
  const rows = [["الاسم", "ID / اليوزر", "لينك البروفايل", "التعليق", "رد؟", "مهتم؟", "البوست"].join(",")]
    .concat(p.people.map((c) => { const it = c.text ? PH.interest(c.text, compiledG) : { w: 0, tags: [] }; return [c.name, c.uid ? "'" + c.uid : "", c.profileUrl, c.text, c.reply ? "رد" : "", it.w >= 25 ? it.tags.join(" · ") || "مهتم" : "", p.url].map(q).join(","); }));
  download(`معلّقين_${(p.author || "بوست").replace(/[\\/:*?"<>|\s]+/g, "-").slice(0, 40)}_${new Date().toISOString().slice(0, 10)}.csv`, "﻿" + rows.join("\r\n"), "text/csv;charset=utf-8");
}

async function startPostJob(url: string) {
  if (!/^https?:\/\/(www\.|web\.|m\.)?facebook\.com\//i.test(url || "")) return toast("حط لينك بوست فيسبوك صحيح");
  url = url.replace("://m.facebook.com", "://www.facebook.com");
  await chrome.storage.local.set({ postJob: { url, at: Date.now(), done: false } });
  if (WEB) { try { await WEB.openOnServer(url); toast("🖥 السيرفر بيفتح البوست ويسحب التعليقات… ارجع هنا بعد شوية"); } catch (e) { toast("❌ " + e.message); } return; }
  (window.__AQM_KEEP && __AQM_KEEP.openBg ? __AQM_KEEP.openBg(url) : window.open(url, "_blank")); toast("بيسحب التعليقات في الخلفية من غير ما يفتح صفحة قدامك — ارجع هنا بعد شوية");
}
