try {
  const f = require('./index.js');
  console.log(typeof f);
} catch (e) {
  console.error('import error:', e && e.message ? e.message : e);
  process.exitCode = 2;
}
