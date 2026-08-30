const fs = require('fs');
const path = require('path');

const files = [];
function walk(dir) {
  try {
    for (const f of fs.readdirSync(dir, { withFileTypes: true }).filter(e => !['node_modules','dist','build','coverage','.git','.next'].includes(e.name))) {
      const p = dir + '/' + f.name;
      if (f.isDirectory()) walk(p);
      else if (p.endsWith('.ts') || p.endsWith('.tsx')) files.push(p);
    }
  } catch (e) {}
}
walk('apps/backend/src');
walk('apps/frontend/src');

function maskLiteral(src) {
  const masks = [];
  const addMask = (m) => { masks.push(m); return `___MASK_${masks.length - 1}___`; };
  const literalRx = /(?:`(?:[^`\\$]|\\.|\$(?!\{)|\$\{(?:[^{}]|\{[^}]*\})*\})*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\/\/[^\n]*|\/\*[\s\S]*?\*\/|\/(?![*/])(?:[^[\]/\\]|\[\^?[^\]]*\]|\\\/|\\[^/\n]|\/\/[^\n]*)*(?:\/[gimsuy]*)(?=[;,)=\n]|$))/g;
  const masked = src.replace(literalRx, addMask);
  const unmask = (s) => {
    let prev = s, curr = s, safety = 0;
    do { prev = curr; curr = prev.replace(/___MASK_(\d+)___/g, (_, i) => masks[parseInt(i,10)]); safety++; } while (curr !== prev && safety < 10);
    return curr;
  };
  return { masked, masks, unmask };
}

// Test on just the first 20 files
let totalTime = 0;
for (let i = 0; i < Math.min(20, files.length); i++) {
  const src = fs.readFileSync(files[i], 'utf8');
  const start = Date.now();
  const { masked, unmask } = maskLiteral(src);
  const maskedTime = Date.now() - start;
  
  // Quick snake replacement on masked
  const ids = new Set();
  const rx = /\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g;
  let m;
  while ((m = rx.exec(masked)) !== null) ids.add(m[0]);
  
  const unmasked = unmask(masked);
  const unmaskTime = Date.now() - start - maskedTime;
  const identical = unmasked === src;
  
  console.log(`${i+1}. ${path.relative(process.cwd(), files[i]).split(path.sep).join('/')} (${src.length}b): mask=${maskedTime}ms, unmask=${unmaskTime}ms, masks=${(masked.match(/___MASK_\d+___/g)||[]).length}, ok=${identical}`);
  totalTime += maskedTime + unmaskTime;
}
console.log(`\nAverage per file: ${(totalTime/20).toFixed(1)}ms`);
console.log(`Estimated for ${files.length} files: ${((totalTime/20)*files.length/1000).toFixed(1)}s`);
