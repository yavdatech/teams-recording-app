import os
import zipfile
import pathlib

root = pathlib.Path(r'C:\Users\AmitMohanty\source\teams-record-meetings-app\azure\functions\copy-worker')
out = pathlib.Path(r'C:\Users\AmitMohanty\source\teams-record-meetings-app\artifacts\copy-worker-clean.zip')
exclude_dirs = {'logs_extracted', 'artifacts', 'obj'}
exclude_names = {'local.settings.json', 'local.settings.json.sample', 'tmp_appsettings.json', 'settings_array.json', 'keyout.json', 'listing.txt', 'copy-worker-deploy.zip', 'deploy-package.zip'}
if out.exists():
    out.unlink()
count = 0
with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_DEFLATED) as z:
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in exclude_dirs]
        for fn in filenames:
            if fn in exclude_names or fn.endswith('.zip'):
                continue
            p = pathlib.Path(dirpath) / fn
            rel = p.relative_to(root).as_posix()
            z.write(p, rel)
            count += 1
print('created', out, 'files=', count, 'size=', out.stat().st_size)
