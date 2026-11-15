// Explicit frontend compilation. npm run sync deliberately does not call this.
const fs = require('node:fs/promises');
const { watch } = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');
if (typeof ts.transpileModule !== 'function') throw Error('build:posts requires the TypeScript 6 compiler API. Run npm ci in alaa-deals-app.');
const sass = require('sass');
const postcss = require('postcss');
const tailwind = require('tailwindcss');
const root = path.resolve(__dirname,'../../re-hunter/posts');
const order = ['types','model','screen','cards','render','comments','actions','export','controller','index'];
async function compilePosts() {
  const html = await fs.readFile(path.join(root,'html/posts.html'),'utf8');
  const sources = await Promise.all(order.map(name=>fs.readFile(path.join(root,'ts',name+'.ts'),'utf8')));
  const js = ts.transpileModule(sources.join('\n'), {
    compilerOptions: { target:ts.ScriptTarget.ES2022, module:ts.ModuleKind.None }, reportDiagnostics:true,
  });
  const errors = (js.diagnostics || []).filter(d=>d.category===ts.DiagnosticCategory.Error);
  if(errors.length) throw Error(errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')).join('\n'));
  const css = sass.compile(path.join(root,'scss/posts.scss'), { style:'expanded' });
  const processed = await postcss([tailwind(require(path.join(root,'tailwind.config.cjs')))]).process(css.css, { from:path.join(root,'scss/posts.scss'), map:false });
  await fs.mkdir(path.join(root,'runtime'),{recursive:true});
  await Promise.all([
    fs.writeFile(path.join(root,'runtime/view.js'),'// Generated from posts/html/posts.html.\n'+'document.getElementById("v-posts").outerHTML = '+JSON.stringify(html)+';\n'),
    fs.writeFile(path.join(root,'runtime/posts.js'),'// Generated from posts/ts. Do not edit.\n'+js.outputText),
    fs.writeFile(path.join(root,'runtime/posts.css'),'/* Generated from posts/scss and Tailwind. */\n'+processed.css),
  ]);
  if(process.argv.includes('--sync')) execFileSync(process.execPath,[path.join(__dirname,'sync-engine.js')],{stdio:'inherit'});
  console.log('Posts HTML, SCSS/Tailwind and TypeScript compiled.');
}
async function main() {
  await compilePosts();
  if(!process.argv.includes('--watch')) return;
  let timer, running=false, pending=false;
  async function rebuild() {
    if(running) { pending=true; return; }
    running=true;
    try { await compilePosts(); } catch(error) { console.error(error); }
    finally { running=false; if(pending) { pending=false; rebuild(); } }
  }
  watch(root,{recursive:true},(_event,file)=>{
    if(!file || (!/^(html|scss|ts)[/\\]/.test(file) && file!=='tailwind.config.cjs')) return;
    if(file==='tailwind.config.cjs') delete require.cache[require.resolve(path.join(root,file))];
    clearTimeout(timer); timer=setTimeout(rebuild,150);
  });
  console.log('Watching posts/html, posts/scss and posts/ts.');
}
main().catch(error=>{ console.error(error); process.exitCode=1; });
