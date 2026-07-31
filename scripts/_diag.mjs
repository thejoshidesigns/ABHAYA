import fs from "node:fs"; import http from "node:http"; import path from "node:path";
import * as cl from "chrome-launcher"; import lighthouse from "lighthouse";
const ROOT="/dev-server"; const DIST=path.join(ROOT,"dist"); const PORT=4401;
const T={".html":"text/html;charset=utf-8",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp",".woff2":"font/woff2",".xml":"application/xml",".txt":"text/plain",".ico":"image/x-icon",".json":"application/json"};
const srv=http.createServer((q,r)=>{let f=path.join(DIST,decodeURIComponent((q.url||"/").split("?")[0]));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,"index.html");if(!fs.existsSync(f)){r.writeHead(404).end();return;}r.writeHead(200,{"Content-Type":T[path.extname(f).toLowerCase()]||"application/octet-stream","Cache-Control":"no-store"});r.end(fs.readFileSync(f));});
const PAGES=["/index.html","/about.html","/services/index.html","/insurance.html","/contact.html","/intake.html"];
srv.listen(PORT,"127.0.0.1",async()=>{
 const chrome=await cl.launch({chromePath:"/bin/chromium",chromeFlags:["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage"]});
 for(const p of PAGES){
  const res=await lighthouse(`http://127.0.0.1:${PORT}${p}`,{port:chrome.port,output:"json",logLevel:"error"},{extends:"lighthouse:default",settings:{onlyCategories:["accessibility"],formFactor:"mobile",screenEmulation:{mobile:true,width:412,height:823,deviceScaleFactor:1.75,disabled:false}}});
  const lhr=res.lhr;
  const fails=lhr.categories.accessibility.auditRefs.map(a=>lhr.audits[a.id]).filter(a=>a.score!==null&&a.score<1);
  console.log(`\n=== ${p} : ${Math.round(lhr.categories.accessibility.score*100)}`);
  for(const f of fails){console.log(` FAIL ${f.id}`);(f.details?.items||[]).forEach(i=>console.log("   -",(i.node?.selector||JSON.stringify(i)).slice(0,200)));}
 }
 await chrome.kill(); srv.close();
});
