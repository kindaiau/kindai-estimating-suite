import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
const browser = await puppeteer.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'], headless: true });
const results = [];
try {
  for (const width of [375, 1440]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 1000 });
    await page.setRequestInterception(true);
    page.on('request', req => {
      if (req.url().includes('/api/trpc/')) {
        const names = new URL(req.url()).pathname.split('/').pop().split(',');
        req.respond({ contentType: 'application/json', body: JSON.stringify(names.map(name => ({ result: { data: { json: name === 'billing.offerTax' ? { ready: false, behavior: null, automatic: null } : null } } }))) });
      } else if (req.url().startsWith('http') && !req.url().startsWith('http://127.0.0.1:5173')) req.abort();
      else req.continue();
    });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle0' });
    await page.waitForSelector('h1');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    await page.keyboard.press('Tab');
    const firstFocus = await page.evaluate(() => document.activeElement.textContent);
    await page.focus('input[type=range]');
    await page.keyboard.press('ArrowRight');
    const updatedHours = await page.$eval('input[type=range]', el => el.value);
    await page.screenshot({ path: `docs/validation/home-${width}.png`, fullPage: true });
    results.push({ width, overflow, firstFocus, updatedHours, errors });
    if (overflow || errors.length || updatedHours !== '6' || !firstFocus.includes('Skip to content')) throw new Error(JSON.stringify(results));
    await page.close();
  }
  await fs.writeFile('docs/validation/browser-results.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
} finally { await browser.close(); }
