const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const output = process.env.HIG_OUT || path.join(__dirname, '../_screens/hig');
const base = process.env.E2E_BASE_URL || 'http://localhost:3100';
const routes = ['/', '/d/MONDO_0009499', '/d/MONDO_0018868', '/g/PSAP', '/d/MONDO_0012720', '/d/MONDO_0008215', '/d/MONDO_0009499/action?via=MONDO_0018868', '/methods', '/about', '/t/NCT05739643'];
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const results=[];
 for(const colorScheme of ['light','dark']) for(const width of [320,375,390,768,1280]) {
  const ctx=await browser.newContext({viewport:{width,height:900},colorScheme,reducedMotion:'reduce'});
  const page=await ctx.newPage();
  for(const [i,route] of routes.entries()) {
   const errors=[]; const handler=e=>errors.push(e.message); page.on('pageerror',handler);
   await page.goto(base+route,{waitUntil:'networkidle'});
   await page.locator('h1').first().waitFor();
   const measure=()=>{
    const visible=e=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[aria-hidden=true]')&&!e.classList.contains('sr-only')&&!(e.closest('details:not([open])')&&!e.closest('summary'));
    const controls=[...document.querySelectorAll('a,button,input,select,summary,[role=button]')].filter(visible);
    const small=controls.map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent?.trim().slice(0,70)||e.getAttribute('aria-label'),width:r.width,height:r.height}}).filter(r=>r.width<43.9||r.height<43.9);
    const text=[...document.querySelectorAll('body *')].filter(e=>visible(e)&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()));
    const sizes=[...new Set(text.map(e=>getComputedStyle(e).fontSize))];
    const color=s=>(s.match(/[\d.]+/g)||[]).map(Number);
    const blend=(a,b)=>{const alpha=a[3]??1;return a.slice(0,3).map((v,i)=>v*alpha+b[i]*(1-alpha));};
    const bg=e=>{const chain=[];for(let n=e;n;n=n.parentElement)chain.unshift(n);return chain.reduce((c,n)=>blend(color(getComputedStyle(n).backgroundColor),c),[255,255,255]);};
    const lum=a=>a.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
    const contrasts=text.map(e=>{const s=getComputedStyle(e),back=bg(e),front=blend(color(s.color),back),a=lum(front),b=lum(back);const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);return {text:e.textContent.trim().slice(0,90),ratio:Math.round(ratio*100)/100,size:s.fontSize,weight:s.fontWeight,fg:s.color,bg:back}}).filter(x=>x.ratio<(parseFloat(x.size)>=24||parseFloat(x.size)>=18.66&&Number(x.weight)>=700?3:4.5));
    const narrow=text.filter(e=>parseFloat(getComputedStyle(e).fontSize)<11).map(e=>e.textContent.slice(0,50));
    const pairs=[];
    for(let a=0;a<controls.length;a++)for(let b=a+1;b<controls.length;b++){
     const x=controls[a],y=controls[b];if(x.contains(y)||y.contains(x))continue;
     const r=x.getBoundingClientRect(),s=y.getBoundingClientRect();const dx=Math.max(s.left-r.right,r.left-s.right),dy=Math.max(s.top-r.bottom,r.top-s.bottom);
     if((dy<0&&dx>=0&&dx<11.9)||(dx<0&&dy>=0&&dy<11.9))pairs.push({a:x.textContent.trim().slice(0,35),b:y.textContent.trim().slice(0,35),gap:Math.max(dx,dy)});
    }
    return {overflow:document.documentElement.scrollWidth>innerWidth+1,documentWidth:document.documentElement.scrollWidth,small,contrasts,narrow,sizes,spacing:pairs,animations:document.getAnimations().filter(a=>a.playState==='running').length};
   };
   const normal=await page.evaluate(measure);
   if(width===375||width===1280)await page.screenshot({path:path.join(output,`${i}-${colorScheme}-${width}.png`),fullPage:false});
   await page.evaluate(()=>document.documentElement.style.fontSize='200%');
   const zoom=await page.evaluate(measure);
   results.push({route,width,colorScheme,normal,zoom,errors});
   fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(results,null,2));
   console.log(JSON.stringify({route,width,colorScheme,overflow:normal.overflow,zoomOverflow:zoom.overflow,small:normal.small.length,contrast:normal.contrasts.length,sizes:normal.sizes.length,spacing:normal.spacing.length,errors}));
   await page.evaluate(()=>document.documentElement.style.fontSize='');page.off('pageerror',handler);
  }
  await ctx.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
