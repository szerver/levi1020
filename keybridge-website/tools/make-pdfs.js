const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const out=process.argv[2];
for (const slug of ['exit-korkep-2026','onjaro-ceg-kezikonyv','cegeladas-kezikonyv','generaciovaltas-kezikonyv']) {
  const p=await b.newPage({viewport:{width:1100,height:1400}});
  await p.goto('http://127.0.0.1:8765/utmutatok/'+slug+'/',{waitUntil:'networkidle'});
  await p.emulateMedia({media:'print'}); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(400);
  await p.pdf({path:out+'/'+slug+'.pdf',format:'A4',printBackground:true,preferCSSPageSize:true,displayHeaderFooter:true,
    headerTemplate:'<span></span>',
    footerTemplate:'<div style="width:100%;font-family:Arial,sans-serif;font-size:8px;color:#4A625C;padding:0 16mm;display:flex;justify-content:space-between"><span>Keybridge Exit Partners</span><span class="pageNumber"></span></div>'});
  await p.close(); console.log('pdf',slug);
}
await b.close(); })();
