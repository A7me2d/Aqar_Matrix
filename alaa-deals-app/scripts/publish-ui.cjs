// Called explicitly by build:ui. Ordinary sync never invokes Angular compilation.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const workspace = path.resolve(__dirname,'../..');
const frontend = path.join(workspace,'frontend');
const cli = path.join(frontend,'node_modules/@angular/cli/bin/ng.js');
if(!fs.existsSync(cli)) throw Error('Install frontend dependencies first: npm --prefix ../frontend install');
execFileSync(process.execPath,[cli,'build'],{cwd:frontend,stdio:'inherit'});
const built = path.join(frontend,'dist/aqar-matrix/browser');
if(!fs.existsSync(path.join(built,'index.html'))) throw Error('Angular browser output is missing.');
const engine = path.resolve(workspace,'re-hunter');
const destination = path.resolve(engine,'angular');
// Verify the exact generated directory before any recursive replacement.
if(path.dirname(destination)!==engine || path.basename(destination)!=='angular') throw Error('Invalid UI output directory.');
fs.rmSync(destination,{recursive:true,force:true});
fs.cpSync(built,destination,{recursive:true});
execFileSync(process.execPath,[path.join(__dirname,'sync-engine.js')],{stdio:'inherit'});
console.log('Angular UI published: http://localhost:8787/d/angular/index.html');
