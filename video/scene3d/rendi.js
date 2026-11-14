// node rendi.js out_dir fps [t1,t2,...]   (senza lista: tutto il video 0..31s)
const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
 const out=process.argv[2], fps=+process.argv[3]||30;
 const lista=process.argv[4]?process.argv[4].split(',').map(Number):null;
 const da=+(process.env.DA||0), a=+(process.env.A||31);
 fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:1080,height:1920}});
 p.on('console',m=>{if(m.type()==='error')console.log('ERR',m.text())});
 p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.goto('http://localhost:8765/scena.html',{waitUntil:'networkidle'});
 await p.evaluate(()=>window.pronto);
 const tempi=lista||Array.from({length:Math.round((a-da)*fps)},(_,i)=>da+i/fps);
 for(let i=0;i<tempi.length;i++){
  await p.evaluate(t=>window.render(t),tempi[i]);
  const n=lista?`t${tempi[i]}`:String(Math.round(tempi[i]*fps)).padStart(5,'0');
  await p.screenshot({path:`${out}/${n}.jpg`,type:'jpeg',quality:94});
  if(i%60==0)console.log('frame',i,'/',tempi.length);
 }
 await b.close();
})();
