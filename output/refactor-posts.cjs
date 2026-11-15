// One-time source move. This does not invoke a compiler, tests or a build.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../re-hunter');
const read = p => fs.readFileSync(path.join(root,p),'utf8').replace(/\r\n/g,'\n');
const write = (p,s) => { fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true}); fs.writeFileSync(path.join(root,p),s); };
let dashboard = read('dashboard.js'), html = read('dashboard.html');
const take = (start,end) => { const a=dashboard.indexOf(start),b=dashboard.indexOf(end,a); if(a<0||b<0) throw Error('Missing move boundary: '+start); const s=dashboard.slice(a,b); dashboard=dashboard.slice(0,a)+dashboard.slice(b); return s; };
const sources = {};
sources.model = take('const PURS = ', 'const tabsHtml = ');
sources.model = take('const BROKERISH = ', '// 🧪 صافي / مشتبه') + sources.model;
sources.render = take('function renderPosts() {','function uniqBy(');
sources.comments = take('function renderPostTool() {','// ================= 📍 إعدادات المنطقة');
sources.comments += take('async function startPostJob(url)', '$("postGo").addEventListener');
sources.cards = read('posts/cards.js');
let screen = read('posts/screen.js');
const eventStart = screen.indexOf('document.addEventListener("click"');
const screenEvents = screen.slice(eventStart);
sources.screen = screen.slice(0,eventStart);
let controls = take('$("q").addEventListener', '$("lMore").addEventListener');
for (const id of ['onlyBS','postDays','filtersBtn','postGo','postTool']) {
  const prefix='$('+JSON.stringify(id)+').addEventListener';
  const a=dashboard.indexOf(prefix); if(a<0) throw Error('Missing control '+id);
  const b=dashboard.indexOf('\n',a);
  controls+=dashboard.slice(a,b)+'\n'; dashboard=dashboard.slice(0,a)+dashboard.slice(b+1);
}
const exportStart = dashboard.indexOf('$("exportBtn").addEventListener');
const exportEnd = dashboard.indexOf('\n});',exportStart)+4;
const exportCode=dashboard.slice(exportStart,exportEnd);
dashboard=dashboard.slice(0,exportStart)+dashboard.slice(exportEnd);
sources.export=exportCode.replace('$("exportBtn").addEventListener("click", () => {','function exportPosts() {').replace(/\}\);$/, '}');
const apStart=dashboard.indexOf('  const ap = t.closest("[data-apkey]");');
const apEnd=dashboard.indexOf('  if (t.closest("#areaPill"))',apStart);
const apActions=dashboard.slice(apStart,apEnd); dashboard=dashboard.slice(0,apStart)+dashboard.slice(apEnd);
const actionStart=dashboard.indexOf('    const id = act.closest(".card").dataset.id;');
const actionEnd=dashboard.indexOf('\n  }\n});',actionStart);
sources.actions='async function handlePostCardAction(act) {\n'+dashboard.slice(actionStart,actionEnd)+'\n}\n';
dashboard=dashboard.slice(0,actionStart)+'    return handlePostCardAction(act);'+dashboard.slice(actionEnd);
sources.controller=`// Page-only events bind after dashboard state has initialized.\nlet postsControlsReady = false;\nfunction initPostsControls() {\n  if (postsControlsReady) return;\n  postsControlsReady = true;\n${controls}\n  $("exportBtn").addEventListener("click", exportPosts);\n${screenEvents}\n  $("v-posts").addEventListener("click", (e) => {\n    const t = e.target;\n${apActions}\n  });\n}\n`;
// Shared action dispatch is retained for cards reused outside this page.
dashboard=dashboard.replace('initMatchControls();','initPostsControls();\ninitMatchControls();');
dashboard=dashboard.replace('if (state.view === "posts") { renderPosts(); renderPostTool(); }','if (state.view === "posts") AQMPostsPage.render();');
const a=html.indexOf('<section class="view" id="v-posts">'), b=html.indexOf('</section>',a)+10;
let page=html.slice(a,b);
const utilities={
  'posts-page-header':'tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-5',
  'posts-control-heading':'tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3',
  'posts-search-row':'tw-grid tw-gap-3',
  'posts-filter-row':'tw-flex tw-flex-wrap tw-items-start tw-gap-3',
  'posts-results-heading':'tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-4',
  'posts-active-filters':'tw-flex tw-flex-wrap tw-gap-2',
  'posts-import-form':'tw-flex tw-flex-wrap tw-items-end tw-gap-3'
};
for(const [key,value] of Object.entries(utilities)) page=page.replaceAll('class="'+key+'"','class="'+key+' '+value+'"');
write('posts/html/posts.html',page+'\n');
html=html.slice(0,a)+'<section class="view" id="v-posts" aria-label="الطلبات والعروض"></section>'+html.slice(b);
html=html.replace('<link rel="stylesheet" href="posts/cards.css">\n<link rel="stylesheet" href="posts/screen.css">','<link rel="stylesheet" href="posts/runtime/posts.css">');
html=html.replace('<script src="posts/cards.js"></script>\n<script src="posts/screen.js"></script>','<script src="posts/runtime/view.js"></script>\n<script src="posts/runtime/posts.js"></script>');
const cssCards=read('posts/cards.css'), cssScreen=read('posts/screen.css');
let cssRuntime=cssCards+'\n'+cssScreen;
// Runtime CSS remains a compatibility snapshot; Tailwind's compiler is not run.
const utilitiesCss='.tw-flex{display:flex}.tw-flex-wrap{flex-wrap:wrap}.tw-grid{display:grid}.tw-items-center{align-items:center}.tw-items-start{align-items:flex-start}.tw-items-end{align-items:flex-end}.tw-justify-between{justify-content:space-between}.tw-gap-2{gap:.5rem}.tw-gap-3{gap:.75rem}.tw-gap-4{gap:1rem}.tw-gap-5{gap:1.25rem}';
cssRuntime+='\n/* Initial scoped utility snapshot, replaced by build:posts. */\n'+utilitiesCss.split('}').filter(Boolean).map(rule=>'#v-posts '+rule+'}').join('\n');
write('posts/runtime/posts.css',cssRuntime);
function scss(s) {
  // Layout and typography use Tailwind; retain theme-cascade overrides as SCSS.
  const map=[['display:flex; flex-wrap:wrap;','@apply tw-flex tw-flex-wrap;'],['display:flex; flex-direction:column;','@apply tw-flex tw-flex-col;'],['display:flex;','@apply tw-flex;'],['display:grid;','@apply tw-grid;'],['align-items:center;','@apply tw-items-center;'],['justify-content:space-between;','@apply tw-justify-between;'],['flex-wrap:wrap;','@apply tw-flex-wrap;'],['margin:0;','@apply tw-m-0;'],['min-width:0;','@apply tw-min-w-0;'],['width:100%;','@apply tw-w-full;'],['font-weight:600;','@apply tw-font-semibold;'],['font-size:12px;','@apply tw-text-xs;']];
  for(const [from,to] of map) s=s.replaceAll(from,to);
  return s;
}
write('posts/scss/_cards.scss',scss(cssCards)); write('posts/scss/_screen.scss',scss(cssScreen));
write('posts/scss/posts.scss','// Compile Sass first, then PostCSS/Tailwind. Preflight is disabled.\n@import "cards";\n@import "screen";\n@tailwind utilities;\n');
const order=['model','screen','cards','render','comments','actions','export','controller'];
const api='\nwindow.AQMPostsPage = { render() { renderPosts(); renderPostTool(); }, init: initPostsControls, card: postCard };\n';
write('posts/runtime/posts.js','// Runtime compatibility snapshot. Edit posts/ts sources; build:posts regenerates this file.\n'+order.map(k=>sources[k]).join('\n')+api);
write('posts/runtime/view.js','// Runtime template snapshot. Canonical markup: posts/html/posts.html\n'+`document.getElementById("v-posts").outerHTML = ${JSON.stringify(page)};\n`);
for(const name of order) {
  let s=sources[name];
  if(name==='cards') s=s.replace('function postCard(p, opts, { more, ms, open, cl, dupOpen })','function postCard(p: PostRecord, opts: PostCardOptions, { more, ms, open, cl, dupOpen }: PostCardContext): string');
  if(name==='render') s=s.replace('function renderPosts()', 'function renderPosts(): void');
  if(name==='model') s=s.replace('function filtered(ign = {})','function filtered(ign: PostsFilterIgnores = {}): PostRecord[]');
  if(name==='screen') s=s.replace('function togglePostsFilters(force)', 'function togglePostsFilters(force?: boolean): void').replace('function resetPostsSearch(key)', 'function resetPostsSearch(key?: string): void').replace('function updatePostsScreen(list)', 'function updatePostsScreen(list: PostRecord[]): void');
  if(name==='comments') s=s.replace('async function startPostJob(url)', 'async function startPostJob(url: string)');
  write('posts/ts/'+name+'.ts',s);
}
write('posts/ts/index.ts','// Public boundary used by the dashboard shell.\n'+api);
write('dashboard.js',dashboard); write('dashboard.html',html);
for(const f of ['cards.js','screen.js','cards.css','screen.css']) fs.unlinkSync(path.join(root,'posts',f));
