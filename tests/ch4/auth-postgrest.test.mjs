import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const API=process.env.SUPABASE_URL, ANON=process.env.SUPABASE_ANON_KEY, SERVICE=process.env.SUPABASE_SERVICE_ROLE_KEY;
const pw="Ch4-"+randomUUID()+"-Aa9!";
const users=[];\nlet cleanupContext;
async function req(path, {method="GET",token,body,headers={}}={}) {
 const h={apikey:ANON,...headers}; if(token)h.Authorization="Bearer "+token;
 if(body!==undefined)h["Content-Type"]="application/json";
 return fetch(API+path,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body)});
}
async function createUser(label) {
 const email="ch4-"+label+"-"+randomUUID()+"@example.test";
 const r=await fetch(API+"/auth/v1/admin/users",{method:"POST",headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE,"Content-Type":"application/json"},body:JSON.stringify({email,password:pw,email_confirm:true})});
 assert.equal(r.status,200,"GoTrue admin user creation must succeed");
 const u=await r.json(); users.push(u.id);\n if(cleanupContext){cleanupContext.after(async()=>{const d=await fetch(API+"/auth/v1/admin/users/"+u.id,{method:"DELETE",headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE}});assert.ok([200,204,404].includes(d.status),"Owner cleanup failed");});}\n return {id:u.id,email,password:pw};
}
async function signin(u) {
 const r=await req("/auth/v1/token?grant_type=password",{method:"POST",body:{email:u.email,password:u.password}});
 assert.equal(r.status,200,"GoTrue password sign-in must succeed"); const j=await r.json();
 assert.ok(j.access_token && j.access_token.split(".").length===3); return j.access_token;
}
test("real GoTrue users, signed JWTs, token validation, signout and account switch",async t=>{
 cleanupContext=t;\n assert.ok(API&&ANON&&SERVICE); assert.match(API,/^http:\/\/127\.0\.0\.1:54321$/);
 const a=await createUser("a"), b=await createUser("b");
 const [ta,tb]=await Promise.all([signin(a),signin(b)]);
 const ua=await req("/auth/v1/user",{token:ta}), ub=await req("/auth/v1/user",{token:tb});
 assert.equal(ua.status,200); assert.equal((await ua.json()).id,a.id);
 assert.equal(ub.status,200); assert.equal((await ub.json()).id,b.id);
 for(const [label,token] of [["malformed","not.a.jwt"],["bad-signature",ta.slice(0,-3)+"xyz"]]){
  const x=await req("/auth/v1/user",{token}); assert.ok(x.status===401||x.status===403,label+" must reject token");
 }
 const noBearer=await req("/auth/v1/user"); assert.ok([401,403].includes(noBearer.status));
 const anon=await req("/rest/v1/invoices?select=id"); assert.ok([401,403].includes(anon.status));
 const switched=await req("/auth/v1/user",{token:tb}); assert.equal((await switched.json()).id,b.id);
 const out=await req("/auth/v1/logout",{method:"POST",token:ta}); assert.ok([200,204].includes(out.status));

});
