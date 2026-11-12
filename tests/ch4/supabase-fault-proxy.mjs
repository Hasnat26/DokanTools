import http from "node:http";
import { randomUUID } from "node:crypto";
const target="http://127.0.0.1:54321";
let faultMode="off";
const evidence=[];
const server=http.createServer(async(req,res)=>{
 if(req.url==="/__ch4/health"){res.writeHead(200,{"content-type":"application/json"});res.end(JSON.stringify({ok:true,mode:faultMode}));return;}
 if(req.url==="/__ch4/fault"&&req.method==="POST"){let body="";for await(const c of req)body+=c;faultMode=body.trim();if(!["off","invoice-query","invoice-lines-query"].includes(faultMode)){res.writeHead(400);res.end("invalid mode");return;}res.writeHead(200,{"content-type":"application/json"});res.end(JSON.stringify({mode:faultMode}));return;}
 if(req.url==="/__ch4/evidence"){res.writeHead(200,{"content-type":"application/json"});res.end(JSON.stringify(evidence));return;}
 const inject=(faultMode==="invoice-query"&&req.url.startsWith("/rest/v1/invoices"))||(faultMode==="invoice-lines-query"&&req.url.startsWith("/rest/v1/invoice_lines"));
 if(inject){const item={id:randomUUID(),mode:faultMode,method:req.method,path:req.url,upstreamStatus:500,body:{code:"CH4_INJECTED_UPSTREAM_FAILURE"}};evidence.push(item);res.writeHead(500,{"content-type":"application/json","x-ch4-injected":"true"});res.end(JSON.stringify(item.body));return;}
 const upstream=http.request(new URL(req.url,target),{method:req.method,headers:{...req.headers,host:"127.0.0.1:54321"}},u=>{res.writeHead(u.statusCode||502,u.headers);u.pipe(res);});
 upstream.on("error",e=>{res.writeHead(502,{"content-type":"application/json"});res.end(JSON.stringify({error:"local proxy upstream unavailable"}));});
 req.pipe(upstream);
});
server.listen(54329,"127.0.0.1");
