import fs from "node:fs"; import http from "node:http"; import path from "node:path";
import * as cl from "chrome-launcher"; import lighthouse from "lighthouse";
const DIST="/dev-server/dist"; const PORT=4403;
const T={".html":"text/html;charset=utf-8",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp",".woff2":"font/woff2",".ico":"image/x-icon",".json":"application/json",".xml":"application/xml",".txt":"text/plain"};
const srv=http.createServer((q,r)=>{let f=path.join(DIST,decodeURIComponent((q.url||"/").split("?")[0]));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,"index.html");if(!fs.existsSync(f)){r.writeHead(404).end();return;}r.writeHead(200,{"Content-Type":T[path.extname(f).toLowerCase()]||"application/octet-stream","Cache-Control":"no-store"});r.end(fs.readFileSync(f));});
srv.listen(PORT,"127.0.0.1",async()=>{
 const chrome=await cl.launch({chromePath:"/bin/chromium",chromeFlags:["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage"]});
 for(const p of (process.argv[2]||"/index.html,/about.html").split(",")){
  const res=await lighthouse(`http://127.0.0.1:${PORT}${p}`,{port:chrome.port,output:"json",logLevel:"error"},{extends:"lighthouse:default",settings:{onlyCategories:["performance"],formFactor:"mobile",screenEmulation:{mobile:true,width:412,height:823,deviceScaleFactor:1.75,disabled:false},throttling:{rttMs:150,throughputKbps:1638.4,cpuSlowdownMultiplier:4}}});
  const a=res.lhr.audits;
  console.log(`\n### ${p}  perf=${Math.round(res.lhr.categories.performance.score*100)}`);
  for(const k of ["first-contentful-paint","largest-contentful-paint","total-blocking-time","cumulative-layout-shift","speed-index"]) console.log(`  ${k}: ${a[k].displayValue}`);
  for(const k of ["render-blocking-resources","unused-css-rules","unminified-css","unminified-javascript","unused-javascript","modern-image-formats","uses-responsive-images","mainthread-work-breakdown","bootup-time","font-display","prioritize-lcp-image","network-dependency-tree-insight","render-blocking-insight","document-latency-insight"]){
    const x=a[k]; if(!x||x.score===null||x.score>=0.9) continue;
    console.log(`  -- ${k} (${x.displayValue||""})`);
    (Array.isArray(x.details?.items)?x.details.items:[]).slice(0,8).forEach(i=>console.log("      ",JSON.stringify(i).slice(0,220)));
  }
  console.log("  LCP element:", JSON.stringify(a["largest-contentful-paint-element"]?.details?.items?.[0]||{}).slice(0,300));
 }
 await chrome.kill(); srv.close();
});
