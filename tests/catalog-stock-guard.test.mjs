import test from "node:test";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { findInventoryLinkedProduct, inventoryLinkedProductMutationReason, inventoryLinkedProductDeletionBlocked } from "../src/lib/catalog-stock-guard.mjs";

const stock=[{id:"stock-1",name:"  QA Product ",unit:"pcs"}];
const baseline={name:"QA Product",unit:"pcs"};

test("inventory matching uses normalized product identity",()=>{
 assert.equal(findInventoryLinkedProduct(stock,"qa product").id,"stock-1");
 assert.equal(findInventoryLinkedProduct(stock,"Unrelated"),undefined);
});

test("inventory-linked product name and unit mutations are blocked but price edits are allowed",()=>{
 assert.equal(inventoryLinkedProductMutationReason(stock,baseline,{name:"Renamed",unit:"pcs"}),"NAME_CHANGE");
 assert.equal(inventoryLinkedProductMutationReason(stock,baseline,{name:"QA Product",unit:"kg"}),"UNIT_CHANGE");
 assert.equal(inventoryLinkedProductMutationReason(stock,baseline,{name:"QA Product",unit:"pcs",sale_price:18}),null);
});

test("inventory-linked catalogue deletion is blocked",()=>{
 assert.equal(inventoryLinkedProductDeletionBlocked(stock,"QA Product","QA Product"),true);
 assert.equal(inventoryLinkedProductDeletionBlocked(stock,"Other","Other"),false);
});

test("unit mutation compares against saved catalogue baseline, not divergent stock unit",()=>{
 const diverged=[{id:"stock-2",name:"QA Product",unit:"piece"}];
 assert.equal(inventoryLinkedProductMutationReason(diverged,{name:"QA Product",unit:"pcs"},{name:"QA Product",unit:"pcs"}),null);
 assert.equal(inventoryLinkedProductMutationReason(diverged,{name:"QA Product",unit:"pcs"},{name:"QA Product",unit:"kg"}),"UNIT_CHANGE");
});

test("stock screen enforces the tested saved-catalogue baseline guard", async()=>{
 const source=await readFile(new URL("../src/app/dashboard/stock/page.tsx",import.meta.url),"utf8");
 assert.match(source,/inventoryLinkedProductMutationReason\(items,baseline,p\)/);
});
