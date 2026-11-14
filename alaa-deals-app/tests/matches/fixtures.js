// Copyright 2026 Alaa Ahmed - Aqar Matrix. All rights reserved.
// Fictitious local fixtures. No Facebook account, employee lookup or outbound messages.
function matchingFixtures() {
  const now = Date.now();
  const buyer = (key, name) => ({ key, name, uid: "", profileUrl: "", sources: ["fb"], phones: ["01000000000"],
    level: 3, btier: "pure", bwhy: [], bneg: [], categories: ["apartment"], status: "new", superHot: false,
    last: now, posts: 1, groups: ["بيانات اختبار محلية"], range: { min: 1500000, max: 2000000, mid: 1750000 },
    want: { text: "شقة في بني سويف، ١٥٠ متر، ٣ غرف", obj: { regions: ["مقبل"], area: 150 } }, wants: [],
    acts: [{ kind: "request", text: "مطلوب شقة في مقبل حوالي ١٥٠ متر وثلاث غرف، ويفضل من المالك.", postUrl: "https://example.invalid/request", ts: now }] });
  const unit = (id, region, price) => ({ id, category: "apartment", kind: "post", source: "fb", region, price, areaM2: 150,
    rooms: 3, finishing: "متشطبة", ts: now, land: {}, text: "شقة ١٥٠ متر، ٣ غرف، متشطبة وأسانسير. الإعلان ده بيانات اختبار محلية فقط.",
    url: "https://example.invalid/offer/" + id });
  const units = [unit("fixture-u1", "مقبل", 1800000), unit("fixture-u2", "مقبل", 1900000), unit("fixture-u3", "الجزيرة", 1700000), unit("fixture-u4", "مقبل", 2000000)];
  const seller = (key, name, us) => ({ key, name, uid: "", profileUrl: "", phones: ["01000000000"], sources: ["fb"],
    owner: true, isBroker: false, role: "owner", band: "sure-owner", rneg: [], units: us, last: now, status: "new" });
  const buyers = [buyer("fixture-b1", "مشتري تجريبي أول"), buyer("fixture-b2", "مشتري تجريبي تاني")];
  const sellers = [seller("fixture-s1", "بايع تجريبي أول", units.slice(0, 2)), seller("fixture-s2", "بايع تجريبي تاني", units.slice(2))];
  const pairs = units.map((u, i) => ({ B: buyers[0], S: sellers[i < 2 ? 0 : 1], u, score: 96 - i * 4,
    base: 96 - i * 4, why: ["نفس المنطقة المطلوبة", "السعر داخل الميزانية"], comps: { reg: 1, money: .9, area: 1, rooms: 1, fin: .8 }, unk: [], fb: 0 }));
  pairs.push({ ...pairs[0], B: buyers[1], score: 88 });
  return { buyers, sellers, units, pairs };
}
if (typeof module !== "undefined") module.exports = matchingFixtures;
