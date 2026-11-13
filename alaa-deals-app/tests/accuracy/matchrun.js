// 🤝 اختبار التطابق: طلب ↔ عرض و مشتري ↔ بايع بكل الصيغ المترادفة
globalThis.chrome={storage:{local:{get:async()=>({}),set:async()=>{}}},runtime:{sendMessage:async()=>({})}};
const E='../../app/engine/';
require(E+'classify.js'); require(E+'match.js'); require(E+'leads.js');
const c=PH.compile();
let ok=0, bad=[], n=0;
const chk=(name,cond,info)=>{n++; if(cond) ok++; else bad.push(name+' → '+info);};
const mkItem=(t,i,extra={})=>{const a=PH.analyze(t,c);return {id:'x'+i,text:t,sender:'ناشر'+i,uid:'u'+i,groups:['g'],scannedAt:Date.now(),ts:Date.now(),phones:PH.extractPhones(t),srcs:['fb'],source:'fb',...a,...extra};};

// 1) العينة اللي المستخدم اشتكى منها بالظبط
const REQ='مطلوب قطعه ارض مسلسل 4 في حدود 2 مليون التنفيذ فوري';
const OFF='للبيع من المالك الأصلي قطعة أرض مميزة جداً في بني سويف الجديدة القطعة رقم 4 مسلسل 3 مساحة 276 متر الواجهة بحري صريح للتواصل 01012345678';
{
  const r=mkItem(REQ,1), o=mkItem(OFF,2);
  chk('عينة المستخدم: الطلب اتصنف طلب', r.type==='request' && r.category==='land', r.type+'/'+r.category);
  chk('عينة المستخدم: العرض اتصنف عرض', o.type==='offer' && o.category==='land', o.type+'/'+o.category);
  const m=MATCH.buildMatches([r,o]);
  const a=(m.get(r.id)||[]).find(x=>x.id===o.id), b=(m.get(o.id)||[]).find(x=>x.id===r.id);
  chk('عينة المستخدم: الطلب ↔ العرض (post-level) >=70', a&&a.score>=70&&b&&b.score>=70, JSON.stringify(a));
  // مشتري ↔ بايع
  const items=[r,o];
  const { leads }=LEADS.buildAll(items,{},c,{},{}); const sellers=LEADS.buildSellers(items,{},c,{});
  const pairs=MATCH.pairUp(leads.filter(L=>L.level>=1),sellers,{min:50,perBuyer:6});
  chk('عينة المستخدم: مشتري ↔ بايع >=70', pairs.length>=1 && pairs[0].score>=70, JSON.stringify(pairs.map(x=>x.score)));
}
// 2) صيغ مترادفة: لازم تتطابق (>=60)
const REQS=[
 ['مطلوب قطعة ارض مسلسل 4 في حدود 2 مليون','land'],['عايز قطعة ارض في مسلسل 4 الميزانية 2 مليون','land'],['محتاج قطعه ارض مسلسل ٤','land'],['عاوز ارض في مسلسل 4','land'],
 ['مطلوب شقه في الحي العاشر حدود 900 الف','apartment'],['عايز شقة في الحي العاشر','apartment'],['محتاج شقه في الحي العاشر','apartment'],
 ['مطلوب فيلا في الحي الثالث عشر','villa'],['عايز فيلا في الحي الثالث عشر','villa'],['محتاج فيلا في الحي الثالث عشر','villa']];
const OFFS={land:['متاح قطعة ارض مسلسل 4 مساحة 300 متر','يوجد قطعه ارض في مسلسل 3','لدينا قطعة ارض للبيع في مسلسل 4','قطعة ارض للبيع مسلسل 3 مساحة 276 متر من المالك'],
 apartment:['متاح شقه في الحي العاشر 120 متر','يوجد شقة للبيع في الحي العاشر','لدينا شقه للبيع في الحي الحادي عشر 150 متر','شقة للبيع الحي العاشر سعر 800 الف'],
 villa:['متاح فيلا في الحي الثالث عشر','يوجد فيلا للبيع في الحي الثالث عشر','لدينا فيلا للبيع بالحي الثالث عشر','فيلا للبيع في الحي الثالث عشر من المالك']};
let k=100;
for (const [rt,cat] of REQS) for (const ot of OFFS[cat]) {
  const r=mkItem(rt,k++), o=mkItem(ot,k++);
  const m=MATCH.buildMatches([r,o]); const a=(m.get(r.id)||[]).find(x=>x.id===o.id);
  chk(`[${cat}] «${rt.slice(0,30)}» ↔ «${ot.slice(0,30)}»`, r.type==='request'&&o.type==='offer'&&a&&a.score>=60, `${r.type}/${o.type}/${a&&a.score}`);
}
// 3) لازم ما يتطابقوش
const NEG=[
 ['مطلوب قطعة ارض مسلسل 4','للبيع شقة في مسلسل 4 مساحة 120 متر'],
 ['مطلوب شقه في الحي العاشر','للبيع فيلا في الحي العاشر'],
 ['مطلوب قطعة ارض الحي العاشر','للبيع قطعة ارض في الحي الثالث عشر 400 متر'],
 ['مطلوب قطعة ارض مسلسل 4 في حدود 2 مليون','للبيع قطعة ارض مسلسل 4 بسعر 6 مليون'],
];
for (const [rt,ot] of NEG) { const r=mkItem(rt,k++), o=mkItem(ot,k++); const m=MATCH.buildMatches([r,o]); const a=(m.get(r.id)||[]).find(x=>x.id===o.id);
  chk(`ممنوع: «${rt.slice(0,28)}» ✗ «${ot.slice(0,28)}»`, !a||a.score<50, JSON.stringify(a)); }
console.log(`التطابق: ${ok}/${n} = ${(ok/n*100).toFixed(1)}%`); if (bad.length) console.log(bad.join('\n')); process.exit(bad.length?1:0);
