import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
const browser = await puppeteer.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'], headless: true });
const results=[];
try {
 for (const width of [375,1440]) {
  const page=await browser.newPage(); await page.setViewport({width,height:1000});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  let verified=false, recoveryInput;
  await page.setRequestInterception(true);
  page.on('request',async req=>{
   if(req.url().includes('/api/trpc/')) {
    const names=new URL(req.url()).pathname.split('/').pop().split(',');
    const data=names.map(name=>{
     let value=null;
     if(name==='auth.me') value={id:2,name:'Legacy test',subscriptionTier:'free',emailVerified:verified,defaultTrade:'plumbing'};
     if(name==='ai.recentJobs') value=[{id:'2:submission-one-123',estimateId:2,status:'failed',attempts:1,leaseExpiresAt:'2020-01-01',payload:{requestId:'submission-one-123',estimateId:2,trade:'plumbing',mode:'vision',imageUrls:['https://test.invalid/a.pdf'],labourRate:95,useTradePrice:true}}];
     if(name==='emailVerification.request') value={sent:true,verified:false};
     if(name==='emailVerification.confirm') {verified=true;value={verified:true};}
     if(name==='projects.list') value=[];
     return {result:{data:{json:value}}};
    });
    return req.respond({contentType:'application/json',body:JSON.stringify(data)});
   }
   if(req.url().includes('/api/orchestrated-takeoff')) {
    recoveryInput=JSON.parse(req.postData());
    return req.respond({contentType:'text/event-stream',body:'event: error\ndata: {"message":"Simulated provider unavailable; original submission retained"}\n\n'});
   }
   if(req.url().startsWith('http')&&!req.url().startsWith('http://127.0.0.1:5173')) return req.abort();
   return req.continue();
  });
  await page.goto('http://127.0.0.1:5173/ai-takeoff',{waitUntil:'networkidle0'});
  await page.waitForSelector('#verification-code');
  await page.focus('#verification-code'); await page.keyboard.type('12345678'); await page.keyboard.press('Tab'); await page.keyboard.press('Enter');
  await page.waitForFunction(()=>!document.querySelector('#verification-code'));
  await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Retry original scan').click());
  await page.waitForFunction(()=>document.body.innerText.includes('Simulated provider unavailable'));
  if(recoveryInput?.requestId!=='submission-one-123') throw new Error('Recovery changed submission ID');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  if(overflow||errors.length) throw new Error(JSON.stringify({overflow,errors}));
  results.push({width,keyboardVerification:true,recoveryPreservesId:true,retryErrorVisible:true,overflow,errors});
  await page.close();
 }
 await fs.writeFile('docs/validation/recovery-ui.json',JSON.stringify(results,null,2)+'\n');
 console.log(JSON.stringify(results));
} finally {await browser.close();}
