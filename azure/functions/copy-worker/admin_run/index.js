const cp = require('child_process');
const path = require('path');

module.exports = async function (context, req) {
  try {
    const scriptPath = path.join(__dirname, '..', 'manual_full_scan.js');
    const node = process.execPath || 'node';

    context.log(`[admin-run] spawning ${node} ${scriptPath}`);
    const child = cp.spawn(node, [scriptPath], {
      cwd: path.join(__dirname, '..'),
      detached: true,
      stdio: 'ignore'
    });
    // detach so the child can continue if parent exits
    child.unref();

    context.log(`[admin-run] started manual scan pid=${child.pid}`);
    context.res = {
      status: 202,
      body: { started: true, pid: child.pid }
    };
  } catch (err) {
    context.log.error('[admin-run] error starting scan', err && err.message ? err.message : err);
    context.res = {
      status: 500,
      body: { error: err && err.message ? err.message : String(err) }
    };
  }
};
