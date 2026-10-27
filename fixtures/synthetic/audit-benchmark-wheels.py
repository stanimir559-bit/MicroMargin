"""Read-only metadata/hash/advisory review of wheel files before installation."""
from pathlib import Path
import email
import hashlib
import json
import urllib.request
import zipfile

root = Path(__file__).resolve().parent
manifest = []
for path in sorted((root / '.benchmark-wheels').glob('*.whl')):
    with zipfile.ZipFile(path) as wheel:
        metadata = email.message_from_bytes(wheel.read(next(name for name in wheel.namelist() if name.endswith('/METADATA'))))
        assert not any(name.endswith('.pth') for name in wheel.namelist()), 'Unexpected .pth execution hook'
        name, version = metadata['Name'], metadata['Version']
        with urllib.request.urlopen(f'https://pypi.org/pypi/{name}/{version}/json', timeout=15) as response:
            published = json.load(response)
        expected = next(item['digests']['sha256'] for item in published['urls'] if item['filename'] == path.name)
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        assert expected == digest, 'Wheel hash differs from PyPI metadata'
        manifest.append({'name': name, 'version': version, 'file': path.name, 'sha256': digest, 'license': metadata['License-Expression'] or metadata['License'], 'requires': metadata.get_all('Requires-Dist', []), 'pthHooks': False})
query = {'queries': [{'package': {'name': item['name'], 'ecosystem': 'PyPI'}, 'version': item['version']} for item in manifest]}
request = urllib.request.Request('https://api.osv.dev/v1/querybatch', data=json.dumps(query).encode(), headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(request, timeout=25) as response:
        result = json.load(response)
    for item, advisory in zip(manifest, result['results']):
        item['osvAdvisoryIds'] = [vuln['id'] for vuln in advisory.get('vulns', [])]
    scan = 'completed'
except Exception as error:
    scan = f'unavailable: {error}'
output = {'accessDate': '2026-10-27', 'pypiHashMatch': True, 'osv': scan, 'wheels': manifest}
(root / 'benchmark-dependency-audit.json').write_text(json.dumps(output, indent=2), encoding='utf-8')
print(json.dumps({'osv': scan, 'wheels': [{'name': item['name'], 'version': item['version'], 'advisories': item.get('osvAdvisoryIds')} for item in manifest]}, indent=2))
