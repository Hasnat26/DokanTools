import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const API=process.env.SUPABASE_URL, ANON=process.env.SUPABASE_ANON_KEY, SERVICE=process.env.SUPABASE_SERVICE_ROLE_KEY, DB=process.env.SUPABASE_DB_URL;
const pw="Ch4-"+randomUUID()+"-Aa9!";
let cleanupContext;
const cleanupEvidence=[];
const httpTranscript=[];
const evidenceDir=process.env.CH4_EVIDENCE_DIR||"artifacts/ch4";
async function saveEvidence(name,value){const fs=await import("node:fs");fs.mkdirSync(evidenceDir,{recursive:true});fs.writeFileSync(evidenceDir+"/"+name,JSON.stringify(value,null,2)+"\n");}
async function adminUser(label){
 const email="ch4-"+label+"-"+randomUUID()+"@example.test";
 const r=await fetch(API+"/auth/v1/admin/users",{method:"POST",headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE,"Content-Type":"application/json"},body:JSON.stringify({email,password:pw,email_confirm:true})});
 assert.equal(r.status,200,"GoTrue admin user creation must succeed");const u=await r.json();
 if(cleanupContext){cleanupContext.after(async()=>{
   let responseStatus=null, responseBody="", verifyStatus=null, exists=null, networkError=null;
   try {
     const d=await fetch(API+"/auth/v1/admin/users/"+u.id,{method:"DELETE",headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE}});
     responseStatus=d.status;
     responseBody=(await d.text()).slice(0,1000);
     const g=await fetch(API+"/auth/v1/admin/users/"+u.id,{headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE}});
     verifyStatus=g.status;
     const body=await g.text();
     exists=g.status===200;
     if(g.status!==404 && g.status!==200) networkError="Admin GET returned unexpected status";
     cleanupEvidence.push({userId:u.id,deleteStatus:responseStatus,deleteBody:redact(responseBody),verifyStatus,exists});
     const deletionVerified=[200,204].includes(responseStatus) && exists===false || responseStatus===404 && exists===false;
     cleanupEvidence.push({userId:u.id,deletionVerified,disposition:deletionVerified?"VERIFIED":"NOT_VERIFIED_STACK_DISPOSAL_REQUIRED"}); await saveEvidence("cleanup-postgrest-users.json",cleanupEvidence);
   } catch(e) {
     cleanupEvidence.push({userId:u.id,deleteStatus:responseStatus,deleteBody:redact(responseBody),verifyStatus,exists,networkError:String(e),disposition:"NOT_VERIFIED_STACK_DISPOSAL_REQUIRED"}); await saveEvidence("cleanup-postgrest-users.json",cleanupEvidence);
   }
 });}
 return {id:u.id,email,password:pw};
}
function redact(s){return String(s).replace(/eyJ[A-Za-z0-9._-]+/g,"[JWT]").replace(/sb_secret_[A-Za-z0-9_-]+/g,"[SECRET]").slice(0,1000);}
async function token(u){const r=await fetch(API+"/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:ANON,"Content-Type":"application/json"},body:JSON.stringify({email:u.email,password:u.password})});assert.equal(r.status,200);return (await r.json()).access_token;}
async function sql(q){const {execFileSync}=await import("node:child_process");return execFileSync("psql",[DB,"-X","-v","ON_ERROR_STOP=1","-Atc",q],{encoding:"utf8"}).trim();}
async function rest(path,tok,method="GET",body){const h={apikey:ANON,Authorization:"Bearer "+tok};if(body){h["Content-Type"]="application/json";h.Prefer="return=representation";}const r=await fetch(API+"/rest/v1/"+path,{method,headers:h,body:body?JSON.stringify(body):undefined});httpTranscript.push({method,path,status:r.status,body:(await r.clone().text()).slice(0,800)});return r;}
test("real PostgREST owner mapping, invoice and line RLS, cross-tenant reads and mutation denial",async t=>{
 cleanupContext=t;
 assert.ok(DB&&API&&ANON&&SERVICE);const a=await adminUser("a"),b=await adminUser("b"),[ta,tb]=await Promise.all([token(a),token(b)]);
 const shopA=randomUUID(),shopB=randomUUID(),invoiceA=randomUUID(),invoiceB=randomUUID();
 const q=`insert into public.shops(id,user_id,shop_name,shop_type,address,phone) values
 ('${shopA}','${a.id}','CH4 A','food','A Address','01000000001'),
 ('${shopB}','${b.id}','CH4 B','food','B Address','01000000002');
 insert into public.invoice_counters(shop_id,next_number) values ('${shopA}',2),('${shopB}',2);
 insert into public.invoices(id,shop_id,bill_number,created_by,shop_name_snapshot,shop_address_snapshot,shop_phone_snapshot,total_amount,line_count,idempotency_namespace,request_id,payload_hash,integrity_hash)
 values ('${invoiceA}','${shopA}',1,'${a.id}','CH4 A','A Address','01000000001',10,1,'ch4-fixture','${randomUUID()}',decode(repeat('11',32),'hex'),decode(repeat('22',32),'hex')),
 ('${invoiceB}','${shopB}',1,'${b.id}','CH4 B','B Address','01000000002',20,1,'ch4-fixture','${randomUUID()}',decode(repeat('33',32),'hex'),decode(repeat('44',32),'hex'));
 insert into public.invoice_lines(invoice_id,shop_id,line_no,item_name_snapshot,quantity,unit_price,line_total)
 values ('${invoiceA}','${shopA}',1,'A fixture',1,10,10),('${invoiceB}','${shopB}',1,'B fixture',1,20,20);`;
 await sql(q);
 const aRows=await rest("invoices?select=id,shop_id&order=id",ta), bRows=await rest("invoices?select=id,shop_id&order=id",tb);
 assert.equal(aRows.status,200);assert.equal(bRows.status,200);
 const ar=await aRows.json(),br=await bRows.json();assert.deepEqual(ar.map(x=>x.id),[invoiceA]);assert.deepEqual(br.map(x=>x.id),[invoiceB]);
 const crossA=await rest("invoices?select=id&id=eq."+invoiceB,ta),crossB=await rest("invoices?select=id&id=eq."+invoiceA,tb);
 assert.deepEqual(await crossA.json(),[]);assert.deepEqual(await crossB.json(),[]);
 const linesA=await rest("invoice_lines?select=invoice_id&order=invoice_id",ta),linesB=await rest("invoice_lines?select=invoice_id&order=invoice_id",tb);
 assert.deepEqual((await linesA.json()).map(x=>x.invoice_id),[invoiceA]);assert.deepEqual((await linesB.json()).map(x=>x.invoice_id),[invoiceB]);
 const crossLinesA=await rest("invoice_lines?select=invoice_id&invoice_id=eq."+invoiceB,ta),crossLinesB=await rest("invoice_lines?select=invoice_id&invoice_id=eq."+invoiceA,tb);
 assert.deepEqual(await crossLinesA.json(),[]);assert.deepEqual(await crossLinesB.json(),[]);
 const anon=await fetch(API+"/rest/v1/invoices?select=id",{headers:{apikey:ANON}});assert.ok([401,403].includes(anon.status));
 const privateRead=await rest("invoice_counters?select=shop_id",ta);assert.ok([401,403].includes(privateRead.status));
 const mutationCases=[
  ["invoice INSERT",()=>rest("invoices",ta,"POST",{id:randomUUID(),shop_id:shopA})],
  ["invoice UPDATE",()=>rest("invoices?id=eq."+invoiceA,ta,"PATCH",{bill_number:99})],
  ["invoice DELETE",()=>rest("invoices?id=eq."+invoiceA,ta,"DELETE")],
  ["line INSERT",()=>rest("invoice_lines",ta,"POST",{invoice_id:invoiceA,shop_id:shopA,line_no:99,item_name_snapshot:"mutation",quantity:1,unit_price:1,line_total:1})],
  ["line UPDATE",()=>rest("invoice_lines?invoice_id=eq."+invoiceA,ta,"PATCH",{item_name_snapshot:"changed"})],
  ["line DELETE",()=>rest("invoice_lines?invoice_id=eq."+invoiceA,ta,"DELETE")]
 ];
 const before=await sql(`select (select count(*) from public.invoices where id in ('${invoiceA}','${invoiceB}'))||':'||(select count(*) from public.invoice_lines where invoice_id in ('${invoiceA}','${invoiceB}'))`);
 const mutationEvidence=[];
 for(const [name,fn] of mutationCases){
   const response=await fn(); const body=redact(await response.text());
   mutationEvidence.push({name,status:response.status,body});
   assert.equal(response.status,403,name+" must be denied by grants");
   const state=await sql(`select (select count(*) from public.invoices where id in ('${invoiceA}','${invoiceB}'))||':'||(select count(*) from public.invoice_lines where invoice_id in ('${invoiceA}','${invoiceB}'))`);
   assert.equal(state,before,name+" must not alter database fixtures");
 }
 const roleProbeOutput=await sql(`begin; set local role authenticated; set local request.jwt.claims='{"sub":"${a.id}","role":"authenticated"}'; select auth.uid(); rollback;`);
 const roleProbe=roleProbeOutput.split(/\\r?\\n/).find(x=>x===a.id);
 assert.equal(roleProbe,a.id,"auth.uid() must resolve Owner A authenticated JWT subject");
 const roleProbeBOutput=await sql(`begin; set local role authenticated; set local request.jwt.claims='{"sub":"${b.id}","role":"authenticated"}'; select auth.uid(); rollback;`);
 const roleProbeB=roleProbeBOutput.split(/\\r?\\n/).find(x=>x===b.id);
 assert.equal(roleProbeB,b.id,"auth.uid() must resolve Owner B authenticated JWT subject");
 const rpcAcl=await sql(`select has_function_privilege('anon','public.create_invoice_transaction(uuid,text,uuid,jsonb)','EXECUTE')::text||':'||exists(select 1 from pg_proc p,lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where p.oid='public.create_invoice_transaction(uuid,text,uuid,jsonb)'::regprocedure and a.grantee=0 and a.privilege_type='EXECUTE')::text||':'||has_function_privilege('authenticated','public.create_invoice_transaction(uuid,text,uuid,jsonb)','EXECUTE')::text`);
 assert.equal(rpcAcl,"false:false:true","invoice issue RPC ACL must deny anon/PUBLIC and grant authenticated; RPC is not invoked");
 const tenantEvidence={ownerA:{visibleInvoiceIds:[invoiceA],foreignInvoiceIds:[]},ownerB:{visibleInvoiceIds:[invoiceB],foreignInvoiceIds:[]},crossTenantDisclosures:0,crossLineDisclosures:0,mutationEvidence,before,after:await sql(`select (select count(*) from public.invoices where id in ('${invoiceA}','${invoiceB}'))||':'||(select count(*) from public.invoice_lines where invoice_id in ('${invoiceA}','${invoiceB}'))`),authUidSubjectA:roleProbe,authUidSubjectB:roleProbeB}; await saveEvidence("tenant-isolation.json",tenantEvidence); await saveEvidence("http-transcript-postgrest.json",httpTranscript); tenantEvidence.rpcAcl=rpcAcl; console.log("CH4_TENANT_EVIDENCE="+JSON.stringify(tenantEvidence));
});
