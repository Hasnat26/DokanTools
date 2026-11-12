import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const API=process.env.SUPABASE_URL, ANON=process.env.SUPABASE_ANON_KEY, SERVICE=process.env.SUPABASE_SERVICE_ROLE_KEY, DB=process.env.SUPABASE_DB_URL;
const pw="Ch4-"+randomUUID()+"-Aa9!", created=[];
async function adminUser(label){
 const email="ch4-"+label+"-"+randomUUID()+"@example.test";
 const r=await fetch(API+"/auth/v1/admin/users",{method:"POST",headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE,"Content-Type":"application/json"},body:JSON.stringify({email,password:pw,email_confirm:true})});
 assert.equal(r.status,200);const u=await r.json();created.push(u.id);return {id:u.id,email,password:pw};
}
async function token(u){const r=await fetch(API+"/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:ANON,"Content-Type":"application/json"},body:JSON.stringify({email:u.email,password:u.password})});assert.equal(r.status,200);return (await r.json()).access_token;}
async function sql(q){const {execFileSync}=await import("node:child_process");return execFileSync("psql",[DB,"-X","-v","ON_ERROR_STOP=1","-Atc",q],{encoding:"utf8"}).trim();}
async function rest(path,tok,method="GET",body){const h={apikey:ANON,Authorization:"Bearer "+tok};if(body){h["Content-Type"]="application/json";h.Prefer="return=representation";}return fetch(API+"/rest/v1/"+path,{method,headers:h,body:body?JSON.stringify(body):undefined});}
test("real PostgREST owner mapping, invoice and line RLS, cross-tenant reads and mutation denial",async t=>{
 assert.ok(DB&&API&&ANON&&SERVICE);const a=await adminUser("a"),b=await adminUser("b"),[ta,tb]=await Promise.all([token(a),token(b)]);
 const shopA=randomUUID(),shopB=randomUUID(),invoiceA=randomUUID(),invoiceB=randomUUID(),lineA=randomUUID(),lineB=randomUUID();
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
 // Immutable invoice facts remain untouched. The workflow destroys the disposable local DB
 // and Supabase containers unconditionally with "supabase stop --no-backup".
 t.after(async()=>{for(const id of created){const r=await fetch(API+"/auth/v1/admin/users/"+id,{method:"DELETE",headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE}});assert.ok([200,204,404].includes(r.status),"GoTrue fixture-user cleanup failed");}});
 const aRows=await rest("invoices?select=id,shop_id&order=id",ta), bRows=await rest("invoices?select=id,shop_id&order=id",tb);
 assert.equal(aRows.status,200);assert.equal(bRows.status,200);
 const ar=await aRows.json(),br=await bRows.json();assert.deepEqual(ar.map(x=>x.id),[invoiceA]);assert.deepEqual(br.map(x=>x.id),[invoiceB]);
 const crossA=await rest("invoices?select=id&id=eq."+invoiceB,ta),crossB=await rest("invoices?select=id&id=eq."+invoiceA,tb);
 assert.deepEqual(await crossA.json(),[]);assert.deepEqual(await crossB.json(),[]);
 const linesA=await rest("invoice_lines?select=invoice_id&order=invoice_id",ta),linesB=await rest("invoice_lines?select=invoice_id&order=invoice_id",tb);
 assert.deepEqual((await linesA.json()).map(x=>x.invoice_id),[invoiceA]);assert.deepEqual((await linesB.json()).map(x=>x.invoice_id),[invoiceB]);
 const anon=await fetch(API+"/rest/v1/invoices?select=id",{headers:{apikey:ANON}});assert.ok([401,403].includes(anon.status));
 const privateRead=await rest("invoice_counters?select=shop_id",ta);assert.ok([401,403].includes(privateRead.status));
 const before=await sql(`select (select count(*) from public.invoices where id in ('${invoiceA}','${invoiceB}'))||':'||(select count(*) from public.invoice_lines where invoice_id in ('${invoiceA}','${invoiceB}'))`);
 const attempts=await Promise.all([rest("invoices?id=eq."+invoiceA,ta,"PATCH",{bill_number:99}),rest("invoice_lines?invoice_id=eq."+invoiceA,ta,"DELETE"),rest("invoices",ta,"POST",{id:randomUUID(),shop_id:shopA})]);
 assert.ok(attempts.every(x=>[401,403,404].includes(x.status)));
 const after=await sql(`select (select count(*) from public.invoices where id in ('${invoiceA}','${invoiceB}'))||':'||(select count(*) from public.invoice_lines where invoice_id in ('${invoiceA}','${invoiceB}'))`);
 assert.equal(after,before,"mutation-denial must leave DB fixture counts unchanged");
});
