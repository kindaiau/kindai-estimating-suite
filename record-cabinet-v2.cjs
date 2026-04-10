const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRAME_DIR = '/home/ubuntu/recording_frames';
const SITE_URL = 'https://kindaiestimator.com';
let frameCount = 0;

async function cap(page, label) {
  frameCount++;
  const padded = String(frameCount).padStart(5, '0');
  await page.screenshot({ path: path.join(FRAME_DIR, `frame_${padded}.png`), type: 'png' });
  if (label) console.log(`[Frame ${padded}] ${label}`);
}

async function capN(page, count, delayMs, label) {
  for (let i = 0; i < count; i++) {
    await cap(page, i === 0 ? label : '');
    await new Promise(r => setTimeout(r, delayMs));
  }
}

async function scroll(page, targetY, frames) {
  frames = frames || 15;
  const currentY = await page.evaluate(() => window.scrollY);
  const step = (targetY - currentY) / frames;
  for (let i = 0; i < frames; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(currentY + step * (i + 1)));
    await cap(page);
    await new Promise(r => setTimeout(r, 80));
  }
}

(async () => {
  console.log('=== Cabinet Making Demo Recording v2 ===');
  
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,720', '--disable-gpu'],
    defaultViewport: { width: 1280, height: 720 },
  });

  const page = await browser.newPage();
  
  // ============================================
  // SCENE 1: Cabinet Joinery Landing Page (8s)
  // ============================================
  console.log('Scene 1: Cabinet Joinery landing page');
  await page.goto(`${SITE_URL}/cabinet-joinery`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await capN(page, 30, 100, 'Hero - Cabinet Making & Joinery');
  
  await scroll(page, 700, 15);
  await capN(page, 25, 100, 'Proof block - real AU products');
  
  await scroll(page, 1400, 15);
  await capN(page, 20, 100, 'Workflow section');
  
  // ============================================
  // SCENE 2: Demo Page - Select Trade (5s)
  // ============================================
  console.log('Scene 2: Demo page - trade selection');
  await page.goto(`${SITE_URL}/demo`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await capN(page, 15, 100, 'Demo page loaded');
  
  // Select Cabinet Making & Joinery trade by clicking the trade card
  console.log('Selecting Cabinet Making trade...');
  const tradeSelected = await page.evaluate(() => {
    // Find all clickable trade elements
    const elements = document.querySelectorAll('button, div[role="button"], label, [class*="trade"], [class*="Trade"]');
    for (const el of elements) {
      const text = el.textContent || '';
      if (text.includes('Cabinet') || text.includes('Joinery') || text.includes('cabinet')) {
        el.click();
        return text.trim().substring(0, 50);
      }
    }
    // Try select element
    const selects = document.querySelectorAll('select');
    for (const sel of selects) {
      for (const opt of sel.options) {
        if (opt.text.includes('Cabinet') || opt.value.includes('cabinet')) {
          sel.value = opt.value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          return opt.text;
        }
      }
    }
    return null;
  });
  console.log('Trade selected:', tradeSelected);
  await capN(page, 20, 100, 'Cabinet Making selected');
  
  // ============================================
  // SCENE 3: Type Job Description (5s)
  // ============================================
  console.log('Scene 3: Type job description');
  
  // First, try to click "Describe Job" tab if it exists
  await page.evaluate(() => {
    const tabs = document.querySelectorAll('button, [role="tab"]');
    for (const tab of tabs) {
      if ((tab.textContent || '').includes('Describe')) {
        tab.click();
        break;
      }
    }
  });
  await new Promise(r => setTimeout(r, 500));
  
  // Clear the textarea and type fresh cabinet job description
  const textarea = await page.$('textarea');
  if (textarea) {
    // Triple-click to select all, then delete
    await textarea.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await new Promise(r => setTimeout(r, 200));
    
    // Also use Ctrl+A to make sure everything is selected
    await textarea.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await new Promise(r => setTimeout(r, 200));
    
    const jobDesc = "Supply and install complete kitchen cabinetry for 24-unit apartment complex. Laminex Chalk White carcasses, Polytec Ravine Natural Oak doors, Blum Aventos HF lift systems on overhead cabinets, Blum Tandembox Antaro soft-close drawers, Caesarstone Calacatta Maximus benchtops 40mm with waterfall ends. Each kitchen: 3.6m run upper and lower, 600mm pantry tower, island bench 2.4m x 900mm.";
    
    // Type in visible chunks
    const chunks = jobDesc.match(/.{1,8}/g) || [];
    for (let i = 0; i < chunks.length; i++) {
      await textarea.type(chunks[i], { delay: 0 });
      if (i % 3 === 0) await cap(page);
      await new Promise(r => setTimeout(r, 15));
    }
    await capN(page, 15, 100, 'Job description typed');
    console.log('Job description typed successfully');
  } else {
    console.log('ERROR: No textarea found!');
  }
  
  // ============================================
  // SCENE 4: Click Generate AI Takeoff (1s)
  // ============================================
  console.log('Scene 4: Click Generate button');
  
  // Scroll down to make the Generate button visible
  await scroll(page, 400, 10);
  await capN(page, 5, 100, 'Generate button visible');
  
  const buttonClicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    // Try multiple possible button texts
    const searchTexts = ['Generate AI Takeoff', 'Generate', 'Analyse', 'Analyze', 'Start'];
    for (const searchText of searchTexts) {
      const btn = buttons.find(b => {
        const t = (b.textContent || '').trim();
        return t.includes(searchText) && !b.disabled;
      });
      if (btn) {
        btn.click();
        return `Clicked: "${btn.textContent.trim().substring(0, 40)}"`;
      }
    }
    // List all visible buttons for debugging
    return 'NOT FOUND. Buttons: ' + buttons.map(b => `"${(b.textContent || '').trim().substring(0, 30)}"`).join(', ');
  });
  console.log('Button result:', buttonClicked);
  await capN(page, 15, 100, 'Generate clicked');
  
  // ============================================
  // SCENE 5: Wait for AI Results (up to 90s)
  // ============================================
  console.log('Scene 5: Waiting for AI results...');
  let resultsFound = false;
  
  for (let i = 0; i < 180; i++) {
    await cap(page);
    await new Promise(r => setTimeout(r, 500));
    
    // Check for results - look for dollar signs, material names, or total
    const status = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasMaterials = text.includes('Laminex') || text.includes('Blum') || text.includes('Caesarstone') || text.includes('Polytec');
      const hasPricing = (text.match(/\$/g) || []).length > 3;
      const hasTotal = text.includes('Total') || text.includes('total');
      const isLoading = text.includes('Analysing') || text.includes('Analyzing') || text.includes('Generating') || text.includes('Processing');
      return { hasMaterials, hasPricing, hasTotal, isLoading };
    });
    
    if ((status.hasMaterials && status.hasPricing) || (status.hasPricing && status.hasTotal)) {
      console.log(`Results appeared at frame ${frameCount}!`, status);
      resultsFound = true;
      
      // Capture the results for 3 seconds
      await capN(page, 30, 100, 'AI Results visible!');
      break;
    }
    
    if (i % 20 === 0) {
      console.log(`  Waiting... frame ${frameCount}, status:`, status);
    }
  }
  
  if (!resultsFound) {
    console.log('WARNING: Results did not appear within 90s timeout');
    await capN(page, 15, 100, 'Timeout - current state');
  }
  
  // ============================================
  // SCENE 6: Scroll through results (8s)
  // ============================================
  console.log('Scene 6: Scrolling through results');
  
  // Scroll back to top of results first
  await scroll(page, 0, 10);
  await capN(page, 10, 100, 'Top of results');
  
  // Slowly scroll through all results
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  const scrollSteps = Math.min(8, Math.ceil(pageHeight / 400));
  
  for (let i = 1; i <= scrollSteps; i++) {
    const y = Math.round((pageHeight * i) / scrollSteps);
    await scroll(page, y, 12);
    await capN(page, 15, 100, `Results section ${i}/${scrollSteps}`);
  }
  
  // Final pause at the bottom
  await capN(page, 30, 100, 'Final view - quote total');
  
  await browser.close();
  
  // ============================================
  // COMPILE VIDEO
  // ============================================
  console.log(`\nRecording complete. Total frames: ${frameCount}`);
  console.log('Compiling to MP4...');
  
  try {
    execSync(`ffmpeg -y -framerate 15 -i ${FRAME_DIR}/frame_%05d.png -c:v libx264 -pix_fmt yuv420p -preset medium -crf 23 /home/ubuntu/kindai_cabinet_demo.mp4`, {
      stdio: 'inherit',
      timeout: 180000,
    });
    const stats = fs.statSync('/home/ubuntu/kindai_cabinet_demo.mp4');
    console.log(`\nVideo compiled successfully: ${(stats.size / 1024 / 1024).toFixed(1)}MB`);
    console.log(`Duration: ~${Math.round(frameCount / 15)}s at 15fps`);
  } catch (e) {
    console.log('FFmpeg error:', e.message);
  }
})();
