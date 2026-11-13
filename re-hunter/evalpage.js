// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🏷 صفحة «قيّم عقارك» (EVP) — ملف HTML واحد بيتنزّل ويترفع على أي استضافة (زي الكتالوج).
//  • المالك يختار النوع (أرض / شقة / فيلا) والحي، ويكتب المساحة (والمبني والسداد والرخصة للأرض) ← يطلعله مدى تقريبي من سعر المتر المعروض فعلًا في المنصة + متوسط سعر المتر، ورقم «كام عرض» اتبنى عليه.
//  • مفيش سعر نهائي ولا وعد: التقدير استرشادي من أسعار معروضة (مش مباعة)، والمعاينة هي اللي بتحدد. الصفحة نفسها مفيهاش ذكاء اصطناعي (مفتاحه مايتحطش في صفحة عامة) — التحليل بالذكاء الاصطناعي بيتم عندك في المنصة على بيانات الرسالة.
//  • زرار واتساب فيه كل التفاصيل وكود AM-EVAL22-H ← الرسالة بتتسجّل في «الواردين» كمالك عايز يبيع (مش مشتري).
//  • الصفحة فيها إحصائيات مجمّعة بس (حي: كام عرض ومدى سعر المتر) — مفيش أسماء ولا أرقام ولا روابط عروض.
(function (root) {
  const E = {};
  E.CODE = "AM-EVAL22";
  E.CATS = { land: "أرض", apartment: "شقة", villa: "فيلا" };
  const num = (v) => (Number.isFinite(+v) ? +v : 0);
  const pctl = (a, q) => { const x = [...a].sort((p, r) => p - r); return x.length ? x[Math.min(x.length - 1, Math.max(0, Math.round((x.length - 1) * q)))] : 0; };
  // بيحوّل صفوف landGuideRows() (أو مجموعات سعر المتر لأي نوع) لإحصائيات الصفحة. minN = أقل عدد عروض بسعر متر عشان الحي/المجاورة تظهر
  const stat = (ppm, minN) => { const a = (ppm || []).map(num).filter((v) => v > 0); if (a.length < minN) return null; const q = a.length >= 5;
    return { n: a.length, lo: Math.round(q ? pctl(a, 0.25) : Math.min(...a)), hi: Math.round(q ? pctl(a, 0.75) : Math.max(...a)), med: Math.round(pctl(a, 0.5)), wide: !q }; };
  E.rowsFrom = function (rows, o) {
    const minN = (o && o.minN) || 3, out = [];
    for (const r of rows || []) {
      const s = stat(r.ppm, minN); if (!s || !r.region) continue;
      const mugs = (r.mugs || []).map((m) => { const t = stat(m.ppm, minN); return t ? { name: String(m.name), ...t } : null; }).filter(Boolean);
      out.push({ d: String(r.region), ...s, trend: r.trend == null ? null : num(r.trend), mugs });
    }
    return out;
  };
  // رسالة واتساب: السطر الأول ثابت («عايز أعرف سعر أرضي — الحي — 300 م²») وبعده سطور «المفتاح: القيمة» (بيقراها plan.js → parseEval).
  // o = { cat, d, area, loc, built (رقم، 0 = فاضية، null/"" = ماتحددش), pay: paid|inst, lic: yes|no, ch }
  const OWN = { land: "أرضي", apartment: "شقتي", villa: "فيلتي" };
  const clean1 = (t) => String(t == null ? "" : t).replace(/[—\n\r]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  E.msg = function (o, area, extra) {
    if (typeof o === "string") o = { cat: "land", d: o, area, ...(extra || {}) };
    o = o || {}; const cat = OWN[o.cat] ? o.cat : "land", L = [`عايز أعرف سعر ${OWN[cat]} — ${o.d || "حي آخر"} — ${o.area ? Math.round(o.area) : "؟"} م²`];
    const loc = clean1(o.loc); if (loc) L.push("الموقع: " + loc);
    if (cat === "land") {
      if (o.built !== undefined && o.built !== null && o.built !== "") L.push("مبني: " + (num(o.built) > 0 ? Math.round(num(o.built)) + " م²" : "فاضية"));
      if (o.pay === "paid" || o.pay === "inst") L.push("السداد: " + (o.pay === "paid" ? "خالصة" : "عليها أقساط"));
      if (o.lic === "yes" || o.lic === "no") L.push("الرخصة: " + (o.lic === "yes" ? "فيه" : "مفيش"));
    }
    L.push(`كود ${E.CODE}-${o.ch || "H"}`);
    return L.join("\n");
  };
  const jsonSafe = (o) => JSON.stringify(o).replace(/</g, "\\u003c").split(String.fromCharCode(8232)).join("").split(String.fromCharCode(8233)).join("");

  // o = { brand, phone, date, rows:[أراضي — E.rowsFrom], cats:{apartment:[…], villa:[…]}, pixel }
  E.html = function (o) {
    const P = root.PMK; if (!P) return "";
    const esc = P.esc, brand = o.brand || "شركة مروج العقارية", tel = P.phoneIntl(o.phone || ""), rows = o.rows || [], cats = o.cats || {};
    const px = /^\d{8,20}$/.test(String(o.pixel || "").trim()) ? String(o.pixel).trim() : "";
    const pixelJs = px ? `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${px}');fbq('track','PageView');</script>` : "";
    const title = "كام سعر عقارك النهارده؟", lead = "اختار نوع العقار والحي واكتب المساحة، وهيظهرلك مدى تقريبي من العقارات المعروضة فعلًا في بني سويف الجديدة. ولو عايز تحليل أدق ابعتلنا التفاصيل على واتساب.";
    const data = { rows, cats: { apartment: cats.apartment || [], villa: cats.villa || [] }, tel, code: E.CODE, date: o.date || "" };
    return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(lead)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(lead)}">
<style>
${P.fontCss()}
:root{--ink:#0e2233;--mut:#5b6b7b;--paper:#f3f5f7;--card:#fff;--line:#d9e0e6;--acc:#0b7285;--wa:#16a34a;--good:#15803d}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.75 Cairo,Tahoma,Arial,sans-serif}
[hidden]{display:none!important}
.wrap{max-width:640px;margin:0 auto;padding:0 16px 130px}
.top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 0}.top b{font-size:17px}.cnt{color:var(--mut);font-size:14px}
h1{font-size:clamp(28px,7vw,40px);line-height:1.25;margin:6px 0 8px;font-weight:800;text-wrap:balance}.lead{color:var(--mut);font-size:17px;margin:0 0 18px;text-wrap:balance}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:14px;margin-bottom:14px}
label{display:flex;flex-direction:column;gap:5px;font-size:14px;color:var(--mut);font-weight:600}
select,input{height:50px;border:1.5px solid var(--line);border-radius:12px;background:var(--card);color:var(--ink);font:600 17px Cairo,Tahoma,Arial,sans-serif;padding:0 12px;width:100%}
input{direction:ltr;text-align:right}#loc{direction:rtl}
.seg{display:flex;gap:8px}.seg button{flex:1;min-height:48px;border:1.5px solid var(--line);border-radius:12px;background:var(--card);color:var(--ink);font:700 16px Cairo,Tahoma,Arial,sans-serif;cursor:pointer}
.seg button[aria-checked=true]{background:var(--ink);border-color:var(--ink);color:#fff}
.sub{margin:0;color:var(--mut);font-size:14px;font-weight:700}
button:focus-visible,a:focus-visible,select:focus-visible,input:focus-visible{outline:3px solid var(--acc);outline-offset:2px}
.out{border-color:var(--ink)}.out small{color:var(--mut);font-size:14px}
.rng{font:800 clamp(26px,7vw,34px)/1.3 Cairo,Arial,Tahoma,sans-serif}.rng em{font-style:normal;color:var(--mut);font-size:.55em;font-weight:700;margin:0 10px;display:inline-block}.rng span{display:inline-block;padding:0 2px}
.ppm{font-weight:700}.avg{color:var(--mut);font-weight:700;margin-top:-6px}.basis{margin:0;color:var(--mut);font-size:14.5px}
.chip{display:inline-block;border:1.5px solid var(--acc);color:var(--acc);border-radius:999px;padding:2px 10px;font-weight:700;font-size:13.5px}
.warn{background:#fff7e6;border:1px solid #f0d9a8;color:#6b4a00;border-radius:12px;padding:10px 12px;font-size:14.5px;margin:0}
.note{color:var(--mut);font-size:14px;margin:6px 0}
.cta{position:fixed;right:0;left:0;bottom:0;padding:12px 16px 14px;background:linear-gradient(to top,var(--paper) 70%,transparent)}
.wa{display:flex;align-items:center;justify-content:center;min-height:52px;max-width:520px;margin:0 auto;border-radius:14px;background:var(--wa);color:#fff;text-decoration:none;font:800 17px Cairo,Tahoma,Arial,sans-serif;padding:0 14px;text-align:center}
.wa[aria-disabled=true]{background:#9aa7b3;pointer-events:none}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>${pixelJs}</head><body><div class="wrap">
<div class="top"><b>${esc(brand)}</b>${o.date ? `<span class="cnt">تحديث: ${esc(o.date)}</span>` : ""}</div>
<h1>${esc(title)}</h1><p class="lead">${esc(lead)}</p>
<section class="card" aria-label="بيانات العقار">
<p class="sub" id="tl">نوع العقار</p>
<div class="seg" role="radiogroup" aria-labelledby="tl" id="seg"><button type="button" role="radio" aria-checked="true" data-t="land">أرض</button><button type="button" role="radio" aria-checked="false" data-t="apartment">شقة</button><button type="button" role="radio" aria-checked="false" data-t="villa">فيلا</button></div>
<label>الموقع: الحي<select id="d"><option value="">اختار الحي</option></select></label>
<label id="mw" hidden>المجاورة (اختياري)<select id="m"><option value="">كل الحي</option></select></label>
<label>الموقع بالتفصيل (اختياري)<input id="loc" maxlength="60" autocomplete="off" placeholder="مثلًا: جنب المسجد أو على شارع رئيسي"></label>
<label>المساحة بالمتر<input id="a" inputmode="numeric" autocomplete="off" placeholder="مثلًا 300" maxlength="6"></label>
<div id="lf" style="display:flex;flex-direction:column;gap:14px">
<label>مبني عليها كام متر؟ (اكتب 0 لو فاضية)<input id="b" inputmode="numeric" autocomplete="off" placeholder="مثلًا 120" maxlength="6"></label>
<label>السداد<select id="p"><option value="">اختار</option><option value="paid">خالصة أقساط</option><option value="inst">عليها أقساط</option></select></label>
<label>الرخصة<select id="l"><option value="">اختار</option><option value="yes">فيها رخصة</option><option value="no">مفيش رخصة</option></select></label>
</div>
</section>
<section class="card out" id="out" hidden aria-live="polite"><small>المدى التقريبي لسعر عقارك</small><div class="rng" id="rng"></div><div class="ppm" id="ppm"></div><div class="avg" id="avg"></div><p class="basis" id="basis"></p><p class="warn" id="wide" hidden>عدد العروض هنا قليل، فالمدى واسع. كلّمنا ونديك تقدير أدق.</p><p class="warn" id="lnote" hidden>الأقساط المتبقية والرخصة والمباني على الأرض بتغيّر السعر. ابعتلنا التفاصيل على واتساب ونحلّل حالة أرضك ونرد عليك.</p></section>
<section class="card" id="nod" hidden><p style="margin:0" id="nodt"></p></section>
<p class="note">ده تقدير استرشادي من أسعار عقارات معروضة للبيع، مش سعر بيع نهائي. السعر الفعلي بيتحدد بالمعاينة: الموقع والشارع والناصية والأوراق. مفيش التزام بالبيع أو الشراء.</p>
</div><div class="cta"><a class="wa" id="wa" href="#" target="_blank" rel="noopener" aria-disabled="true">💬 ابعتلنا التفاصيل وخد تحليل أدق</a></div>
<script>var DATA=${jsonSafe(data)};
(function(){var CH=((location.search.match(/[?&]c=([A-Z])(?![A-Za-z0-9])/)||[])[1])||'H',R=DATA.rows,C=DATA.cats,TYPE='land',TL={land:'أرض',apartment:'شقة',villa:'فيلا'},TP={land:'أراضي',apartment:'شقق',villa:'فلل'},OWN={land:'أرضي',apartment:'شقتي',villa:'فيلتي'};
function $(i){return document.getElementById(i)}
var d=$('d'),m=$('m'),mw=$('mw'),a=$('a'),b=$('b'),pay=$('p'),lic=$('l'),loc=$('loc'),lf=$('lf'),out=$('out'),nod=$('nod'),wa=$('wa'),seg=$('seg');
function en(n){return String(Math.round(n)).replace(/\\B(?=(\\d{3})+(?!\\d))/g,',')}
function money(n){if(n>=1e6){var r=n>=5e6?Math.round(n/1e5)/10:Math.round(n/5e4)/20;return String(r).replace(/\\.0+$/,'')+' مليون'}return en(Math.round(n/1e4)*1e4/1000)+' ألف'}
function digits(s){return String(s).replace(/[٠-٩]/g,function(c){return '٠١٢٣٤٥٦٧٨٩'.indexOf(c)})}
function rowsOf(t){return t==='land'?R:(C[t]||[])}
function find(t,name){var L=rowsOf(t);for(var i=0;i<L.length;i++)if(L[i].d===name)return L[i];return null}
var names=[];[R,C.apartment,C.villa].forEach(function(L){(L||[]).forEach(function(r){if(names.indexOf(r.d)<0)names.push(r.d)})});
for(var i=0;i<names.length;i++){var o=document.createElement('option');o.value=i;o.textContent=names[i];d.appendChild(o)}
var other=document.createElement('option');other.value='x';other.textContent='حي تاني';d.appendChild(other);
function num(el,max){var v=parseInt(digits(el.value).replace(/\\D/g,''),10);return v>=0&&v<max?v:-1}
function area(){var v=num(a,100000);return v>0?v:0}
function dname(){var di=d.value;return di===''?'':di==='x'?'حي تاني':names[+di]}
function sel(){var di=d.value;if(di===''||di==='x')return null;var name=names[+di],r=find(TYPE,name);if(!r)return {none:true,name:name};var mi=m.value;if(TYPE==='land'&&mi!==''&&r.mugs&&r.mugs[+mi])return {r:r,s:r.mugs[+mi],place:r.d+' — '+r.mugs[+mi].name};return {r:r,s:r,place:r.d}}
function clean(t){return String(t).replace(/[—\\n\\r]+/g,' ').replace(/\\s+/g,' ').replace(/^\\s+|\\s+$/g,'').slice(0,60)}
function link(){var name=dname(),ar=area(),L=['عايز أعرف سعر '+OWN[TYPE]+' — '+(name||'حي آخر')+' — '+(ar||'؟')+' م²'],lc=clean(loc.value);
if(lc)L.push('الموقع: '+lc);
if(TYPE==='land'){var bv=num(b,100000);if(String(b.value).replace(/\\s/g,'')!==''&&bv>=0)L.push('مبني: '+(bv>0?bv+' م²':'فاضية'));if(pay.value)L.push('السداد: '+(pay.value==='paid'?'خالصة':'عليها أقساط'));if(lic.value)L.push('الرخصة: '+(lic.value==='yes'?'فيه':'مفيش'))}
L.push('كود '+DATA.code+'-'+CH);
if(!DATA.tel){wa.setAttribute('aria-disabled','true');wa.removeAttribute('href');return}
wa.removeAttribute('aria-disabled');wa.href='https://wa.me/'+DATA.tel+'?text='+encodeURIComponent(L.join('\\n'))}
function upd(){var di=d.value;mw.hidden=true;lf.style.display=TYPE==='land'?'flex':'none';
var S=sel();if(TYPE==='land'&&S&&S.r&&S.r.mugs&&S.r.mugs.length){var keep=m.value;m.innerHTML='<option value="">كل الحي</option>';for(var j=0;j<S.r.mugs.length;j++){var o=document.createElement('option');o.value=j;o.textContent=S.r.mugs[j].name;m.appendChild(o)}m.value=keep&&S.r.mugs[+keep]?keep:'';mw.hidden=false;S=sel()}
var ar=area();out.hidden=true;nod.hidden=true;
if(di==='x'){$('nodt').textContent='الحي ده لسه مفيش عروض كفاية نقدّر منها. ابعتلنا بيانات عقارك على واتساب ونراجعها معاك.';nod.hidden=false}
else if(S&&S.none){$('nodt').textContent='لسه مفيش عروض '+TP[TYPE]+' كفاية في '+S.name+' نقدّر منها. ابعتلنا بيانات عقارك على واتساب ونحلّله ونرد عليك.';nod.hidden=false}
else if(S&&ar){var lo=S.s.lo*ar,hi=S.s.hi*ar;$('rng').innerHTML='<span>'+money(lo)+'</span><em>إلى</em><span>'+money(hi)+'</span> <small>جنيه</small>';$('ppm').textContent='سعر المتر المعروض: '+en(S.s.lo)+' – '+en(S.s.hi)+' جنيه';$('avg').textContent='متوسط سعر المتر: '+en(S.s.med)+' جنيه';
var n=S.s.n,nt=n===1?'عرض واحد منشور':n===2?'عرضين منشورين':n<=10?n+' عروض منشورة':n+' عرض منشور';$('basis').innerHTML='مبني على '+nt+' ('+TP[TYPE]+') في '+S.place+(DATA.date?' · تحديث '+DATA.date:'')+(TYPE==='land'&&S.s===S.r&&S.r.trend!=null&&Math.abs(S.r.trend)>=3?' <span class="chip">سعر المتر آخر 30 يوم '+(S.r.trend>0?'+':'')+S.r.trend+'%</span>':'');
$('wide').hidden=!S.s.wide;$('lnote').hidden=TYPE!=='land';out.hidden=false}
link()}
seg.addEventListener('click',function(e){var t=e.target&&e.target.getAttribute&&e.target.getAttribute('data-t');if(!t)return;TYPE=t;var bs=seg.getElementsByTagName('button');for(var k=0;k<bs.length;k++)bs[k].setAttribute('aria-checked',bs[k].getAttribute('data-t')===t?'true':'false');m.value='';upd()});
d.addEventListener('change',function(){m.value='';upd()});[m,pay,lic].forEach(function(x){x.addEventListener('change',upd)});[a,b,loc].forEach(function(x){x.addEventListener('input',upd)});
wa.addEventListener('click',function(){try{if(window.fbq)fbq('track','Lead')}catch(e){}});upd()})();</script></body></html>`;
  };
  if (typeof module !== "undefined" && module.exports) module.exports = E;
  root.EVP = E;
})(typeof globalThis !== "undefined" ? globalThis : this);
