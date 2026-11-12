import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHmac } from "node:crypto";
const API=process.env.SUPABASE_URL,ANON=process.env.SUPABASE_ANON_KEY,SERVICE=process.env.SUPABASE_SERVICE_ROLE_KEY,DB=process.env.SUPABASE_DB_URL;
let cleanupContext;
const cleanupEvidence=[];
const httpTranscript=[];
const evidenceDir=process.env.CH4_EVIDENCE_DIR||"artifacts/ch4";
async function saveEvidence(name,value){const fs=await import("node:fs");fs.mkdirSync(evidenceDir,{recursive:true});fs.writeFileSync(evidenceDir+"/"+name,JSON.stringify(value,null,2)+"\n");}
function jwtExpired(sub){const secret=process.env.CH4_LOCAL_JWT_SECRET;assert.ok(secret);const b=x=>Buffer.from(JSON.stringify(x)).toString("base64url"),now=Math.floor(Date.now()/1000),h=b({alg:"HS256",typ:"JWT"}),p=b({iss:"supabase",aud:"authenticated",role:"authenticated",sub,iat:now-7200,exp:now-3600}),input=h+"."+p;return input+"."+createHmac("sha256",secret).update(input).digest("base64url");}
async function get(path,token){const r=await fetch(base+path,{headers:token?{Authorization:"Bearer "+token}:{}});httpTranscript.push({method:"GET",path,status:r.status,body:(await r.clone().text()).slice(0,1000)});return r;}
async function sql(q){const {execFileSync}=await import("node:child_process");return execFileSync("psql",[DB,"-X","-v","ON_ERROR_STOP=1","-Atc",q],{encoding:"utf8"}).trim();}
async function makeOwner(label){
 const email="ch4-route-"+label+"-"+randomUUID()+"@example.test",password="Route-"+randomUUID()+"Aa!",r=await fetch(API+"/auth/v1/admin/users",{method:"POST",headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE,"Content-Type":"application/json"},body:JSON.stringify({email,password,email_confirm:true})});assert.equal(r.status,200);const user=await r.json();
 cleanupContext.after(async()=>{let ds=null,body="",gs=null,exists=null;try{const d=await fetch(API+"/auth/v1/admin/users/"+user.id,{method:"DELETE",headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE}});ds=d.status;body=(await d.text()).slice(0,500);const g=await fetch(API+"/auth/v1/admin/users/"+user.id,{headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE}});gs=g.status;exists=gs===200;console.log("CH4_ROUTE_CLEANUP="+JSON.stringify({deleteStatus:ds,deleteBody:body,verifyStatus:gs,exists}));const verified=gs===404&&exists===false;cleanupEvidence.push({userId:user.id,deleteStatus:ds,deleteBody:body,verifyStatus:gs,exists,deletionStatus:verified?"VERIFIED":"NOT_VERIFIED_STACK_DISPOSAL_REQUIRED"});await saveEvidence("cleanup-route-users.json",cleanupEvidence);}catch(e){cleanupEvidence.push({userId:user.id,deleteStatus:ds,deleteBody:body,verifyStatus:gs,exists,error:String(e),deletionStatus:"NOT_VERIFIED_STACK_DISPOSAL_REQUIRED"});await saveEvidence("cleanup-route-users.json",cleanupEvidence);}});
 const sr=await fetch(API+"/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:ANON,"Content-Type":"application/json"},body:JSON.stringify({email,password})});assert.equal(sr.status,200);return {user,token:(await sr.json()).access_token};
}
async function rest(table,token,method="GET",body){const h={apikey:ANON,Authorization:"Bearer "+token};if(body){h["Content-Type"]="application/json";h.Prefer="return=representation";}return fetch(API+"/rest/v1/"+table,{method,headers:h,body:body?JSON.stringify(body):undefined});}
const base="http://127.0.0.1:3000";
test("actual Next.js invoice history/detail routes with two real tenant JWTs and fixtures",async t=>{
 cleanupContext=t;const a=await makeOwner("a"),b=await makeOwner("b");
 const shopA=randomUUID(),shopB=randomUUID(),invA=randomUUID(),invB=randomUUID();
 await sql(`insert into public.shops(id,user_id,shop_name,shop_type,address,phone) values('${shopA}','${a.user.id}','Route A','food','Address A','01000000111'),('${shopB}','${b.user.id}','Route B','food','Address B','01000000222');
 insert into public.invoice_counters(shop_id,next_number) values('${shopA}',2),('${shopB}',2);
 insert into public.invoices(id,shop_id,bill_number,created_by,shop_name_snapshot,shop_address_snapshot,shop_phone_snapshot,total_amount,line_count,idempotency_namespace,request_id,payload_hash,integrity_hash)
 values('${invA}','${shopA}',1,'${a.user.id}','Route A','Address A','01000000111',12,1,'ch4-route','${randomUUID()}',decode(repeat('55',32),'hex'),decode(repeat('66',32),'hex')),('${invB}','${shopB}',1,'${b.user.id}','Route B','Address B','01000000222',18,1,'ch4-route','${randomUUID()}',decode(repeat('77',32),'hex'),decode(repeat('88',32),'hex'));
 insert into public.invoice_lines(invoice_id,shop_id,line_no,item_name_snapshot,quantity,unit_price,line_total) values('${invA}','${shopA}',1,'Route A item',1,12,12),('${invB}','${shopB}',1,'Route B item',1,18,18);`);
 const histA=await get("/api/invoices?shopId="+shopA,a.token),bodyA=await histA.json();assert.equal(histA.status,200);assert.equal(bodyA.invoices.length,1);assert.equal(bodyA.invoices[0].id,invA);assert.equal(bodyA.invoices[0].currency,"BDT");assert.equal(bodyA.invoices[0].lines.length,1);assert.ok(histA.headers.get("cache-control")?.includes("no-store"));
 const histB=await get("/api/invoices?shopId="+shopB,b.token),bodyB=await histB.json();assert.equal(histB.status,200);assert.deepEqual(bodyB.invoices.map(x=>x.id),[invB]);
 const crossHistory=await get("/api/invoices?shopId="+shopB,a.token);assert.equal(crossHistory.status,200);assert.deepEqual((await crossHistory.json()).invoices,[]);
 const detailA=await get("/api/invoices/"+invA+"?shopId="+shopA,a.token),da=await detailA.json();assert.equal(detailA.status,200);assert.equal(da.invoice.id,invA);assert.equal(da.invoice.lines[0].itemName,"Route A item");
 const detailB=await get("/api/invoices/"+invB+"?shopId="+shopB,b.token),db=await detailB.json();assert.equal(detailB.status,200);assert.equal(db.invoice.id,invB);
 const crossDetail=await get("/api/invoices/"+invB+"?shopId="+shopB,a.token);assert.equal(crossDetail.status,404);assert.deepEqual(await crossDetail.json(),{error:{code:"INVOICE_NOT_FOUND"}});
 const missing=await get("/api/invoices?shopId="+shopA);assert.equal(missing.status,401);
 const invalid=await get("/api/invoices?shopId="+shopA,"not.a.jwt");assert.equal(invalid.status,401);
 const expired=await get("/api/invoices?shopId="+shopA,jwtExpired(a.user.id));assert.equal(expired.status,401);
 const malformed=await get("/api/invoices/not-a-uuid?shopId="+shopA,a.token);assert.equal(malformed.status,400);
 const absent=await get("/api/invoices/"+randomUUID()+"?shopId="+shopA,a.token);assert.equal(absent.status,404);assert.deepEqual(await absent.json(),{error:{code:"INVOICE_NOT_FOUND"}});
 const wrongShop=await get("/api/invoices/"+invA+"?shopId="+shopB,a.token);assert.equal(wrongShop.status,404);
 const badShop=await get("/api/invoices?shopId=bad",a.token);assert.equal(badShop.status,400);
 const routeEvidence={ownerAHistory:histA.status,ownerBHistory:histB.status,ownerADetail:detailA.status,ownerBDetail:detailB.status,crossOwnerHistory:crossHistory.status,crossOwnerDetail:crossDetail.status,missingBearer:missing.status,invalidBearer:invalid.status,expiredBearer:expired.status,malformedUuid:malformed.status,notFound:absent.status,wrongShop:wrongShop.status,historyDtoKeys:Object.keys(bodyA.invoices[0]),detailDtoKeys:Object.keys(da.invoice)}; await saveEvidence("route-evidence.json",routeEvidence); await saveEvidence("http-transcript-routes.json",httpTranscript); console.log("CH4_ROUTE_EVIDENCE="+JSON.stringify(routeEvidence));
});
