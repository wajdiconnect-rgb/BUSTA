// cattura_sito_intero.js — cattura tutto il sito (mobile, 4K) a pezzi. Uso: SITO_URL="..." node cattura_sito_intero.js  (URL mai scritto nel file)
const {chromium}=require('playwright');
const url=process.env.SITO_URL;
(async()=>{
 const b=await chromium.launch();
 const p=await b.newPage({viewport:{width:432,height:768},deviceScaleFactor:5});
 await p.goto(url,{waitUntil:'networkidle',timeout:90000});
 const a2=p.locator('button:has-text("Accetta")'); if(await a2.count()) await a2.first().click().catch(()=>{});
 await p.waitForTimeout(1000);
 let h=await p.evaluate(()=>document.body.scrollHeight);
 for(let y=0;y<h;y+=250){await p.evaluate(y=>window.scrollTo(0,y),y);await p.waitForTimeout(200);}
 h=await p.evaluate(()=>document.body.scrollHeight);
 await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(2500);
 await p.evaluate(()=>{for(const el of document.querySelectorAll('body *')){const cs=getComputedStyle(el);if(cs.position==='fixed'||cs.position==='sticky'){el.style.display='none';}}
   for(const el of document.querySelectorAll('*')){el.style.scrollSnapType='none';}});
 await p.waitForTimeout(800);
 const fin=Math.min(h,7200);const passo=1500;let k=0;
 for(let y=0;y<fin;y+=passo){await p.screenshot({path:`pz_${String(k).padStart(2,'0')}.png`,fullPage:true,clip:{x:0,y,width:432,height:Math.min(passo,fin-y)}});k++;}
 console.log('altezza',h,'pezzi',k);await b.close();
})();
