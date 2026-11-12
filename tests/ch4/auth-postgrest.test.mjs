import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHmac } from "node:crypto";

const API=process.env.SUPABASE_URL, ANON=process.env.SUPABASE_ANON_KEY, SERVICE=process.env.SUPABASE_SERVICE_ROLE_KEY;
const pw="Ch4-"+randomUUID()+"-Aa9!";
let cleanupContext;
const cleanupEvidence=[];
const httpTranscript=[];
const evidenceDir=process.env.CH4_EVIDENCE_DIR||"artifacts/ch4";
async function saveEvidence(name,value){const fs=await import("node:fs");fs.mkdirSync(evidenceDir,{recursive:true});fs.writeFileSync(evidenceDir+"/"+name,JSON.stringify(value,null,2)+"\n");}
function redact(s){return String(s).replace(/("(?:access_token|refresh_token|password|service_role_key|apikey)"\s*:\s*")[^"]*"/gi,'$1[REDACTED]"').replace(/eyJ[A-Za-z0-9._-]+/g,"[JWT]").replace(/sb_secret_[A-Za-z0-9_-]+/g,"[SECRET]").slice(0,1000);}
async function req(path,{method="GET",token,body,headers={}}={}){const h={apikey:ANON,...headers};if(token)h.Authorization="Bearer "+token;if(body!==undefined)h["Content-Type"]="application/json";const r=await fetch(API+path,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body)});httpTranscript.push({method,path,status:r.status,body:redact(await r.clone().text())});return r;}
async function createUser(label){
 const email="ch4-"+label+"-"+randomUUID()+"@example.test";
 const r=await fetch(API+"/auth/v1/admin/users",{method:"POST",headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE,"Content-Type":"application/json"},body:JSON.stringify({email,password:pw,email_confirm:true})});
 assert.equal(r.status,200,"GoTrue admin user creation must succeed");const u=await r.json();
 cleanupContext.after(async()=>{let ds=null,db="",gs=null,exists=null;try{const d=await fetch(API+"/auth/v1/admin/users/"+u.id,{method:"DELETE",headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE}});ds=d.status;db=redact(await d.text());const g=await fetch(API+"/auth/v1/admin/users/"+u.id,{headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE}});gs=g.status;exists=g.status===200;console.log("CH4_AUTH_CLEANUP="+JSON.stringify({deleteStatus:ds,deleteBody:db,verifyStatus:gs,exists}));const verified=gs===404&&exists===false;cleanupEvidence.push({userId:u.id,deleteStatus:ds,deleteBody:db,verifyStatus:gs,exists,deletionStatus:verified?"VERIFIED":"NOT_VERIFIED_STACK_DISPOSAL_REQUIRED"});await saveEvidence("cleanup-auth-users.json",cleanupEvidence);}catch(e){cleanupEvidence.push({userId:u.id,deleteStatus:ds,deleteBody:db,verifyStatus:gs,exists,error:String(e),deletionStatus:"NOT_VERIFIED_STACK_DISPOSAL_REQUIRED"});await saveEvidence("cleanup-auth-users.json",cleanupEvidence);}});
 return {id:u.id,email,password:pw};
}
async function signin(u){const r=await req("/auth/v1/token?grant_type=password",{method:"POST",body:{email:u.email,password:u.password}});assert.equal(r.status,200);const j=await r.json();assert.ok(j.access_token&&j.access_token.split(".").length===3);assert.ok(j.refresh_token);return {access:j.access_token,refresh:j.refresh_token};}
function expiredToken(secret,subject){
 const b64=x=>Buffer.from(JSON.stringify(x)).toString("base64url");
 const head=b64({alg:"HS256",typ:"JWT"}), now=Math.floor(Date.now()/1000);
 const payload=b64({iss:"supabase",aud:"authenticated",role:"authenticated",sub:subject,iat:now-7200,exp:now-3600});
 const input=head+"."+payload, sig=createHmac("sha256",secret).update(input).digest("base64url");return input+"."+sig;
}
test("real GoTrue identities, JWT rejection, logout and account switch",async t=>{
 cleanupContext=t;assert.ok(API&&ANON&&SERVICE);assert.match(API,/^http:\/\/127\.0\.0\.1:54321$/);
 const a=await createUser("auth-a"),b=await createUser("auth-b"),[sa,sb]=await Promise.all([signin(a),signin(b)]);
 const ta=sa.access,tb=sb.access;
 const ua=await req("/auth/v1/user",{token:ta}),ub=await req("/auth/v1/user",{token:tb});
 assert.equal(ua.status,200);assert.equal((await ua.json()).id,a.id);assert.equal(ub.status,200);assert.equal((await ub.json()).id,b.id);
 for(const [label,token] of [["malformed","not.a.jwt"],["invalid-signature",ta.slice(0,-3)+"xyz"]]){const x=await req("/auth/v1/user",{token});assert.ok([401,403].includes(x.status),label+" rejected");console.log("CH4_AUTH_NEGATIVE="+JSON.stringify({case:label,status:x.status,body:redact(await x.text())}));}
 const missing=await req("/auth/v1/user");assert.ok([401,403].includes(missing.status));
 const anon=await req("/rest/v1/invoices?select=id");assert.ok([401,403].includes(anon.status));
 const secret=process.env.CH4_LOCAL_JWT_SECRET;assert.ok(secret&&secret.length>=32,"local Supabase JWT signing secret is required for genuine expired JWT test");
 const expired=expiredToken(secret,a.id),ex=await req("/auth/v1/user",{token:expired});console.log("CH4_EXPIRED_JWT="+JSON.stringify({status:ex.status,body:redact(await ex.text()),expired:true,signedWithLocalConfig:true}));assert.ok([401,403].includes(ex.status),"genuinely expired JWT rejected");
 const switched=await req("/auth/v1/user",{token:tb});assert.equal((await switched.json()).id,b.id);
 const out=await req("/auth/v1/logout",{method:"POST",token:ta});assert.ok([200,204].includes(out.status));
 const refreshAfterLogout=await req("/auth/v1/token?grant_type=refresh_token",{method:"POST",body:{refresh_token:sa.refresh}});
 assert.ok([400,401,403].includes(refreshAfterLogout.status),"signed-out refresh token must be rejected");
 const accessAfterLogout=await req("/auth/v1/user",{token:ta});
 const authEvidence={ownerA:{userEndpointStatus:ua.status,identityVerified:true},ownerB:{userEndpointStatus:ub.status,identityVerified:true},malformedTokenRejected:true,invalidSignatureRejected:true,missingBearerStatus:missing.status,anonymousPostgrestStatus:anon.status,expiredJwt:{status:ex.status,expired:true,signedWithLocalConfig:true},logoutStatus:out.status,refreshAfterLogoutStatus:refreshAfterLogout.status,accessTokenAfterLogoutStatus:accessAfterLogout.status}; await saveEvidence("auth-evidence.json",authEvidence); await saveEvidence("http-transcript-auth.json",httpTranscript); console.log("CH4_SIGNOUT_EVIDENCE="+JSON.stringify({logoutStatus:out.status,refreshAfterLogoutStatus:refreshAfterLogout.status,accessTokenAfterLogoutStatus:accessAfterLogout.status}));
});
