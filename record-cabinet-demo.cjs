const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRAME_DIR = '/home/ubuntu/recording_frames';
const SITE_URL = 'https://kindaiestimator.com';
let frameCount = 0;

async function captureFrame(page, label) {
  frameCount++;
  const padded = String(frameCount).padStart(5, '0');
  const filePath = path.join(FRAME_DIR, `frame_${padded}.png`);
  await page.screenshot({ path: filePath, type: 'png' });
  if (label) console.log(`[Frame ${padded}] ${label}`);
}

async function captureFrames(page, count, delayMs, label) {
  for (let i = 0; i < count; i++) {
    await captureFrame(page, i === 0 ? label : '');
    await new Promise(r => setTimeout(r, delayMs));
  }
}

async function smoothScroll(page, targetY, frames) {
  frames = frames || 20;
  const currentY = await page.evaluate(() => window.scrollY);
  const step = (targetY - currentY) / frames;
  for (let i = 0; i < frames; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(currentY + step * (i + 1)));
    await captureFrame(page);
    await new Promise(r => setTimeout(r, 80));
  }
}

(async () => {
  console.log('Starting cabinet making demo recording...');
  
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,720', '--disable-gpu'],
    defaultViewport: { width: 1280, height: 720 },
  });

  const page = await browser.newPage();
  
  // Scene 1: Cabinet Joinery landing page
  console.log('Scene 1: Cabinet Joinery landing page');
  await page.goto(`${SITE_URL}/cabinet-joinery`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await captureFrames(page, 30, 100, 'Cabinet Joinery hero');
  
  // Scroll to proof block
  await smoothScroll(page, 600, 15);
  await captureFrames(page, 20, 100, 'Proof block');
  
  // Scroll to workflow
  await smoothScroll(page, 1200, 15);
  await captureFrames(page, 20, 100, 'Workflow section');

  // Scroll to bottom
  await smoothScroll(page, 2000, 15);
  await captureFrames(page, 15, 100, 'CTA section');
  
  // Scene 2: Navigate to Demo page
  console.log('Scene 2: Demo page');
  await page.goto(`${SITE_URL}/demo`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await captureFrames(page, 20, 100, 'Demo page loaded');
  
  // Select Cabinet Making trade
  console.log('Selecting Cabinet Making trade...');
  try {
    // Try select dropdown first
    const selects = await page.$$('select');
    for (const sel of selects) {
      const options = await sel.$$('option');
      for (const opt of options) {
        const text = await opt.evaluate(el => el.textContent);
        const val = await opt.evaluate(el => el.value);
        if (text && (text.includes('Cabinet') || text.includes('Joinery') || val === 'cabinetry' || val === 'cabinet_making')) {
          await sel.select(val);
          console.log(`Selected trade: ${text} (${val})`);
          await captureFrames(page, 15, 100, 'Trade selected');
          break;
        }
      }
    }
  } catch (e) {
    console.log('Trade selection error:', e.message);
  }
  
  // Look for Describe Job tab
  console.log('Looking for Describe Job tab...');
  try {
    const allButtons = await page.$$('button, [role="tab"]');
    for (const btn of allButtons) {
      const text = await btn.evaluate(el => el.textContent || '');
      if (text.includes('Describe') || text.includes('describe')) {
        await btn.click();
        await new Promise(r => setTimeout(r, 500));
        await captureFrames(page, 10, 100, 'Describe Job tab');
        break;
      }
    }
  } catch (e) {
    console.log('Tab click error:', e.message);
  }
  
  // Type job description
  const jobDesc = "Supply and install complete kitchen cabinetry for 24-unit apartment complex. Laminex Chalk White carcasses, Polytec Ravine Natural Oak doors, Blum Aventos HF lift systems, Blum Tandembox Antaro soft-close drawers, Caesarstone Calacatta Maximus benchtops 40mm with waterfall ends. Each kitchen: 3.6m run upper + lower, 600mm pantry tower, island bench 2.4m x 900mm.";
  
  try {
    const textarea = await page.$('textarea');
    if (textarea) {
      await textarea.click();
      // Type in chunks for visual effect
      const chunks = jobDesc.match(/.{1,5}/g) || [];
      for (const chunk of chunks) {
        await textarea.type(chunk, { delay: 0 });
        if (frameCount % 4 === 0) await captureFrame(page);
        await new Promise(r => setTimeout(r, 20));
      }
      await captureFrames(page, 15, 100, 'Job description typed');
      console.log('Job description typed');
    } else {
      console.log('No textarea found');
    }
  } catch (e) {
    console.log('Typing error:', e.message);
  }
  
  // Click Analyse button
  console.log('Clicking Analyse...');
  try {
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => {
        const t = b.textContent || '';
        return t.includes('Analyse') || t.includes('Analyze') || t.includes('Generate Takeoff');
      });
      if (btn && !btn.disabled) { btn.click(); return true; }
      return false;
    });
    console.log('Analyse clicked:', clicked);
    await captureFrames(page, 20, 100, 'Analysis started');
  } catch (e) {
    console.log('Analyse click error:', e.message);
  }
  
  // Wait for AI results (up to 90 seconds)
  console.log('Waiting for AI results...');
  let resultsFound = false;
  for (let i = 0; i < 180; i++) {
    await captureFrame(page);
    await new Promise(r => setTimeout(r, 500));
    
    const hasResults = await page.evaluate(() => {
      const text = document.body.innerText;
      return (text.includes('Materials') || text.includes('materials')) && 
             (text.includes('$') || text.includes('Total') || text.includes('total'));
    });
    
    if (hasResults && !resultsFound) {
      console.log(`Results appeared at frame ${frameCount}`);
      resultsFound = true;
      await captureFrames(page, 30, 100, 'Results visible');
      break;
    }
    
    if (i % 20 === 0) console.log(`Still waiting... frame ${frameCount}`);
  }
  
  if (!resultsFound) {
    console.log('Timeout waiting for results');
    await captureFrames(page, 20, 100, 'Timeout state');
  }
  
  // Scroll through results
  console.log('Scrolling through results...');
  for (let scrollY = 400; scrollY <= 2000; scrollY += 400) {
    await smoothScroll(page, scrollY, 12);
    await captureFrames(page, 15, 100, `Results at ${scrollY}px`);
  }
  
  // Final pause
  await captureFrames(page, 30, 100, 'Final view');
  
  await browser.close();
  
  console.log(`\nRecording complete. Total frames: ${frameCount}`);
  console.log('Compiling to MP4...');
  
  try {
    execSync(`ffmpeg -y -framerate 15 -i ${FRAME_DIR}/frame_%05d.png -c:v libx264 -pix_fmt yuv420p -preset medium -crf 23 /home/ubuntu/kindai_cabinet_demo.mp4`, {
      stdio: 'inherit',
      timeout: 120000,
    });
    const stats = fs.statSync('/home/ubuntu/kindai_cabinet_demo.mp4');
    console.log(`Video compiled: ${(stats.size / 1024 / 1024).toFixed(1)}MB`);
  } catch (e) {
    console.log('FFmpeg error:', e.message);
  }
})();
