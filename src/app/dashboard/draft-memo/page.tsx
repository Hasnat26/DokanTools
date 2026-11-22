"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, Shop } from "@/lib/supabase";
import { calculateDraftMemo, type DraftMemoLine, type DraftMemoOptions } from "@/lib/draft-memo-domain.mjs";
import { saveDraftMemo, listDraftMemos, deleteDraftMemo, type DraftMemo } from "@/lib/draft-memo-store.mjs";
import QRCode from "qrcode";
import { generatedShopLogoDataUrl, getShopQrDestination, validateGoogleMapsUrl } from "@/lib/shop-branding.mjs";

type Product = { id:string; name:string; unit:string; sale_price:number; is_active:boolean };
type Line = DraftMemoLine;
type Options = Required<DraftMemoOptions>;
const DEFAULT_OPTIONS:Options={discountEnabled:false,discountAmount:"0.00",taxEnabled:false,taxRate:"0.00",paidEnabled:false,paidAmount:"0.00"};
const money=(minor:number)=>new Intl.NumberFormat("en-BD",{minimumFractionDigits:2,maximumFractionDigits:2}).format(minor/100);
const errorText:Record<string,string>={
 EMPTY_DRAFT:"Add at least one product.",
 INVALID_PRODUCT:"Select a valid catalogue product.",
 INVALID_QUANTITY:"Quantity must be greater than zero and use up to 3 decimal places.",
 INVALID_UNIT_PRICE:"Unit price must be zero or greater and use up to 2 decimal places.",
 INVALID_DISCOUNT:"Enter a non-negative discount with up to 2 decimal places.",
 DISCOUNT_EXCEEDS_SUBTOTAL:"Discount cannot exceed the subtotal.",
 DISCOUNT_MUST_BE_LESS_THAN_SUBTOTAL:"A full-subtotal discount is not permitted on this bill.",
 INVALID_TAX_RATE:"Tax rate must be non-negative and use up to 2 decimal places.",
 INVALID_PAID_AMOUNT:"Paid amount must be non-negative and use up to 2 decimal places.",
 PAID_EXCEEDS_GRAND_TOTAL:"Paid amount cannot exceed the grand total.",
 LINE_OVERFLOW:"A line amount is too large.",
 TOTAL_OVERFLOW:"The bill total is too large.",
};
export default function DraftMemoPage(){
 const router=useRouter();const printRef=useRef<HTMLElement|null>(null);
 const [owner,setOwner]=useState("");const [shop,setShop]=useState<Shop|null>(null);const [billQr,setBillQr]=useState("");
 const [products,setProducts]=useState<Product[]>([]);const [lines,setLines]=useState<Line[]>([]);
 const [drafts,setDrafts]=useState<DraftMemo[]>([]);const [editing,setEditing]=useState<string|null>(null);
 const [options,setOptions]=useState<Options>({...DEFAULT_OPTIONS});
 const [error,setError]=useState("");const [saved,setSaved]=useState(false);const [loading,setLoading]=useState(true);
 const load=useCallback(async()=>{
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError){setError(authError.message);setLoading(false);return;}
  if(!user){router.replace("/login");return;}
  setOwner(user.id);
  const {data:shopData,error:shopError}=await supabase.from("shops").select("*").eq("user_id",user.id).order("created_at",{ascending:true}).limit(1).maybeSingle();
  if(shopError){setError(shopError.message);setLoading(false);return;}
  if(!shopData){router.replace("/dashboard");return;}
  setShop(shopData as Shop);
  const {data:catalog,error:catalogError}=await supabase.from("item_catalog").select("id,name,unit,sale_price,is_active").eq("shop_id",shopData.id).eq("is_active",true).order("name");
  if(catalogError)setError(catalogError.message);
  setProducts((catalog||[]) as Product[]);
  setDrafts(await listDraftMemos(user.id,shopData.id));setLoading(false);
 },[router]);
 useEffect(()=>{document.title="DokanTools Bill Memo";void load();},[load]);
 useEffect(()=>{let active=true;if(!shop){setBillQr("");return;}const target=getShopQrDestination(shop,window.location.origin);if(!target){setBillQr("");return;}void QRCode.toDataURL(target,{width:320,margin:1,errorCorrectionLevel:"M"}).then(data=>{if(active)setBillQr(data);}).catch(()=>{if(active)setBillQr("");});return()=>{active=false;};},[shop]);
 const result=useMemo(()=>calculateDraftMemo(lines,options),[lines,options]);
 const add=(productId:string)=>{const product=products.find(item=>item.id===productId);if(!product)return;setLines(current=>[...current,{product_id:product.id,item_name:product.name,unit:product.unit,quantity:"1",unit_price:Number(product.sale_price||0).toFixed(2)}]);setSaved(false);setError("");};
 const changeLine=(index:number,key:keyof Line,value:string)=>{setLines(current=>current.map((line,i)=>i===index?{...line,[key]:value}:line));setSaved(false);};
 const changeOption=<K extends keyof Options>(key:K,value:Options[K])=>{setOptions(current=>({...current,[key]:value}));setSaved(false);};
 async function save(){
  if(!shop||!owner)return;
  if(!result.valid){setError(errorText[result.reason||""]||"Correct the highlighted billing values before saving.");return;}
  setError("");
  const id=editing||crypto.randomUUID(),now=new Date().toISOString();
  const draft:DraftMemo={id,owner_id:owner,shop_id:shop.id,shop_name:shop.shop_name,shop_address:shop.address,shop_phone:shop.phone,lines:lines.map(line=>({...line})),options:{...options},created_at:now};
  try{await saveDraftMemo(draft,owner,shop.id);setDrafts(await listDraftMemos(owner,shop.id));setEditing(id);setSaved(true);}
  catch(cause){setError(cause instanceof Error?cause.message:"Draft save failed.");}
 }
 function edit(draft:DraftMemo){setEditing(draft.id);setLines(draft.lines.map(line=>({...line})));setOptions({...DEFAULT_OPTIONS,...draft.options});setSaved(true);setError("");}
 async function remove(id:string){
  if(!shop||!owner||!window.confirm("Delete this saved draft?"))return;
  try{await deleteDraftMemo(owner,shop.id,id);setDrafts(await listDraftMemos(owner,shop.id));if(editing===id){setEditing(null);setLines([]);setOptions({...DEFAULT_OPTIONS});setSaved(false);}}
  catch(cause){setError(cause instanceof Error?cause.message:"Draft deletion failed.");}
 }
 function fresh(){setEditing(null);setLines([]);setOptions({...DEFAULT_OPTIONS});setError("");setSaved(false);}
 async function printMemo(){
  if(!shop)return;
  if(!result.valid){setError(errorText[result.reason||""]||"Correct the billing values before printing.");return;}
  const printable=[shop.shop_name,shop.owner_name,shop.address,shop.phone,...lines.flatMap(line=>[line.item_name,line.unit])].filter(Boolean).join(" ");
  if(/[\u0980-\u09FF]/.test(printable)){setError("The printed bill is English-only. Use English shop and product details.");return;}
  setError("");
  try{
   await document.fonts.ready;
   const node=printRef.current;if(!node)throw new Error("PRINT_LAYOUT_UNAVAILABLE");
   if(node.getBoundingClientRect().width<=0||node.getBoundingClientRect().height<=0||node.scrollWidth>node.clientWidth+1||node.scrollHeight>node.clientHeight+1){setError("A6 content overflow. Reduce the number of lines or shorten descriptions; scaling and continuation pages are disabled.");return;}
   window.print();
  }catch(cause){setError(cause instanceof Error?cause.message:"Print layout validation failed.");}
 }
 if(loading)return <main className="container-page py-8">Loading…</main>;
 const invalidReason=result.valid?null:(errorText[result.reason||""]||"Check the billing values.");
 return <main className="container-page py-8">
  <Link href="/dashboard" className="text-sm font-semibold">← Dashboard</Link>
  <h1 className="mt-3 text-2xl font-bold">Bill / Memo · A6</h1>
  <p className="muted">Create, save, edit and print a local draft. No invoice issuance, stock deduction, ledger or payment processing.</p>
  <div className="mt-5 grid gap-5 lg:grid-cols-2">
   <section className="card space-y-3" aria-label="Bill composer">
    <div className="flex justify-between items-center"><h2 className="font-bold">Products and quantities</h2><button className="btn-secondary" type="button" onClick={fresh}>New bill</button></div>
    <label className="block text-sm">Add catalogue product
     <select className="field mt-1" aria-label="Add catalogue product" value="" onChange={event=>add(event.target.value)}>
      <option value="" disabled>Select product…</option>{products.map(product=><option key={product.id} value={product.id}>{product.name} · {product.unit} · BDT {money(Math.round(Number(product.sale_price||0)*100))}</option>)}
     </select>
    </label>
    {lines.map((line,index)=><article key={index} className="rounded border p-3 space-y-2" data-testid="bill-line">
     <div className="flex justify-between font-semibold"><span>{line.item_name} ({line.unit})</span><button type="button" className="text-red-600" onClick={()=>{setLines(current=>current.filter((_,i)=>i!==index));setSaved(false);}}>Remove</button></div>
     <div className="grid grid-cols-2 gap-2">
      <label>Quantity<input aria-label="Quantity" className="field" type="number" min="0.001" step="0.001" value={line.quantity} onChange={event=>changeLine(index,"quantity",event.target.value)}/></label>
      <label>Unit price (BDT)<input aria-label="Unit price" className="field" type="number" min="0" step="0.01" value={line.unit_price} onChange={event=>changeLine(index,"unit_price",event.target.value)}/></label>
     </div>
     <div className="text-right font-semibold" data-testid="line-total">Line total: BDT {result.valid?money(result.lineTotals[index]||0):"—"}</div>
    </article>)}
    <section className="border-t pt-3 space-y-3" aria-label="Optional adjustments">
     <h3 className="font-semibold">Optional billing fields</h3>
     <div className="rounded border p-3 space-y-2">
      <label className="flex items-center gap-2"><input type="checkbox" aria-label="Enable discount" checked={options.discountEnabled} onChange={event=>changeOption("discountEnabled",event.target.checked)}/> Apply discount</label>
      {options.discountEnabled&&<label className="block text-sm">Discount amount (BDT)<input aria-label="Discount amount" className="field mt-1" type="number" min="0" step="0.01" value={options.discountAmount} onChange={event=>changeOption("discountAmount",event.target.value)}/></label>}
     </div>
     <div className="rounded border p-3 space-y-2">
      <label className="flex items-center gap-2"><input type="checkbox" aria-label="Enable VAT or tax" checked={options.taxEnabled} onChange={event=>changeOption("taxEnabled",event.target.checked)}/> Apply VAT / Tax</label>
      {options.taxEnabled&&<label className="block text-sm">Tax rate (%)<input aria-label="Tax rate" className="field mt-1" type="number" min="0" step="0.01" value={options.taxRate} onChange={event=>changeOption("taxRate",event.target.value)}/></label>}
     </div>
     <div className="rounded border p-3 space-y-2">
      <label className="flex items-center gap-2"><input type="checkbox" aria-label="Enable paid and due" checked={options.paidEnabled} onChange={event=>changeOption("paidEnabled",event.target.checked)}/> Record paid amount and due</label>
      {options.paidEnabled&&<label className="block text-sm">Amount paid (BDT)<input aria-label="Amount paid" className="field mt-1" type="number" min="0" step="0.01" value={options.paidAmount} onChange={event=>changeOption("paidAmount",event.target.value)}/></label>}
     </div>
    </section>
    <section className="border-t pt-3 space-y-1" aria-label="Bill totals" data-testid="bill-totals">
     <div className="flex justify-between"><span>Subtotal</span><span data-testid="subtotal">BDT {result.valid?money(result.subtotalMinor):"—"}</span></div>
     {options.discountEnabled&&<div className="flex justify-between"><span>Discount</span><span data-testid="discount">− BDT {result.valid?money(result.discountMinor):"—"}</span></div>}
     {options.taxEnabled&&<div className="flex justify-between"><span>VAT / Tax ({options.taxRate}%)</span><span data-testid="tax">BDT {result.valid?money(result.taxMinor):"—"}</span></div>}
     <div className="flex justify-between border-t pt-2 font-bold text-lg"><span>Grand Total</span><span data-testid="grand-total">BDT {result.valid?money(result.grandTotalMinor):"—"}</span></div>
     {options.paidEnabled&&<><div className="flex justify-between"><span>Paid</span><span data-testid="paid">BDT {result.valid?money(result.paidMinor):"—"}</span></div><div className="flex justify-between font-semibold"><span>Due</span><span data-testid="due">BDT {result.valid?money(result.dueMinor):"—"}</span></div></>}
     {invalidReason&&<p role="alert" className="text-sm text-red-700">{invalidReason}</p>}
    </section>
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
    {saved&&<p className="text-sm text-green-700">Draft saved locally.</p>}
    <div className="flex flex-wrap gap-2"><button className="btn-primary" type="button" onClick={save} disabled={!lines.length}>Save / Update Draft</button><button className="btn-secondary" type="button" onClick={printMemo} disabled={!lines.length}>Generate A6 PDF / Print</button></div>
   </section>
   <section className="card"><h2 className="font-bold">Saved bills / memos</h2>{drafts.length===0?<p className="muted mt-2">No drafts saved.</p>:<ul className="mt-3 space-y-2">{drafts.map(draft=><li key={draft.id} className="flex justify-between gap-2 border-b pb-2"><div><b>{draft.shop_name}</b><div className="muted text-xs">{draft.lines.length} products · {new Date(draft.updated_at||draft.created_at).toLocaleString()}</div></div><div className="flex gap-2"><button className="btn-secondary" type="button" onClick={()=>edit(draft)}>Edit</button><button className="text-red-600" type="button" onClick={()=>remove(draft.id)}>Delete</button></div></li>)}</ul>}</section>
  </div>
  <section ref={printRef} className="memo-print" aria-label="A6 bill memo print preview">
   <header className="shop-identity"><img className="shop-logo" data-testid="bill-shop-logo" src={shop?.logo_url||generatedShopLogoDataUrl(shop?.shop_name||"Shop")} alt="Shop logo"/><h1 data-testid="bill-shop-name">{shop?.shop_name}</h1>{shop?.owner_name&&<p>Owner: {shop.owner_name}</p>}{shop?.address&&<p>{shop.address}</p>}{shop?.phone&&<p>Phone: {shop.phone}</p>}{shop?.map_link&&validateGoogleMapsUrl(shop.map_link)&&<p className="shop-map"><a href={validateGoogleMapsUrl(shop.map_link)!} target="_blank" rel="noreferrer">Google Maps location</a></p>}</header>
   <h2>Bill / Memo</h2>
   <table><thead><tr><th>Product</th><th>Qty</th><th>Unit Price (BDT)</th><th>Line Total (BDT)</th></tr></thead>
    <tbody>{lines.map((line,index)=><tr key={index}><td>{line.item_name}</td><td>{line.quantity} {line.unit}</td><td>{money(Math.round(Number(line.unit_price)*100))}</td><td>{result.valid?money(result.lineTotals[index]||0):"—"}</td></tr>)}</tbody>
   </table>
   <div className="print-totals"><div><span>Subtotal</span><span>BDT {result.valid?money(result.subtotalMinor):"—"}</span></div>
    {options.discountEnabled&&<div><span>Discount</span><span>− BDT {result.valid?money(result.discountMinor):"—"}</span></div>}
    {options.taxEnabled&&<div><span>VAT / Tax ({options.taxRate}%)</span><span>BDT {result.valid?money(result.taxMinor):"—"}</span></div>}
    <div className="print-grand"><span>Grand Total</span><span>BDT {result.valid?money(result.grandTotalMinor):"—"}</span></div>
    {options.paidEnabled&&<><div><span>Paid</span><span>BDT {result.valid?money(result.paidMinor):"—"}</span></div><div><span>Due</span><span>BDT {result.valid?money(result.dueMinor):"—"}</span></div></>}
   </div>
   {billQr&&<div className="shop-qr-footer"><img data-testid="shop-bill-qr" className="shop-bill-qr" src={billQr} alt="Shop location or public profile QR code"/><p>{shop?.map_link&&validateGoogleMapsUrl(shop.map_link)?"Scan for shop location":"Scan to visit shop profile"}</p></div>}<p className="print-footer">DRAFT ONLY — NOT AN ISSUED INVOICE. Thank you for your business.</p>
  </section>
  <style jsx global>{'.memo-print{position:fixed;left:-10000px;top:0;display:block;visibility:hidden;width:98mm;height:142mm;overflow:hidden;box-sizing:border-box;padding:0;font-family:Arial,Helvetica,sans-serif;font-size:8pt;line-height:1.15;color:#000;background:#fff;} .memo-print header{border-bottom:0.3mm solid #000;padding-bottom:1.5mm;margin-bottom:1.5mm;text-align:center;font-weight:400;} .memo-print .shop-logo{display:block;width:10mm;height:10mm;object-fit:contain;margin:0 auto 1mm;} .memo-print header h1{font-size:12pt;font-weight:700;margin:0 0 1mm;text-align:center;} .memo-print header p{font-size:8pt;font-weight:400;margin:0.5mm 0;text-align:center;overflow-wrap:anywhere;} .memo-print header .shop-map a{font-weight:400;color:#000;text-decoration:underline;} .memo-print h2{font-size:10pt;font-weight:700;margin:1mm 0 2mm;text-align:center;} .memo-print p{font-size:8pt;margin:1mm 0;} .memo-print table{width:100%;border-collapse:collapse;table-layout:fixed;margin:2mm 0;} .memo-print th,.memo-print td{border:0.2mm solid #000;padding:1mm;text-align:left;overflow-wrap:anywhere;word-break:break-word;font-size:8pt;} .memo-print .print-totals{margin-top:2mm;} .memo-print .print-totals>div{display:flex;justify-content:space-between;gap:2mm;margin:1mm 0;} .memo-print .print-grand{font-weight:700;border-top:0.3mm solid #000;padding-top:1mm;font-size:9pt;} .memo-print .shop-qr-footer{text-align:center;margin:2mm auto 1mm;} .memo-print .shop-bill-qr{display:block;width:18mm;height:18mm;object-fit:contain;margin:0 auto;} .memo-print .shop-qr-footer p{font-size:8pt;font-weight:400;margin:0.5mm 0;} .memo-print .print-footer{border-top:0.2mm solid #000;margin-top:2mm;padding-top:1mm;text-align:center;font-weight:400;} @media print{@page{size:297.6378pt 419.5276pt;margin:8.50394pt;}html,body{margin:0!important;padding:0!important;background:#fff!important;} .container-page > :not(.memo-print){display:none!important;}body *{visibility:hidden!important;}.memo-print,.memo-print *{visibility:visible!important;}.memo-print{position:absolute;left:0;top:0;width:98mm;height:142mm;overflow:hidden;box-sizing:border-box;font-family:Arial,Helvetica,sans-serif;font-size:8pt;line-height:1.15;color:#000;background:#fff;}}'}</style>
 </main>;
}
