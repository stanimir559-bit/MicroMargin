# Third-party notices

MicroMargin uses exact package versions recorded in package-lock.json. The installed dependency inventory, integrity presence and platform lifecycle-script inspection are in artifacts/dependency-review.json. No GPL/AGPL package is in that inventory. Development tooling includes unmodified MPL-2.0 Lightning CSS; its file-level license is not a grant to remove upstream notices.

## shadcn/ui Button source

Adapted from https://ui.shadcn.com/r/styles/new-york/button.json on2026-10-27. Changes replace Tailwind class strings with the project's plain CSS and reduce unused variants. The upstream React forwardRef, Radix Slot and CVA composition is retained.

MIT License

Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Installed modules

React/React DOM and their scheduler: MIT (Meta Platforms). Radix Slot/compose-refs: MIT (WorkOS). decimal.js10.6.0: MIT (Michael Mclaughlin). class-variance-authority: Apache-2.0. clsx: MIT. Lucide React: ISC. PDF.js/pdfjs-dist6.4.299: Apache-2.0 (Mozilla Foundation and contributors). PDF.js package contains additional bundled notices. See the complete installed production LICENSE/NOTICE texts in public/third-party-licenses.txt, also copied into dist by Vite. Upstream license files remain in node_modules after installation.

No whole third-party application was copied. invoice2data and its isolated benchmark dependencies are evaluation-only; they are not imported or shipped by the application.
