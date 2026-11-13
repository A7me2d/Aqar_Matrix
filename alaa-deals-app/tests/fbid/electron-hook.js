// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved. Proprietary & confidential.
// فيسبوك مزيّف: كل https://www.facebook.com/<handle> بيرجع صفحة فيها ميتا تاج الآيدي
exports.setup = ({ ses }) => {
  ses.cookies.set({ url: "https://www.facebook.com", name: "c_user", value: "100000000000001", secure: true }).catch(() => {});
  ses.protocol.handle("https", async (req) => {
    const u = new URL(req.url);
    if (u.hostname !== "www.facebook.com") return new Response("blocked", { status: 403 });
    const h = decodeURIComponent(u.pathname.slice(1));
    globalThis.__fbHits = (globalThis.__fbHits || []).concat(h + "|cookie:" + (req.headers.get("cookie") || "-").slice(0, 40));
    if (h === "alice.smith") return new Response(`<html><head><meta property="al:android:url" content="fb://profile/100012345678901"></head><body></body></html>`, { status: 200, headers: { "content-type": "text/html" } });
    if (h === "bob.private") return new Response(`<html><head></head><body>nothing</body></html>`, { status: 200, headers: { "content-type": "text/html" } });
    return new Response("nf", { status: 404 });
  });
};
