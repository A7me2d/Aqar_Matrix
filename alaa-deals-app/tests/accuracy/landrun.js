globalThis.chrome={storage:{local:{get:async()=>({}),set:async()=>{}}}};
require(process.env.CLS||'../../app/engine/classify.js');
const P=require('./land.js'); const c=PH.compile(); let ok=0,n=0,fails=[];
const near=(a,b)=>a&&b&&Math.abs(a-b)/b<0.02;
for (const [t,e] of P){ const a=PH.analyze(t,c);
  const chk=(k,good,got)=>{n++; if(good) ok++; else fails.push(`[${k}] ${t}\n   → متوقع ${JSON.stringify(k.startsWith('L.')?e.L[k.slice(2)]:e[k])} لقى ${JSON.stringify(got)}`);};
  if('t' in e) chk('t',(a.type||null)===e.t,a.type); if(e.c) chk('c',a.category===e.c,a.category); if(e.a) chk('a',Math.abs((a.areaM2||0)-e.a)<=2,a.areaM2);
  if(e.r) chk('r',a.region===e.r,a.region); if('p' in e) chk('p',e.p===null?!a.price:near(a.price,e.p),a.price);
  for(const [k,v] of Object.entries(e.L||{})) chk('L.'+k, JSON.stringify((a.land||{})[k])===JSON.stringify(v), (a.land||{})[k]); }
const C=[["الاوفر كام؟","buy"],["مدفوع كام","buy"],["المتر بكام في الحي ده","buy"],["رقم القطعة كام","buy"],["مجاورة كام","buy"],["الباقي كام للجهاز","buy"],["فين بالظبط في الحي","buy"],["عندي ارض في نفس المجاورة ارخص","sell"],["متاح عندي قطعة 400 في العاشر","sell"]];
for(const [t,e] of C){ n++; const it=PH.interest(t,c); const got=it.rent?'rent':it.seller?'sell':it.w>=25?'buy':'none'; if(got===e) ok++; else fails.push(`[comment] «${t}» → متوقع ${e} لقى ${got} (w=${it.w})`); }
console.log(`دقة الأراضي: ${ok}/${n} = ${(ok/n*100).toFixed(1)}%`); console.log(fails.join('\n'));
