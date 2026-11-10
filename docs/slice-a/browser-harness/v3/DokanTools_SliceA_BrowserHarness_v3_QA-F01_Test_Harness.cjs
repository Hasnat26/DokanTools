const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('/mnt/data/DokanTools_SliceA_BrowserHarness_v3.html','utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
class El {
  constructor(id){ this.id=id; this.value=''; this.textContent=''; this.className=''; this.hidden=false; this.listeners={}; this.attrs={}; }
  addEventListener(type,fn){ (this.listeners[type] ||= []).push(fn); }
  click(){ for(const fn of this.listeners.click||[]) fn({preventDefault(){},key:''}); }
  submit(){ for(const fn of this.listeners.submit||[]) fn({preventDefault(){}}); }
  focus(){ this.focused=true; }
}
function env(initialStorage=null, initialReadQueue=[]) {
  const els = Object.fromEntries([...new Set(ids)].map(id=>[id,new El(id)]));
  const docListeners={};
  const document={
    getElementById(id){ if(!els[id]) els[id]=new El(id); return els[id]; },
    addEventListener(type,fn){ (docListeners[type] ||= []).push(fn); },
    contains(){return true;}
  };
  let stored=initialStorage;
  const reads=[...initialReadQueue];
  const writes=[];
  const localStorage={
    getItem(){ if(reads.length){ const v=reads.shift(); if(v instanceof Error) throw v; if(v==='__USE_STORAGE__') return stored; return v; } return stored; },
    setItem(k,v){ writes.push([k,v]); stored=v; },
    get stored(){return stored;}, set stored(v){stored=v;},
    queue(...v){reads.push(...v);}
  };
  const window={localStorage};
  vm.runInNewContext(script,{window,document,Date,JSON,Object,Array,String,RegExp,Error});
  return {els,localStorage,writes,document};
}
const KEY='dokantools.sliceA.browserHarness.shopProfile.v1';
const saved={id:'primary',shopName:'Saved Shop',address:'Saved Address',mobileNumber:'01712345678',updatedAt:'2026-11-01T00:00:00.000Z'};
const savedRaw=JSON.stringify(saved);
const draft={shopName:'Draft Shop',address:'Draft Address',mobileNumber:'01812345678'};
function assert(c,m){if(!c) throw new Error(m);}
function fill(e,d){e.shopName.value=d.shopName;e.address.value=d.address;e.mobileNumber.value=d.mobileNumber;}
function submit(e){e.profileForm.submit();}
function startDraftScenario(){
  const x=env(null,[new Error('read denied')]);
  assert(!x.els.loadFailureState.hidden,'initial failure visible');
  x.localStorage.queue(null); x.els.retryLoadButton.click();
  x.els.createProfileButton.click(); fill(x.els,draft);
  x.localStorage.queue(new Error('save-time read failure')); submit(x.els);
  assert(!x.els.loadFailureState.hidden,'save-time read failure visible');
  return x;
}
let passed=[];
// T01 valid profile Retry produces conflict, retains both, no writes.
{
 const x=startDraftScenario(); x.localStorage.stored=savedRaw; x.localStorage.queue('__USE_STORAGE__'); x.els.retryLoadButton.click();
 assert(!x.els.recoveryConflictState.hidden,'conflict visible');
 assert(x.els.conflictSavedShopName.textContent===saved.shopName,'saved profile shown');
 assert(x.els.conflictDraftShopName.textContent===draft.shopName,'draft shown');
 assert(x.writes.length===0,'no storage write on retry');
 passed.push('T01 valid-profile Retry: separate conflict view; no write');
}
// T02 explicit Review is read-only; explicit second confirmation is required for update.
{
 const x=startDraftScenario(); x.localStorage.stored=savedRaw; x.localStorage.queue('__USE_STORAGE__'); x.els.retryLoadButton.click();
 x.els.reviewPendingDraftButton.click();
 assert(x.els.shopName.value===draft.shopName,'review loads draft');
 assert(x.writes.length===0,'review does not save');
 x.els.shopName.value='Draft Shop Revised'; x.localStorage.queue('__USE_STORAGE__'); submit(x.els);
 assert(!x.els.updateConfirmBackdrop.hidden,'separate update confirmation displayed');
 assert(x.writes.length===0,'submit only stages update');
 assert(x.localStorage.stored===savedRaw,'saved profile unchanged before confirmation');
 x.els.keepDraftButton.click();
 assert(x.writes.length===0,'keep draft is non-writing');
 assert(x.els.shopName.value==='Draft Shop Revised','latest reviewed value retained');
 x.localStorage.queue('__USE_STORAGE__'); submit(x.els);
 x.localStorage.queue('__USE_STORAGE__'); x.els.confirmUpdateButton.click();
 const updated=JSON.parse(x.localStorage.stored);
 assert(updated.shopName==='Draft Shop Revised','confirmed update uses reviewed draft');
 assert(updated.id==='primary','singleton id preserved');
 assert(x.writes.length===1,'exactly one confirmed write');
 passed.push('T02 Review is read-only; explicit confirmation alone updates saved profile');
}
// T03 explicit Discard returns to saved profile without writing.
{
 const x=startDraftScenario(); x.localStorage.stored=savedRaw; x.localStorage.queue('__USE_STORAGE__'); x.els.retryLoadButton.click();
 x.els.discardPendingDraftButton.click();
 assert(x.els.profileCard.hidden===false,'saved profile displayed after discard');
 assert(x.els.recoveryConflictState.hidden,'conflict dismissed');
 assert(x.els.savedShopName.textContent===saved.shopName,'saved values unchanged');
 assert(x.writes.length===0,'discard does not write storage');
 passed.push('T03 explicit Discard Draft returns to saved profile without modifying storage');
}
// T04 empty storage Retry restores pending draft; explicit save creates profile.
{
 const x=startDraftScenario(); x.localStorage.stored=null; x.localStorage.queue('__USE_STORAGE__'); x.els.retryLoadButton.click();
 assert(!x.els.formCard.hidden,'draft form restored');
 assert(x.els.shopName.value===draft.shopName,'draft value restored');
 assert(x.writes.length===0,'empty retry does not save');
 x.els.address.value='Edited while restored'; x.localStorage.queue('__USE_STORAGE__'); submit(x.els);
 assert(JSON.parse(x.localStorage.stored).address==='Edited while restored','explicit save creates current form values');
 assert(x.writes.length===1,'one explicit create write');
 passed.push('T04 empty-storage Retry restores draft; explicit save creates it');
}
// T05 repeated read failures do not lose draft; valid profile after failures shows conflict.
{
 const x=startDraftScenario();
 x.localStorage.queue(new Error('retry fail 1')); x.els.retryLoadButton.click();
 x.localStorage.queue(new Error('retry fail 2')); x.els.retryLoadButton.click();
 x.localStorage.stored=savedRaw; x.localStorage.queue('__USE_STORAGE__'); x.els.retryLoadButton.click();
 assert(x.els.conflictDraftShopName.textContent===draft.shopName,'draft survives repeated failures');
 assert(x.els.conflictSavedShopName.textContent===saved.shopName,'saved profile remains');
 assert(x.writes.length===0,'retries do not write');
 passed.push('T05 repeated read failures and Retry attempts preserve draft');
}
// T06 failure during draft review captures latest edits and recovers to conflict.
{
 const x=startDraftScenario(); x.localStorage.stored=savedRaw; x.localStorage.queue('__USE_STORAGE__'); x.els.retryLoadButton.click();
 x.els.reviewPendingDraftButton.click(); x.els.shopName.value='Latest unsaved edit';
 x.localStorage.queue(new Error('review-time read failure')); submit(x.els);
 assert(!x.els.loadFailureState.hidden,'review-time failure visible');
 x.localStorage.queue(new Error('retry read failure')); x.els.retryLoadButton.click();
 x.localStorage.queue('__USE_STORAGE__'); x.els.retryLoadButton.click();
 assert(x.els.conflictDraftShopName.textContent==='Latest unsaved edit','latest draft survives failure/retry');
 assert(x.writes.length===0,'no update on failure/retry');
 passed.push('T06 review-time read failure captures latest edits through Retry');
}
// T07 read failure at final confirmation preserves draft and saved profile.
{
 const x=startDraftScenario(); x.localStorage.stored=savedRaw; x.localStorage.queue('__USE_STORAGE__'); x.els.retryLoadButton.click();
 x.els.reviewPendingDraftButton.click(); x.els.shopName.value='Confirm pending'; x.localStorage.queue('__USE_STORAGE__'); submit(x.els);
 x.localStorage.queue(new Error('confirm read failure')); x.els.confirmUpdateButton.click();
 assert(!x.els.loadFailureState.hidden,'confirmation read failure visible');
 assert(x.localStorage.stored===savedRaw,'saved profile unchanged');
 x.localStorage.queue('__USE_STORAGE__'); x.els.retryLoadButton.click();
 assert(x.els.conflictDraftShopName.textContent==='Confirm pending','draft retained after confirm read failure');
 assert(x.writes.length===0,'no write on failed confirmation');
 passed.push('T07 confirmation read failure preserves saved profile and draft');
}
// T08 no choice leaves both versions visible and unchanged.
{
 const x=startDraftScenario(); x.localStorage.stored=savedRaw; x.localStorage.queue('__USE_STORAGE__'); x.els.retryLoadButton.click();
 const before=x.localStorage.stored;
 assert(!x.els.recoveryConflictState.hidden,'conflict remains pending user choice');
 assert(x.els.conflictDraftShopName.textContent===draft.shopName,'draft still visible');
 assert(x.localStorage.stored===before && x.writes.length===0,'no action means no mutation');
 passed.push('T08 taking neither recovery action preserves both versions');
}
// T09 concurrent saved-profile change blocks confirmation and refreshes conflict.
{
 const x=startDraftScenario(); x.localStorage.stored=savedRaw; x.localStorage.queue('__USE_STORAGE__'); x.els.retryLoadButton.click();
 x.els.reviewPendingDraftButton.click(); x.localStorage.queue('__USE_STORAGE__'); submit(x.els);
 const changed={...saved,shopName:'Externally Changed'}; x.localStorage.stored=JSON.stringify(changed); x.localStorage.queue('__USE_STORAGE__'); x.els.confirmUpdateButton.click();
 assert(x.els.conflictSavedShopName.textContent==='Externally Changed','new saved snapshot displayed');
 assert(x.els.conflictDraftShopName.textContent===draft.shopName,'draft retained');
 assert(x.localStorage.stored===JSON.stringify(changed),'external saved profile not overwritten');
 assert(x.writes.length===0,'stale confirmation does not write');
 passed.push('T09 stale saved-profile snapshot blocks update confirmation');
}
console.log(JSON.stringify({passed:passed.length,total:9,tests:passed},null,2));