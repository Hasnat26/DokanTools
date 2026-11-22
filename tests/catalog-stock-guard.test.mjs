import test from "node:test";
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
