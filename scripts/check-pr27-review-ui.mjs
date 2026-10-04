import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import fs from 'node:fs/promises';
const origin = process.env.KINDAI_UI_ORIGIN ?? 'http://127.0.0.1:5173';
const browser = await puppeteer.launch({ executablePath: process.env.CHROMIUM_PATH ?? await chromium.executablePath(), args: chromium.args, headless: true });
const results = [];
async function clickText(page, text) {
  await page.evaluate(text => {
    const button = [...document.querySelectorAll('button')].find(button => button.textContent.includes(text));
    if (!button || button.disabled) throw new Error(`Button unavailable: ${text}`);
    button.click();
  }, text);
}
try {
  for (const width of [375, 1440]) {
    for (const paid of [false, true]) {
      const page = await browser.newPage(); await page.setViewport({ width, height: 1000 });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.setRequestInterception(true);
      page.on('request', async req => {
        if (req.url().includes('/api/trpc/')) {
          const names = new URL(req.url()).pathname.split('/').pop().split(',');
          const body = names.map(name => ({ result: { data: { json: name === 'auth.me' ? { id: 1, name: 'Local test', subscriptionTier: paid ? 'pro' : 'free', subscriptionStatus: paid ? 'active' : 'none', emailVerified: true, defaultTrade: 'plumbing' } : name === 'billing.getSubscription' ? { tier: paid ? 'pro' : 'free', status: paid ? 'active' : 'none' } : name === 'ai.recentJobs' || name === 'projects.list' ? [] : null } } }));
          return req.respond({ contentType: 'application/json', body: JSON.stringify(body) });
        }
        if (req.url().startsWith('http') && !req.url().startsWith(origin)) return req.abort();
        return req.continue();
      });
      await page.goto(`${origin}/ai-takeoff`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('[aria-label="Markup percentage"]');
      for (const label of ['Markup percentage', 'Labour hourly rate']) {
        await page.focus(`[aria-label="${label}"] [role="slider"]`); await page.keyboard.press('ArrowRight');
      }
      const state = await page.evaluate(() => ({
        markup: document.querySelector('[aria-label="Markup percentage"] [role="slider"]').getAttribute('aria-valuenow'),
        labour: document.querySelector('[aria-label="Labour hourly rate"] [role="slider"]').getAttribute('aria-valuenow'),
        sheetSelector: !!document.querySelector('[aria-label="PDF drawing sheet"]'),
        fullPdfMessage: document.body.innerText.includes('Your paid scan includes every sheet'),
        overflow: document.documentElement.scrollWidth > innerWidth,
      }));
      if (state.markup !== '25' || state.labour !== '90' || state.sheetSelector === paid || state.fullPdfMessage !== paid || state.overflow || errors.length) throw new Error(JSON.stringify({ width, paid, state, errors }));
      results.push({ width, paid, pricingAdjustableBeforeScan: true, ...state, errors }); await page.close();
    }
    const page = await browser.newPage(); await page.setViewport({ width, height: 1000 });
    let version = 2; let snapshotReads = 0; let assuranceReads = 0;
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', async req => {
      if (req.url().includes('/api/trpc/')) {
        const names = new URL(req.url()).pathname.split('/').pop().split(',');
        const body = names.map(name => {
          let json = null;
          if (name === 'auth.me') json = { id: 1, name: 'Test', subscriptionTier: 'pro', subscriptionStatus: 'active', emailVerified: true };
          if (name === 'billing.getSubscription') json = { tier: 'pro', status: 'active' };
          if (name === 'estimates.getWithLineItems') {
            snapshotReads++;
            json = { id: 1, userId: 1, projectId: 1, title: 'Reviewed quote', trade: 'plumbing', version, margin: '0', subtotal: version === 2 ? '10.00' : version === 3 ? '20.00' : '30.00', gstAmount: '1.00', total: version === 2 ? '11.00' : version === 3 ? '22.00' : '33.00', status: 'draft', lineItems: [{ id: 1, estimateId: 1, category: 'Materials', description: version === 2 ? 'Original pipe' : version === 3 ? 'Agent edited pipe' : 'Text takeoff pipe', quantity: '1', unit: 'm', unitRate: '10', wasteFactor: '0', subtotal: '10' }] };
          }
          if (name === 'estimates.getAssurance') { assuranceReads++; json = null; }
          if (name === 'estimateAgent.chat') { version = 3; json = { reply: 'Updated pipe', actions: [{ tool: 'update_line_item', result: 'Updated' }] }; }
          if (name === 'ai.analyzePlan') { version = 4; json = { items: [{ description: 'Text takeoff pipe', unit: 'm', quantity: 1, unitRate: 30 }], confidence: 90, assumptions: [] }; }
          return { result: { data: { json } } };
        });
        return req.respond({ contentType: 'application/json', body: JSON.stringify(body) });
      }
      if (req.url().startsWith('http') && !req.url().startsWith(origin)) return req.abort();
      return req.continue();
    });
    await page.goto(`${origin}/estimates/1`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('[aria-label="Edit Original pipe"]');
    const firstReads = snapshotReads;
    await clickText(page, 'Edit with AI');
    await page.type('textarea[placeholder="Add, remove, or change anything..."]', 'Change pipe'); await page.keyboard.press('Enter');
    await page.waitForSelector('[aria-label="Edit Agent edited pipe"]');
    const agentReads = snapshotReads;
    // Close the floating agent before opening the takeoff dialog.
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.querySelector('svg.lucide-x') && button.closest('.fixed')).click());
    await clickText(page, 'AI Takeoff');
    await page.waitForSelector('[role="dialog"] textarea');
    await page.type('[role="dialog"] textarea', 'Sample commercial plumbing work');
    await clickText(page, 'Generate Takeoff');
    await page.waitForFunction(() => document.body.innerText.includes('Add All Items to Estimate'));
    await clickText(page, 'Add All Items to Estimate');
    await page.waitForSelector('[aria-label="Edit Text takeoff pipe"]');
    if (snapshotReads <= agentReads || agentReads <= firstReads || errors.length) throw new Error(JSON.stringify({ width, snapshotReads, agentReads, firstReads, assuranceReads, errors }));
    results.push({ width, agentRefresh: true, textTakeoffRefresh: true, snapshotReads, assuranceReads, errors }); await page.close();
    const demo = await browser.newPage(); await demo.setViewport({ width, height: 1000 });
    let demoInput;
    await demo.setRequestInterception(true);
    demo.on('request', async req => {
      if (req.url().includes('/api/trpc/')) {
        const names = new URL(req.url()).pathname.split('/').pop().split(',');
        const body = names.map(name => {
          if (name === 'demo.runDemo') {
            const raw = JSON.parse(req.postData()); demoInput = (raw[0] ?? raw).json;
            return { error: { json: { message: 'Mocked demo accepted', code: -32603, data: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 } } } };
          }
          return { result: { data: { json: null } } };
        });
        return req.respond({ contentType: 'application/json', body: JSON.stringify(body) });
      }
      if (req.url().startsWith('http') && !req.url().startsWith(origin)) return req.abort();
      return req.continue();
    });
    await demo.goto(`${origin}/demo`, { waitUntil: 'networkidle0' });
    await clickText(demo, 'Generate AI Takeoff');
    await demo.waitForFunction(() => document.body.innerText.includes('Mocked demo accepted'));
    if (!demoInput || demoInput.jobDescription || demoInput.planImageUrl || demoInput.planImageUrls) throw new Error('Default demo sent real-input fields');
    results.push({ width, defaultDemoSendsOnlySampleOptions: true, demoInput }); await demo.close();
  }
  await fs.writeFile('docs/validation/pr27-review-ui.json', JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify(results));
} finally { await browser.close(); }
