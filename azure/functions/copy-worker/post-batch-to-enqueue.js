const fs = require('fs');
const fetch = require('node-fetch');

async function main() {
  const key = process.argv[2];
  if (!key) {
    console.error('Usage: node post-batch-to-enqueue.js <function_key>');
    process.exit(1);
  }
  const url = `https://team-recordings-copier.azurewebsites.net/api/enqueue?code=${key}`;
  const body = fs.readFileSync('batch.json', 'utf8');
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    const txt = await res.text();
    console.log('status', res.status);
    console.log('body', txt);
    if (!res.ok) process.exit(2);
  } catch (e) {
    console.error('request error', e && e.message ? e.message : e);
    process.exit(1);
  }
}

main();
