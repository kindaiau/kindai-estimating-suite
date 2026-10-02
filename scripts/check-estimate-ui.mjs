import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
const browser = await puppeteer.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'], headless: true });
try {
 const results=[];
 for (const width of [375,1440]) {
 const page = await browser.newPage(); await page.setViewport({width,height:1000});
 let item={id:1,estimateId:1,description:'Copper pipe',category:'Materials',unit:'m',quantity:'1.005',unitRate:'10.00',wasteFactor:'10.00',subtotal:'11.06',isFromAi:true};
 let estimate={id:1,userId:1,projectId:1,title:'Reviewed plumbing quote',trade:'plumbing',version:2,margin:'20.00',subtotal:'13.27',gstAmount:'1.33',total:'14.60',status:'draft',quoteNumber:'TEST-V2',complianceState:'SA'};
 let savedInput; let saves=0; const conflictMode=process.env.MOCK_CONFLICT === "1";
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.setRequestInterception(true);
 page.on('request',async req=>{
  if(req.url().includes('/api/trpc/')){
   const names=new URL(req.url()).pathname.split('/').pop().split(',');
   const values=names.map(name=>{
    let data=null;
    if(name==='auth.me') data={id:1,name:'Local test',subscriptionTier:'pro',subscriptionStatus:'active',emailVerified:true,defaultTrade:'plumbing'};
    if(name==='billing.getSubscription') data={tier:'pro',status:'active',isBetaExpired:false};
    if(name==='estimates.getWithLineItems') data={...estimate,lineItems:[item]};
    if(name==='estimates.get') data=estimate;
    if(name==='estimates.getLineItems') data=[item];
    if(name==='estimates.updateLineItem'){
      const raw=JSON.parse(req.postData()); savedInput=(raw[0]??raw).json;
      saves++;
      if(conflictMode && saves===1) {
        estimate={...estimate,version:3};
        return {error:{json:{message:'This estimate changed in another session. Your draft is preserved.',code:-32009,data:{code:'CONFLICT',httpStatus:409,path:'estimates.updateLineItem'}}}};
      }
      item={...item,quantity:'2.5',unitRate:'12.35',subtotal:'33.96'};
      estimate={...estimate,version:conflictMode?4:3,subtotal:'40.75',gstAmount:'4.08',total:'44.83'};
      data={id:1,estimate,items:[item],totals:{subtotal:'40.75',gstAmount:'4.08',total:'44.83'},version:3};
    }
    return {result:{data:{json:data}}};
   });
   return req.respond({contentType:'application/json',body:JSON.stringify(values)});
  }
  if(req.url().startsWith('http')&&!req.url().startsWith('http://127.0.0.1:5173')) return req.abort();
  return req.continue();
 });
 await page.goto('http://127.0.0.1:5173/estimates/1',{waitUntil:'networkidle0'});
 await page.waitForSelector('[aria-label="Edit Copper pipe"]');
 await page.click('[aria-label="Edit Copper pipe"]');
 const exportBlocked=await page.evaluate(()=>[...document.querySelectorAll('button')].filter(b=>b.textContent.includes('Download PDF')).every(b=>b.disabled));
 for(const [label,value] of [['Quantity','2.5'],['Rate excluding GST','12.35']]){await page.focus(`[aria-label="${label}"]`);await page.keyboard.down('Control');await page.keyboard.press('A');await page.keyboard.up('Control');await page.keyboard.type(value);}
 await page.click('[aria-label="Save item"]');
 if(conflictMode){
  await page.waitForFunction(()=>document.body.innerText.includes('This estimate changed in another session'));
  if(await page.$eval('[aria-label="Quantity"]',el=>el.value)!=='2.5') throw new Error('Conflict discarded draft');
  await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Load current saved values')).click());
  await page.waitForFunction(()=>document.body.innerText.includes('Saved v3:'));
  await page.click('[aria-label="Save item"]');
 }
 await page.waitForFunction(()=>document.body.innerText.includes('44.83'));
 if(!exportBlocked||savedInput.expectedVersion!==(conflictMode?3:2)||savedInput.quantity!==2.5||savedInput.unitRate!==12.35||errors.length) throw new Error(JSON.stringify({exportBlocked,savedInput,errors}));
 await page.screenshot({path:`docs/validation/estimate-${conflictMode?"conflict-":""}${width}.png`,fullPage:true});
 results.push({width,exportBlockedDuringDraft:exportBlocked,submittedVersion:savedInput.expectedVersion,displayedCanonicalTotal:'44.83',errors});
 await page.close();
 }
 await fs.writeFile(`docs/validation/estimate-${process.env.MOCK_CONFLICT === "1" ? "conflict-" : ""}browser-results.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();}
