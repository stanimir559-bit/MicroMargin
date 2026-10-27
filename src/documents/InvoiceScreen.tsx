import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Decimal from 'decimal.js';
import { FileText, ShieldCheck, Upload, Check } from 'lucide-react';
import { getDocument, GlobalWorkerOptions, type PDFDocumentLoadingTask, type RenderTask } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Button } from '../components/ui/button';
import type { Ingredient, PricingProfile, Recipe } from '../domain';
import { MAX_TEXT_CHARS, PDF_BUDGET_MS, previewScale, reviewProposal, validatePageCount, validatePdfMagic, validatePdfMetadata } from './policy';

GlobalWorkerOptions.workerSrc = workerUrl;

interface Props {
  ingredients: Ingredient[];
  recipes: Recipe[];
  profile: PricingProfile;
  locale: 'bg' | 'en';
  onConfirmPrice: (ingredientId: string, price: string) => boolean;
}

export default function InvoiceScreen({ ingredients, recipes, profile, locale, onConfirmPrice }: Props) {
  const bg = locale === 'bg';
  const t = (bulgarian: string, english: string) => bg ? bulgarian : english;
  const [syntheticOnly, setSyntheticOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [documentKey, setDocumentKey] = useState('');
  const [ingredientId, setIngredientId] = useState('');
  const [rawPrice, setRawPrice] = useState('');
  const [approval, setApproval] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const generation = useRef(0);
  const loading = useRef<PDFDocumentLoadingTask | null>(null);
  const rendering = useRef<RenderTask | null>(null);
  const abort = useRef<AbortController | null>(null);

  const clearResources = () => {
    abort.current?.abort(); abort.current = null;
    rendering.current?.cancel(); rendering.current = null;
    if (loading.current) { void loading.current.destroy().catch(() => undefined); loading.current = null; }
  };
  useEffect(() => () => { generation.current += 1; clearResources(); }, []);

  const clearDocument = () => {
    generation.current += 1; clearResources();
    setText(''); setFileName(''); setPageCount(0); setDocumentKey(''); setApproval(''); setBusy(false); setConfirmed(false);
    const context = canvas.current?.getContext('2d');
    if (context && canvas.current) context.clearRect(0, 0, canvas.current.width, canvas.current.height);
  };

  async function loadFile(fileProvider: (signal: AbortSignal) => Promise<File>) {
    clearDocument(); setError('');
    if (!syntheticOnly) { setError(t('Потвърдете, че документът е синтетичен.', 'Confirm that the document is synthetic.')); return; }
    setBusy(true);
    const current = generation.current;
    const controller = new AbortController(); abort.current = controller;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const work = async () => {
        const file = await fileProvider(controller.signal);
        validatePdfMetadata(file);
        const data = new Uint8Array(await file.arrayBuffer());
        validatePdfMagic(data);
        if (current !== generation.current) throw new Error('Cancelled');
        // PDF.js 6.4 removed the legacy isEvalSupported option. Installed API and
        // worker contain no reference to it; the old eval path is patched out.
        // No viewer, annotation layer or scripting manager is instantiated.
        const task = getDocument({
          data, enableXfa: false, disableFontFace: true,
          useSystemFonts: false, useWorkerFetch: false, disableAutoFetch: true,
          disableRange: true, disableStream: true, maxImageSize: 2_000_000,
          canvasMaxAreaInBytes: 8_000_000, stopAtErrors: true, verbosity: 0,
        });
        loading.current = task;
        const pdf = await task.promise;
        validatePageCount(pdf.numPages);
        let extracted = '';
        for (let index = 1; index <= pdf.numPages; index += 1) {
          if (current !== generation.current) throw new Error('Cancelled');
          const page = await pdf.getPage(index);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => 'str' in item ? item.str : '').join(' ');
          extracted += `${t('Страница', 'Page')} ${index}\n${pageText}\n\n`;
          if (extracted.length > MAX_TEXT_CHARS) throw new Error('Document text exceeds the 100,000 character budget.');
          if (index === 1) {
            const target = canvas.current;
            if (!target) throw new Error('Preview canvas is unavailable.');
            const base = page.getViewport({ scale: 1 });
            const viewport = page.getViewport({ scale: previewScale(base.width, base.height) });
            target.width = Math.max(1, Math.floor(viewport.width)); target.height = Math.max(1, Math.floor(viewport.height));
            const context = target.getContext('2d');
            if (!context) throw new Error('Canvas is unavailable.');
            const render = page.render({ canvas: target, canvasContext: context, viewport });
            rendering.current = render;
            await render.promise;
            rendering.current = null;
          }
          page.cleanup();
        }
        if (current !== generation.current) return;
        setText(extracted); setFileName(file.name); setPageCount(pdf.numPages);
        setDocumentKey(`${current}:${file.name}:${file.size}:${file.lastModified}`);
        await task.destroy(); loading.current = null;
      };
      await Promise.race([work(), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(t('Документът надхвърли 15 секунди. Опитайте по-малък PDF.', 'Document exceeded 15 seconds. Try a smaller PDF.'))), PDF_BUDGET_MS); })]);
    } catch (cause) {
      if (current === generation.current) {
        clearDocument();
        setError(cause instanceof Error ? cause.message : t('PDF не може да се прочете.', 'Unable to read PDF.'));
      }
    } finally {
      if (timer) clearTimeout(timer);
      if (current === generation.current) setBusy(false);
    }
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (file) void loadFile(async () => file);
  }

  async function sample(signal: AbortSignal) {
    const response = await fetch('/synthetic-invoice.pdf', { signal, credentials: 'same-origin', cache: 'no-store' });
    if (!response.ok) throw new Error(t('Демо файлът липсва.', 'Demo fixture is unavailable.'));
    return new File([await response.arrayBuffer()], 'synthetic-invoice.pdf', { type: 'application/pdf', lastModified: 0 });
  }

  let proposal: ReturnType<typeof reviewProposal> | null = null;
  let proposalError = '';
  if (documentKey && ingredientId && rawPrice) {
    try { proposal = reviewProposal(documentKey, ingredientId, rawPrice, recipes, ingredients, profile); }
    catch (cause) { proposalError = cause instanceof Error ? cause.message : String(cause); }
  }
  const format = (value: string) => `${new Decimal(value).toFixed(2).replace('.', bg ? ',' : '.')} €`;
  const name = (value: string) => { const parts = value.split(' / '); return bg ? parts[0] : parts[1] ?? parts[0]; };

  return <>
    <div className="page-heading"><div><div className="eyebrow">{t('ПЪРВО ПРОВЕРКА, ПОСЛЕ ПРОМЯНА', 'REVIEW FIRST, UPDATE SECOND')}</div><h1 className="page-title">{t('Фактури с вашето потвърждение', 'Invoices, with your approval')}</h1><p className="muted">{t('Локален PDF преглед. Вие избирате съставката и цената.', 'Local PDF preview. You choose the ingredient and price.')}</p></div><FileText size={28}/></div>
    <section className="card card-body"><div className="quiet-note"><ShieldCheck size={22}/><p>{t('Само синтетични документи в това демо. PDF остава в паметта на браузъра и не се изпраща до AI или сървър. Прегледът не доказва, че файлът е безопасен.', 'Synthetic documents only in this demo. PDF stays in browser memory and is not sent to AI or a server. Preview does not certify file safety.')}</p></div>
      <label className="checkbox-field"><input type="checkbox" checked={syntheticOnly} onChange={event => { setSyntheticOnly(event.target.checked); clearDocument(); setError(''); }}/>{t('Използвам само измислен документ без реални клиентски данни.', 'I am using a fictional document with no real customer data.')}</label>
      <div className="form-actions"><label className="button secondary" style={{ opacity: syntheticOnly ? 1 : 0.6 }}><Upload size={17}/>{t('Избери PDF', 'Choose PDF')}<input aria-label={t('Качи синтетичен PDF', 'Upload synthetic PDF')} type="file" accept="application/pdf,.pdf" disabled={!syntheticOnly || busy} onChange={chooseFile}/></label><Button disabled={!syntheticOnly || busy} onClick={() => { void loadFile(sample); }}>{t('Отвори примерна фактура', 'Open sample invoice')}</Button>{busy && <Button variant="ghost" onClick={clearDocument}>{t('Отказ', 'Cancel')}</Button>}</div>
      <p className="muted">{t('PDF до 5 MB · до 10 страници · без OCR · без автоматичен импорт', 'PDF up to 5 MB · up to 10 pages · no OCR · no automatic import')}</p>
      {busy && <p role="status">{t('Прочитане локално…', 'Reading locally…')}</p>}{error && <p className="alert warning" role="alert">{error}</p>}
    </section>
    <div className="split-layout" style={{ marginTop: '1.5rem' }}><section className="card card-body"><h2>{t('Преглед на първата страница', 'First page preview')}</h2><canvas ref={canvas} role="img" aria-label={t('Визуален преглед на синтетичната фактура', 'Visual preview of the synthetic invoice')} style={{ width: '100%', height: 'auto', display: documentKey || busy ? 'block' : 'none', border: '1px solid #e5e8e3', background: '#fff' }}/>{!documentKey && !busy && <p className="muted">{t('Отворете пример или изберете синтетичен PDF.', 'Open the sample or choose a synthetic PDF.')}</p>}{fileName && <p>{fileName} · {pageCount} {t('страници', 'pages')}</p>}{text && <details><summary>{t('Извлечен текст — непроверени данни', 'Extracted text — unverified data')}</summary><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 320, overflowY: 'auto', fontSize: '.8rem' }}>{text}</pre></details>}</section>
      <section className="card card-body"><h2>{t('Проверете една ценова промяна', 'Verify one price change')}</h2><p className="muted">{t('Текстът не избира цена автоматично. Сверете EUR, доставчик, количество в опаковка и ДДС с каталога. Цена на ред ≠ цена на опаковка.', 'Text does not select a price automatically. Match EUR, supplier, pack quantity and VAT against the catalogue. Line total ≠ pack price.')}</p>
        <form onSubmit={event => { event.preventDefault(); setApproval(''); setConfirmed(false); if (proposal) setApproval(proposal.token); }}>
          <label className="field"><span>{t('Съставка от каталога', 'Catalogue ingredient')}</span><select disabled={!documentKey} value={ingredientId} onChange={event => { setIngredientId(event.target.value); setApproval(''); setConfirmed(false); }}><option value="">{t('Изберете съставка…', 'Select ingredient…')}</option>{ingredients.map(ingredient => <option key={ingredient.id} value={ingredient.id}>{name(ingredient.name)}</option>)}</select></label>
          {proposal?.ingredient && <p className="muted">{proposal.ingredient.supplier} · {proposal.ingredient.packQuantity} {proposal.ingredient.packUnit} · {t('ДДС', 'VAT')} {proposal.ingredient.vatRate}% · {profile.inputPriceBasis === 'gross' ? t('цена с ДДС', 'gross price') : t('цена без ДДС', 'net price')}</p>}
          <label className="field"><span>{t('Проверена цена на същата опаковка (EUR)', 'Verified price for the same pack (EUR)')}</span><input disabled={!documentKey} inputMode="decimal" value={rawPrice} maxLength={80} onChange={event => { setRawPrice(event.target.value); setApproval(''); setConfirmed(false); }} required/></label>
          {proposalError && <p className="alert warning" role="alert">{proposalError}</p>}<Button variant="secondary" type="submit" disabled={!proposal || busy}>{t('Прегледай ефекта', 'Review price impact')}</Button>
        </form>
        {proposal && approval === proposal.token && <div aria-label={t('Потвърждение на импорт', 'Import confirmation')}><p><strong>{name(proposal.ingredient.name)}</strong>: {format(proposal.ingredient.packPrice)} → <strong>{format(proposal.price)}</strong> / {proposal.ingredient.packQuantity} {proposal.ingredient.packUnit}</p><p>{proposal.impacts.length} {t('свързани рецепти', 'linked recipes')}</p>{proposal.impacts.map(impact => <div className="breakdown-row" key={impact.recipeId}><span>{name(impact.recipeName)}</span><span>{format(impact.before.totalCostPerPortion)} → <strong>{format(impact.after.totalCostPerPortion)}</strong><small> / {t('порция', 'portion')}</small></span></div>)}<p className="muted">{t('С потвърждението заявявате, че опаковката, валутата и ДДС съвпадат. Продажните цени не се променят.', 'Confirm only after matching pack, currency and VAT. Selling prices stay under your control.')}</p><Button disabled={busy} onClick={() => { const fresh = reviewProposal(documentKey, ingredientId, rawPrice, recipes, ingredients, profile); if (fresh.token !== approval) return; const applied = onConfirmPrice(ingredientId, fresh.price); setApproval(''); if (applied) { setRawPrice(''); setConfirmed(true); } }}>{t('Потвърждавам проверената цена', 'Confirm verified price')}<Check size={16}/></Button></div>}
        {confirmed && <p role="status" className="badge success">{t('Проверената промяна е приложена.', 'Verified change applied.')}</p>}
      </section>
    </div>
  </>;
}
