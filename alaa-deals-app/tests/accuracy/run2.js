globalThis.chrome={storage:{local:{get:async()=>({}),set:async()=>{}}}};
require('../../app/engine/classify.js');
const P=require(process.argv[2]||'./posts.js'), C=require('./comments.js');
const c=PH.compile();
let fails=[], checks=0, ok=0;
const near=(a,b)=>a&&b&&Math.abs(a-b)/b<0.02;
for (const [t,e] of P) {
  const a=PH.analyze(t,c);
  const chk=(k,good,got)=>{checks++; if(good) ok++; else fails.push(`[${k}] ${t}\n     → متوقع ${JSON.stringify(e[k])} لقى ${JSON.stringify(got)}`);};
  if ('t' in e) chk('t', (a.type||null)===e.t, a.type);
  if (e.rent) chk('rent', a.rent===true, a.rent);
  if (e.c && e.t) chk('c', a.category===e.c, a.category);
  if (e.p) chk('p', near(a.price,e.p), a.price);
  if (e.a) chk('a', near(a.areaM2,e.a)|| Math.abs((a.areaM2||0)-e.a)<=2, a.areaM2);
  if (e.r) chk('r', a.region===e.r, a.region);
  if ('outside' in e) chk('outside', !!a.outside===e.outside, a.outside);
  if (e.ph) chk('ph', JSON.stringify(a.phones)===JSON.stringify(e.ph), a.phones);
}
for (const [t,e] of C) {
  const it=PH.interest(t,c); checks++;
  const got = it.rent?'rent': it.seller?'sell': it.w>=25?'buy':'none';
  if (got===e) ok++; else fails.push(`[comment] «${t}» → متوقع ${e} لقى ${got} (w=${it.w})`);
}
console.log(`الدقة: ${ok}/${checks} = ${(ok/checks*100).toFixed(1)}%  (بوستات ${P.length}، تعليقات ${C.length})`);
console.log(fails.join('\n'));
