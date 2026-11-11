import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { inlineUploadedLogo } from '../server/quoteLogo';
import { generateQuotePdf } from '../server/pdfGenerator';
const require = createRequire(process.cwd() + '/package.json');
const puppeteer = require('puppeteer-core');
const { transformSync } = require('esbuild');
async function main() {
 const evidenceDir = process.env.ESTIMATOR_EVIDENCE_DIR || '/tmp/kindai-estimator-evidence';
 mkdirSync(evidenceDir, { recursive: true });
 const script = transformSync(readFileSync('client/src/lib/logoUpload.ts','utf8'), { loader:'ts',format:'iife',globalName:'LogoUtils' }).code;
 const browser = await puppeteer.launch({executablePath:process.env.CHROMIUM_PATH,headless:true});
 let logo:any;
 try {
  const page=await browser.newPage(); await page.setRequestInterception(true); page.on('request',(request:any)=>request.url().startsWith('blob:')||request.url().startsWith('data:')?request.continue():request.abort());
  await page.setViewport({width:390,height:844}); await page.setContent('<html><body>Synthetic logo browser test</body></html>'); await page.addScriptTag({content:script});
  logo=await page.evaluate(async()=>{
   const canvas=document.createElement('canvas');canvas.width=320;canvas.height=320;const ctx=canvas.getContext('2d')!;const pixels=ctx.createImageData(320,320);for(let i=0;i<pixels.data.length;i++)pixels.data[i]=i%4===3?255:Math.floor(Math.random()*256);ctx.putImageData(pixels,0,0);
   const blob=await new Promise<Blob>(resolve=>canvas.toBlob(b=>resolve(b!),'image/png'));
   const prepared=await (window as any).LogoUtils.prepareInlineLogo(new File([blob],'synthetic.png',{type:'image/png'}));
   return {originalBytes:blob.size,...prepared};
  });
 } finally {await browser.close();}
 const embedded=inlineUploadedLogo(logo.fileBase64,logo.contentType);if(!embedded)throw Error('Prepared browser logo rejected by server');
 const bytes=Buffer.from(logo.fileBase64,'base64').length;if(bytes>48000)throw Error('Logo too large');
 const pdf=await generateQuotePdf({businessName:'SYNTHETIC LOGO TEST',companyLogoUrl:embedded,trade:'plumbing',quoteNumber:'LOGO-NOT-FOR-ISSUE',quoteDate:'11/11/2026',projectTitle:'Offline branding verification',quoteTerms:'Synthetic test only',lineItems:[{description:'Synthetic pipe',category:'Materials',unit:'m',quantity:1,unitPrice:10,total:10}],subtotal:10,gstAmount:1,total:11});
 writeFileSync(evidenceDir + '/synthetic-branded-quote.pdf',pdf);
 console.log(JSON.stringify({browserViewport:'390x844',originalBytes:logo.originalBytes,embeddedBytes:bytes,pdfBytes:pdf.length,serverAccepted:true}));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
