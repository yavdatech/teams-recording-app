const fs = require('fs');
const p = 'azure/functions/copy-worker/check_target_result.txt';
try {
  let s = fs.readFileSync(p,'utf8');
  // file contains a leading status line like "List status 200" followed by JSON
  const firstBrace = s.indexOf('{');
  if (firstBrace > 0) s = s.slice(firstBrace);
  const j = JSON.parse(s);
  const items = j.value || [];
  const count = items.length;
  const sum = items.reduce((a,b)=>a + (b.size||0), 0);
  const avg = count ? Math.round(sum / count) : 0;
  console.log(`COUNT:${count}`);
  console.log(`SUM:${sum}`);
  console.log(`AVG:${avg}`);
} catch (e) {
  console.error('ERROR', e && e.message);
  process.exit(1);
}
