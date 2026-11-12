import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const API=process.env.SUPABASE_URL,ANON=process.env.SUPABASE_ANON_KEY,SERVICE=process.env.SUPABASE_SERVICE_ROLE_KEY;
const created=[];
async function admin(){const email="ch4-route-"+randomUUID()+"@example.test",password="Route-"+randomUUID()+"Aa!";const r=await fetch(API+"/auth/v1/admin/users",{method:"POST",headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE,"Content-Type":"application/json"},body:JSON.stringify({email,password,email_confirm:true})});assert.equal(r.status,200);const u=await r.json();created.push(u.id);const s=await fetch(API+"/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:ANON,"Content-Type":"application/json"},body:JSON.stringify({email,password})});assert.equal(s.status,200);return {u,token:(await s.json()).access_token};}
test("Next.js invoice GET routes reject missing/invalid bearer and invalid UUID; cache no-store",async()=>{
 const {u,token}=await admin();
 try{
  const missing=await fetch("http://127.0.0.1:3000/api/invoices?shopId=00000000-0000-4000-8000-000000000001");assert.equal(missing.status,401);
  const invalid=await fetch("http://127.0.0.1:3000/api/invoices?shopId=00000000-0000-4000-8000-000000000001",{headers:{Authorization:"Bearer not.a.jwt"}});assert.equal(invalid.status,401);
  const detail=await fetch("http://127.0.0.1:3000/api/invoices/not-a-uuid?shopId=00000000-0000-4000-8000-000000000001",{headers:{Authorization:"Bearer "+token}});assert.equal(detail.status,400);
  assert.ok(detail.headers.get("cache-control")?.includes("no-store"));
  const hist=await fetch("http://127.0.0.1:3000/api/invoices?shopId=bad",{headers:{Authorization:"Bearer "+token}});assert.equal(hist.status,400);
 }finally{const d=await fetch(API+"/auth/v1/admin/users/"+u.id,{method:"DELETE",headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE}});assert.ok([200,204,404].includes(d.status),"route test owner cleanup failed");}
});
