const minor=(n)=>Math.round((n+Number.EPSILON)*100);
export function calculateDraftMemo(lines){
 if(!Array.isArray(lines)||!lines.length)return{valid:false,reason:"EMPTY_DRAFT",lineTotals:[],totalMinor:0};
 const lineTotals=[];let totalMinor=0;
 for(const l of lines){
  if(!l||typeof l.product_id!=="string"||!l.product_id||typeof l.item_name!=="string"||!l.item_name.trim())return{valid:false,reason:"INVALID_PRODUCT",lineTotals:[],totalMinor:0};
  const q=String(l.quantity??"").trim(),p=String(l.unit_price??"").trim();
  if(!/^[0-9]+(?:\.[0-9]{1,3})?$/.test(q)||!/^[0-9]+(?:\.[0-9]{1,2})?$/.test(p))return{valid:false,reason:"INVALID_INPUT",lineTotals:[],totalMinor:0};
  const qty=Number(q),price=Number(p);if(!Number.isFinite(qty)||qty<=0||!Number.isFinite(price)||price<0)return{valid:false,reason:"INVALID_INPUT",lineTotals:[],totalMinor:0};
  const amt=minor(qty*price);if(!Number.isSafeInteger(amt)||amt<0)return{valid:false,reason:"LINE_OVERFLOW",lineTotals:[],totalMinor:0};
  lineTotals.push(amt);totalMinor+=amt;if(!Number.isSafeInteger(totalMinor))return{valid:false,reason:"TOTAL_OVERFLOW",lineTotals:[],totalMinor:0};
 }
 return{valid:true,reason:null,lineTotals,totalMinor};
}
export function draftMemoStorageKey(owner,shop,id){if(![owner,shop,id].every(v=>typeof v==="string"&&v.trim()))throw new Error("DRAFT_IDENTITY_REQUIRED");return[owner,shop,id].map(encodeURIComponent).join("::");}
export function validateDraftMemoIdentity(d,owner,shop,id=d?.id){if(!d||d.owner_id!==owner||d.shop_id!==shop||d.id!==id)throw new Error("DRAFT_IDENTITY_MISMATCH");return true;}
export function validateA6MemoFit(shop,lines){if(!shop?.shop_name||!Array.isArray(lines))return{valid:false,reason:"MISSING_CONTENT"};const estimate=8+lines.length*2;return estimate<=20?{valid:true,estimatedRows:estimate}:{valid:false,reason:"A6_CONTENT_OVERFLOW",estimatedRows:estimate};}
