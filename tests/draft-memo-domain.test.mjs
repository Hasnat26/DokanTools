import test from "node:test";
import assert from "node:assert/strict";
import { calculateDraftMemo, draftMemoStorageKey, validateDraftMemoIdentity, validateA6MemoFit } from "../src/lib/draft-memo-domain.mjs";
const line=(id,q,p)=>({product_id:id,item_name:`Item ${id}`,unit:"pcs",quantity:String(q),unit_price:String(p)});
test("multiple product subtotal and line totals use decimal-safe minor units",()=>{
 const r=calculateDraftMemo([line("p1","2","12.50"),line("p2","1.5","4.00")]);
 assert.equal(r.valid,true);assert.deepEqual(r.lineTotals,[2500,600]);assert.equal(r.subtotalMinor,3100);assert.equal(r.grandTotalMinor,3100);
});
test("discount, tax, paid and due calculation",()=>{
 const r=calculateDraftMemo([line("p1","2","10.00"),line("p2","1.5","4.00")],{discountEnabled:true,discountAmount:"2.00",taxEnabled:true,taxRate:"10.00",paidEnabled:true,paidAmount:"10.00"});
 assert.equal(r.valid,true);assert.equal(r.subtotalMinor,2600);assert.equal(r.discountMinor,200);assert.equal(r.taxableMinor,2400);assert.equal(r.taxMinor,240);assert.equal(r.grandTotalMinor,2640);assert.equal(r.paidMinor,1000);assert.equal(r.dueMinor,1640);
});
test("disabled optional fields do not affect payable total",()=>{
 const r=calculateDraftMemo([line("p1",2,10)],{discountEnabled:false,discountAmount:"99.99",taxEnabled:false,taxRate:"99.00",paidEnabled:false,paidAmount:"99.99"});
 assert.equal(r.valid,true);assert.equal(r.subtotalMinor,2000);assert.equal(r.discountMinor,0);assert.equal(r.taxMinor,0);assert.equal(r.paidMinor,0);assert.equal(r.grandTotalMinor,2000);assert.equal(r.dueMinor,2000);
});
test("zero discount and zero tax are valid",()=>{
 const r=calculateDraftMemo([line("p1",1,10)],{discountEnabled:true,discountAmount:"0.00",taxEnabled:true,taxRate:"0.00",paidEnabled:true,paidAmount:"0.00"});
 assert.equal(r.valid,true);assert.equal(r.discountMinor,0);assert.equal(r.taxMinor,0);assert.equal(r.dueMinor,1000);
});
test("quantity must be positive and precision is limited to 3 decimals",()=>{
 for(const q of ["0","-1","0.000","1.0001","abc",""])assert.equal(calculateDraftMemo([line("p",q,"1.00")]).valid,false,q);
});
test("unit price cannot be negative and accepts at most 2 decimals",()=>{
 for(const p of ["-0.01","1.999","abc",""])assert.equal(calculateDraftMemo([line("p","1",p)]).valid,false,p);
 assert.equal(calculateDraftMemo([line("p","1","0.00")]).valid,true);
});
test("discount cannot exceed subtotal or consume the full subtotal",()=>{
 assert.equal(calculateDraftMemo([line("p","1","10.00")],{discountEnabled:true,discountAmount:"10.01"}).reason,"DISCOUNT_EXCEEDS_SUBTOTAL");
 assert.equal(calculateDraftMemo([line("p","1","10.00")],{discountEnabled:true,discountAmount:"10.00"}).reason,"DISCOUNT_MUST_BE_LESS_THAN_SUBTOTAL");
});
test("negative or malformed discount is rejected",()=>{
 for(const value of ["-0.01","abc","1.999"])assert.equal(calculateDraftMemo([line("p",1,10)],{discountEnabled:true,discountAmount:value}).valid,false,value);
});
test("negative or malformed tax rate is rejected",()=>{
 for(const value of ["-1","abc","1.999"])assert.equal(calculateDraftMemo([line("p",1,10)],{taxEnabled:true,taxRate:value}).valid,false,value);
});
test("paid amount cannot be negative or exceed grand total",()=>{
 assert.equal(calculateDraftMemo([line("p",1,10)],{paidEnabled:true,paidAmount:"-0.01"}).reason,"INVALID_PAID_AMOUNT");
 assert.equal(calculateDraftMemo([line("p",1,10)],{paidEnabled:true,paidAmount:"10.01"}).reason,"PAID_EXCEEDS_GRAND_TOTAL");
});
test("half-up rounding is deterministic for quantity times unit price",()=>{
 const r=calculateDraftMemo([line("p","1.005","0.05")]);assert.equal(r.valid,true);assert.equal(r.lineTotals[0],5);
});
test("empty product list and invalid product identity are rejected",()=>{
 assert.equal(calculateDraftMemo([]).reason,"EMPTY_DRAFT");assert.equal(calculateDraftMemo([{...line("p",1,1),product_id:""}]).reason,"INVALID_PRODUCT");
});
test("composite draft key isolates owner and shop",()=>{
 assert.notEqual(draftMemoStorageKey("u1","s1","d1"),draftMemoStorageKey("u2","s1","d1"));assert.notEqual(draftMemoStorageKey("u1","s1","d1"),draftMemoStorageKey("u1","s2","d1"));
});
test("draft identity mismatch is rejected",()=>{
 assert.throws(()=>validateDraftMemoIdentity({id:"d",owner_id:"u2",shop_id:"s1"},"u1","s1"),/DRAFT_IDENTITY_MISMATCH/);assert.throws(()=>validateDraftMemoIdentity({id:"d",owner_id:"u1",shop_id:"s2"},"u1","s1"),/DRAFT_IDENTITY_MISMATCH/);
});
test("A6 fit guard rejects excessive line counts",()=>{
 assert.equal(validateA6MemoFit({shop_name:"Shop"},[line("p",1,1)]).valid,true);assert.equal(validateA6MemoFit({shop_name:"Shop"},Array(7).fill(line("p",1,1))).valid,false);
});
