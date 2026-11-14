// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة.
// Navigation labels, groups and existing counter IDs have one owner here.
window.AQMNavigationItems = {
  primary: [
    { view: "home", icon: "🏠", label: "الرئيسية" },
    { view: "posts", icon: "📋", label: "الطلبات والعروض", counters: [{ id: "navPosts" }] },
    { view: "matches", icon: "🤝", label: "التطابق", counters: [{ id: "navMatches", cls: "match" }, { id: "navMatchesNew", cls: "hot", hidden: true }] },
    { view: "leads", icon: "🛒", label: "المشترين", counters: [{ id: "navLeads", cls: "buy" }] },
    { view: "listings", icon: "🎯", label: "هاتلي مشتري", counters: [{ id: "navListings" }] },
  ],
  groups: [
    { label: "العملاء والمتابعة", items: [
      { view: "sellers", icon: "🏷", label: "البائعين", counters: [{ id: "navSellers", cls: "sell" }] },
      { view: "pipe", icon: "💼", label: "الصفقات", counters: [{ id: "navPipe", cls: "match", hidden: true }] },
      { view: "today", icon: "☀️", label: "النهارده", counters: [{ id: "navToday", cls: "hot", hidden: true }] },
      { view: "saved", icon: "🔔", label: "دوّرلي على", counters: [{ id: "navSaved", cls: "hot", hidden: true }] },
    ] },
    { label: "التسويق والتواصل", items: [
      { view: "publish", icon: "📣", label: "نشر فيس بوك", counters: [{ id: "navPub", cls: "hot", hidden: true }] },
      { view: "spread", icon: "🌐", label: "الانتشار" },
      { view: "funnel", icon: "📥", label: "الواردين والقياس", counters: [{ id: "navFunnel", cls: "match", hidden: true }] },
      { view: "wasend", icon: "📨", label: "بوت واتساب", counters: [{ id: "navWa", cls: "hot", hidden: true }] },
    ] },
    { label: "أدوات العقارات", items: [
      { view: "pick", icon: "⭐", label: "رشّحلي", counters: [{ id: "navMagnet", cls: "hot", hidden: true }] },
      { view: "atlas", icon: "🗺", label: "الأطلس" },
      { view: "extract", icon: "👥", label: "استخراج" },
      { view: "stats", icon: "📈", label: "نبض السوق" },
    ] },
  ],
};
