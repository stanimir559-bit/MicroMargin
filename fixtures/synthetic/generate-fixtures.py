"""Generate fictional test-only invoice fixtures; never uses external/customer data."""
from pathlib import Path
import json
from decimal import Decimal
import sys

ROOT = Path(__file__).resolve().parents[2]

def generate_text_matrix():
    result = []
    for language in ('en', 'bg'):
        for index in range(10):
            comma = index % 2 == 1
            canonical_price = f'{Decimal("2.75") + Decimal(index) / 4:.2f}'
            line_total = f'{Decimal(canonical_price) * 2:.2f}'
            price = canonical_price.replace('.', ',') if comma else canonical_price
            pack_quantity = ['1', '2', '24'][index % 3]
            pack_unit = ['kg', 'L', 'each'][index % 3]
            vat_rate = ['0', '5', '10'][index % 3]
            heading = 'INVOICE' if language == 'en' else 'ФАКТУРА'
            supplier = 'SYNTHETIC DEMO SUPPLIER' if language == 'en' else 'СИНТЕТИЧЕН ДЕМО ДОСТАВЧИК'
            ingredient = (['Flour', 'Milk', 'Eggs'] if language == 'en' else ['Брашно', 'Мляко', 'Яйца'])[index % 3]
            parts = [f'{ingredient}', f'Pack: {pack_quantity} {pack_unit}', f'Pack price: {price} EUR', 'Packs: 2', f'Line total: {line_total} EUR']
            if index >= 5:
                parts = [parts[0], parts[4], parts[3], parts[2], parts[1]]
            lines = [heading, supplier, f'Number: SYN-{language}-{index:02d}', 'Date: 2026-10-27', 'Currency: EUR', ' | '.join(parts), 'Input price basis: gross', f'Demo VAT: {vat_rate}%', f'TOTAL: {line_total} EUR', 'SYNTHETIC DATA - NO REAL CUSTOMER OR TAX RECORD']
            if index >= 5:
                lines = [*lines[:5], 'Columns: name | pack quantity | unit price | quantity | total', *lines[5:]]
            text = '\n'.join(lines)
            filename = f'invoice-{language}-{index:02d}.txt'
            (ROOT / 'fixtures' / 'synthetic' / filename).write_text(text, encoding='utf-8')
            result.append({'file': filename, 'language': language, 'decimal': 'comma' if comma else 'point', 'packPrice': canonical_price, 'lineTotal': line_total, 'currency': 'EUR', 'packQuantity': pack_quantity, 'packUnit': pack_unit, 'vatRate': vat_rate, 'priceBasis': 'gross', 'invoiceNumber': f'SYN-{language}-{index:02d}', 'templateFamily': 'labelled-pipe'})
    (ROOT / 'fixtures' / 'synthetic' / 'ground-truth.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    (ROOT / 'fixtures' / 'synthetic' / 'malformed.pdf').write_bytes(b'<html>This is deliberately not a PDF. Synthetic rejection fixture.</html>')

def generate_pdf():
    from reportlab.pdfgen import canvas
    from reportlab.lib.colors import HexColor
    path = ROOT / 'public' / 'synthetic-invoice.pdf'
    path.parent.mkdir(exist_ok=True)
    c = canvas.Canvas(str(path), pagesize=(595, 842), pageCompression=0)
    c.setTitle('MicroMargin - synthetic invoice fixture')
    c.setAuthor('MicroMargin synthetic fixtures')
    c.setFillColor(HexColor('#163f32'))
    c.rect(0, 738, 595, 104, fill=1, stroke=0)
    c.setFillColor(HexColor('#ffffff')); c.setFont('Helvetica-Bold', 25)
    c.drawString(42, 786, 'SUPPLIER INVOICE')
    c.setFont('Helvetica', 11); c.drawString(42, 762, 'SYNTHETIC DEMO - NOT AN ACCOUNTING DOCUMENT')
    c.setFillColor(HexColor('#163f32')); c.setFont('Helvetica-Bold', 14)
    c.drawString(42, 691, 'Little Mill / Fictional supplier')
    c.setFont('Helvetica', 11)
    for y, value in [(666, 'Invoice: SYN-2026-001'), (646, 'Date: 2026-10-27'), (626, 'Customer: Little Bite Bakery (fictional)'), (606, 'Currency: EUR | Demo VAT: 0% | Prices: gross')]: c.drawString(42, y, value)
    c.setFillColor(HexColor('#edf3ed')); c.rect(42, 532, 511, 34, fill=1, stroke=0)
    c.setFillColor(HexColor('#163f32')); c.setFont('Helvetica-Bold', 10)
    for x, label in [(52, 'Ingredient'), (245, 'Pack'), (325, 'Pack price'), (420, 'Packs'), (478, 'Total')]: c.drawString(x, 545, label)
    c.setFont('Helvetica', 11)
    for x, value in [(52, 'Wheat flour'), (245, '1 kg'), (325, '2.75 EUR'), (420, '2'), (478, '5.50 EUR')]: c.drawString(x, 508, value)
    c.setStrokeColor(HexColor('#dbe4dc')); c.line(42, 490, 553, 490)
    c.setFont('Helvetica-Bold', 14); c.drawString(360, 450, 'TOTAL: 5.50 EUR')
    c.setFont('Helvetica', 10)
    notes = ['Review example: a 1 kg supplier pack costs 2.75 EUR.', 'Two packs were bought. The 5.50 EUR line total is not the pack price.', 'Before import, match ingredient, supplier, pack and configured VAT basis.', 'All names, prices and invoice details are fictional. No real customer data.', 'This fixture tests text preview only; it does not validate tax compliance.']
    for index, note in enumerate(notes): c.drawString(42, 370 - index * 22, note)
    c.setFillColor(HexColor('#587060')); c.setFont('Helvetica', 9)
    c.drawString(42, 47, 'MicroMargin test fixture | Generated locally | Page 1 of 1')
    c.save()

if __name__ == '__main__':
    generate_text_matrix()
    if '--text-only' not in sys.argv:
        generate_pdf()
