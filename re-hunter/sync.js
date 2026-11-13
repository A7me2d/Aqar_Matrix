// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// ===== ☁️ المزامنة مع Supabase (رادار الطلبات / Alaa Deals) =====
(function (g) {
  const SQL = `-- شغّل ده مرة واحدة في Supabase ← SQL Editor
create table if not exists rh_posts (
  id text primary key, source text, type text, category text, deal text, region text,
  price numeric, area_m2 numeric, rooms int, phones text[], sender text, groups text[],
  url text, text text, posted_at timestamptz, scanned_at timestamptz, is_deal boolean, deal_pct int, updated_at timestamptz default now()
);
create table if not exists rh_leads (
  id text primary key, name text, phones text[], score int, level int, category text, categories text[],
  regions text[], budget numeric, want text, details text, last_at timestamptz, stage text, owner text, note text,
  next_at timestamptz, sources text[], profile_url text, asked jsonb, updated_at timestamptz default now()
);
create table if not exists rh_listings (
  id text primary key, title text, category text, deal text, region text, price numeric, area_m2 numeric,
  rooms int, floor text, finishing text, payment text, notes text, link text, status text,
  created_at timestamptz, updated_at timestamptz default now()
);
create table if not exists rh_crm (
  id text primary key, status text, title text, category text, region text, price numeric, area_m2 numeric, rooms int,
  owner_name text, owner_phones text[], owner_profile text, url text, grp text, note text, descr text,
  posted_at timestamptz, registered_at timestamptz, updated_at timestamptz default now()
);
alter table rh_posts enable row level security;
alter table rh_leads enable row level security;
alter table rh_listings enable row level security;
alter table rh_crm enable row level security;
-- الإضافة بتستخدم service_role key (بيتخطى الحماية)، فالجداول مقفولة قدام أي حد تاني.`;

  const iso = (t) => (t ? new Date(t).toISOString() : null);
  // قص آمن: ما يقطعش في نص زوج surrogate (إيموجي) — النص اليتيم كان بيخلّي Supabase يرفض الدفعة كلها (٤٠٠ صف)
  const cut = (s, n) => { s = String(s == null ? "" : s); if (s.length <= n) return s; let e = n; const c = s.charCodeAt(e - 1); if (c >= 0xd800 && c <= 0xdbff) e--; return s.slice(0, e); };
  const fetchT = (url, opt, ms = 45000) => { const ac = typeof AbortController === "function" ? new AbortController() : null; const t = ac ? setTimeout(() => ac.abort(), ms) : null; return fetch(url, ac ? { ...opt, signal: ac.signal } : opt).finally(() => t && clearTimeout(t)); };

  async function upsert(c, table, rows) {
    for (let i = 0; i < rows.length; i += 400) {
      const res = await fetchT(`${c.url.replace(/\/$/, "")}/rest/v1/${table}?on_conflict=id`, {
        method: "POST",
        headers: { apikey: c.key, Authorization: "Bearer " + c.key, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(rows.slice(i, i + 400)),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`${table}: ${res.status} ${t.slice(0, 160)}`);
      }
    }
  }

  async function test(c) {
    const res = await fetchT(`${c.url.replace(/\/$/, "")}/rest/v1/rh_posts?select=id&limit=1`, { headers: { apikey: c.key, Authorization: "Bearer " + c.key } });
    if (res.status === 404 || res.status === 400) throw new Error("الجداول مش موجودة — شغّل كود SQL الأول");
    if (!res.ok) throw new Error(`${res.status} — اتأكد من الرابط والـ key`);
    return true;
  }

  async function syncAll() {
    const d = await chrome.storage.local.get(["sbCfg", "posts", "settings", "comments", "leadMeta", "listings", "dealCfg", "crmReg", "aiLeads"]);
    const c = d.sbCfg || {};
    if (!c.url || !c.key) throw new Error("حط رابط Supabase والـ key في الإعدادات");
    const items = g.MATCH.enrichAll(d.posts || {}, d.settings);
    const deals = g.MATCH.findDeals(items, ((d.dealCfg && d.dealCfg.pct) || 15) / 100);
    const { leads } = g.LEADS.buildAll(items, d.comments || {}, g.PH.compile(d.settings), d.leadMeta || {}, d.aiLeads || {}); // نفس الدرجات والدمج اللي في الداشبورد
    const meta = d.leadMeta || {};
    const posts = items.map((p) => ({
      id: p.id, source: p.srcs.join(","), type: p.type, category: p.category, deal: p.deal, region: p.region, price: p.price,
      area_m2: p.areaM2, rooms: p.rooms, phones: p.phones, sender: p.sender, groups: p.groups, url: p.url || null,
      text: cut(p.text, 20000), posted_at: iso(p.ts), scanned_at: iso(p.scannedAt), is_deal: deals.has(p.id), deal_pct: deals.has(p.id) ? deals.get(p.id).pct : null,
    }));
    const lrows = leads.filter((L) => !L.isBroker).map((L) => {
      const m = meta[L.key] || {};
      return { id: L.key, name: L.name, phones: L.phones, score: L.score, level: L.level, category: L.category, categories: L.categories,
        regions: L.regions, budget: L.budget, want: L.want.text, details: L.want.parts.join(" · "), last_at: iso(L.last),
        stage: L.status === "hidden" ? "hidden" : m.stage || (m.status === "contacted" ? "contacted" : "new"), owner: m.owner || null, note: m.note || null,
        next_at: iso(m.nextAt), sources: L.sources, profile_url: g.LEADS.profileLink(L) || null,
        asked: L.asked.slice(0, 10).map((a) => ({ post: cut(a.postText || "", 300), said: a.comments.slice(0, 3), url: a.postUrl || null, group: a.group })) };
    });
    const listings = Object.values(d.listings || {}).map((u) => ({
      id: u.id, title: u.title, category: u.category, deal: u.deal, region: u.region, price: u.price, area_m2: u.areaM2, rooms: u.rooms,
      floor: u.floor, finishing: u.finishing, payment: u.payment, notes: u.notes, link: u.link, status: u.status, created_at: iso(u.createdAt),
    }));
    await upsert(c, "rh_posts", posts);
    await upsert(c, "rh_leads", lrows);
    let listErr = null;
    if (listings.length) { try { await upsert(c, "rh_listings", listings); } catch (e) { listErr = String((e && e.message) || e).slice(0, 120); } } // فشل «عروضي» ما يقطعش باقي المزامنة ولا يمنع كتابة sbStatus
    // 📝 سجل الـCRM (العروض اللي سجّلتها) — لو الجدول لسه مش موجود (كود SQL قديم) بنكمّل من غير ما نوقّع باقي المزامنة
    const crm = Object.values(d.crmReg || {}).map((r) => ({
      id: r.id, status: r.status, title: r.title, category: r.category, region: r.region, price: r.price, area_m2: r.areaM2, rooms: r.rooms,
      owner_name: (r.owner || {}).name || null, owner_phones: (r.owner || {}).phones || [], owner_profile: (r.owner || {}).profile || null,
      url: r.url || null, grp: r.group || null, note: r.note || null, descr: r.text || null, posted_at: iso(r.postedAt), registered_at: iso(r.at),
    }));
    let crmErr = null;
    if (crm.length) { try { await upsert(c, "rh_crm", crm); } catch (e) { crmErr = String((e && e.message) || e).slice(0, 120); } }
    const st = { at: Date.now(), posts: posts.length, leads: lrows.length, listings: listings.length, crm: crm.length, crmErr, listErr };
    await chrome.storage.local.set({ sbStatus: st });
    return st;
  }

  g.SYNC = { SQL, test, syncAll };
})(globalThis);
