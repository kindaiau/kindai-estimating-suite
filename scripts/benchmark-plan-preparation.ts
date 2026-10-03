/** Offline vector-PDF stress test. This is NOT an AI accuracy or commercial-drawing benchmark. */
import { PDFDocument, rgb } from 'pdf-lib';
import { performance } from 'node:perf_hooks';
import { writeFileSync } from 'node:fs';
import { preparePlan } from '../server/planPreparation';
const document = await PDFDocument.create();
for (let page = 0; page < 50; page++) {
  const sheet = document.addPage([2384, 1684]);
  for (let i = 0; i < 2000; i++) sheet.drawLine({ start: { x: (i * 17) % 2384, y: (i * 13) % 1684 }, end: { x: (i * 31) % 2384, y: (i * 23) % 1684 }, thickness: 0.5, color: rgb(0, 0, 0) });
}
const source = Buffer.from(await document.save());
const runs = [];
for (let i = 0; i < 5; i++) {
  const start = performance.now();
  const prepared = await preparePlan(source, 'application/pdf', 37);
  const output = await PDFDocument.load(prepared.buffer);
  if (output.getPageCount() !== 1 || output.getPage(0).getWidth() !== 2384) throw new Error('Selected sheet mismatch');
  runs.push({ durationMs: Math.round(performance.now() - start), outputBytes: prepared.buffer.length });
}
const report = { classification: 'Synthetic PDF preparation only; no model calls; no commercial accuracy or latency claim supported', sourcePages: 50, vectorLinesPerPage: 2000, selectedPage: 37, sourceBytes: source.length, runs, peakRssBytes: process.resourceUsage().maxRSS * 1024 };
writeFileSync('docs/validation/pdf-preparation-benchmark.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
