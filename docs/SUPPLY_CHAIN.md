# Dependency review — 2026-10-27

Runtime Node24.18.0/npm11.11.0 observed. Package registry version/license/modified-time/lifecycle metadata was inspected before installation. Direct dependencies use exact versions; lockfile contains integrity values for all182 entries. Installation used `npm install --ignore-scripts`; .npmrc retains `ignore-scripts=true`. No downloaded shell installation script, whole application clone or shadcn CLI was executed.

Current runtime pins: react/react-dom19.3.1, decimal.js10.6.0, pdfjs-dist6.4.299, @radix-ui/react-slot1.5.0, class-variance-authority0.7.1, clsx2.1.1, lucide-react1.62.0. Development tool pins are in package.json. Latest TypeScript7 was rejected by the linter peer constraint;6.0.3 is the newest compatible stable6 release observed. No peer-resolution force flag was used.

`npm audit --json` returned0 reported vulnerabilities (all severities) on this date. The committed artifacts/dependency-review.json records licenses/integrity and installed-platform lifecycle scripts. Observed license set: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, MPL-2.0, BlueOak-1.0.0. No unknown/GPL/AGPL license string was found. No installed-platform preinstall/install/postinstall hook was present in that report; uninstalled optional platforms were not source-audited. Registry metadata and audit are evidence, not a guarantee of provenance or absence of malicious code.

MPL-2.0 packages are Lightning CSS build tooling/native binding, used unmodified. Keep their source/license obligations in scope before redistributing tooling. Runtime notices and copied shadcn MIT license are retained in THIRD_PARTY_NOTICES.md and public/third-party-licenses.txt. Registry package tarballs carry their original licenses. Lockfile-integrity protects repeatability, not the initial trust decision.

PDF.js advisory GHSA-hq66-cqwq-w95j is patched since6.2.108; GHSA-wgrm-67xf-hhpq since4.2.67.6.4.299 is later than both. No viewer scripting manager is constructed, and CSP restricts network/script endpoints. The legacy isEvalSupported option no longer exists in6.4 installed source/types; it was deliberately removed from application config instead of suppressing type errors. Source URLs and maintenance review for all seed candidates are in RESEARCH_AUDIT.md.

invoice2data benchmark dependencies were isolated in ignored workspace directories. Wheel metadata, hashes and OSV results are separately recorded under fixtures/synthetic/benchmark-dependency-audit.json. That experiment does not add a Python dependency or sidecar to core setup. Re-run audits before a real distribution; no public deployment or external infrastructure was created.

## 2026-10-27 deployment tooling update

Wrangler4.153.0 was reviewed from official registry metadata (MIT OR Apache-2.0) and installed exactly with --ignore-scripts. Updated inventory:268 lockfile entries; npm audit reports0 known vulnerabilities. esbuild/workerd install hooks exist but were not executed; the reviewed registry native binaries support the tested local runtime.

Wrangler transitively adds LGPL-3.0-or-later libvips/sharp native/WASM components as development tooling. They are used unmodified and are not imported into the client application or deployed Worker handler. Their original licenses remain with installed packages; review redistribution obligations before distributing the tooling itself. The runtime app dependency set is unchanged. No GPL/AGPL application source was imported. The earlier inventory above describes the pre-Wrangler checkpoint.

Wrangler telemetry is disabled with send_metrics:false and WRANGLER_SEND_METRICS=false. Worker observability is disabled; no application analytics service was introduced. Exact current license entries and integrity are in artifacts/dependency-review.json. No real password or session signing key is in source or generated frontend assets.
