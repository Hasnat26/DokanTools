import { jsPDF } from "jspdf";
const safe=v=>String(v??"").trim();
export function createDraftMemoPdf(data){
 const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a6",compress:true});
 const W=105,M=6,C=W-2*M;let y=7;
 doc.setTextColor(0,0,0);doc.setDrawColor(0,0,0);doc.setLineWidth(.25);
 // Compact vector shop mark; avoids depending on remote logo CORS or raster screenshots.
 doc.setFont("helvetica","bold");doc.setFontSize(8);let logoAdded=false;
 if(data.logoDataUrl&&/^data:image\/(?:png|jpeg|webp);base64,/i.test(data.logoDataUrl)){try{const format=data.logoDataUrl.slice(5,data.logoDataUrl.indexOf(";")).split("/")[1].toUpperCase();doc.addImage(data.logoDataUrl,format,W/2-4,y,8,8);logoAdded=true;}catch{/* Vector shop mark fallback. */}}
 if(!logoAdded){doc.circle(W/2,y+3.5,3.5);doc.text((safe(data.shop?.name)||"S").slice(0,1).toUpperCase(),W/2,y+4.7,{align:"center"});}y+=10;
 doc.setFontSize(12);doc.text(doc.splitTextToSize(safe(data.shop?.name)||"Shop",C),W/2,y+3,{align:"center"});y+=6;
 doc.setFont("helvetica","normal");doc.setFontSize(8);
 for(const d of [data.shop?.owner?("Owner: "+data.shop.owner):"",data.shop?.address,data.shop?.phone].filter(Boolean)){const t=doc.splitTextToSize(safe(d),C);doc.text(t,W/2,y,{align:"center"});y+=t.length*3.5;}
 if(data.shop?.mapUrl){doc.text("Google Maps location",W/2,y,{align:"center"});doc.link(M,y-2,C,4,{url:data.shop.mapUrl});y+=4;}
 doc.line(M,y,W-M,y);y+=4;doc.setFont("helvetica","bold");doc.setFontSize(10);doc.text("Bill / Memo",W/2,y,{align:"center"});y+=5;
 const widths=[37,13,19,24],xs=[M,M+37,M+50,M+69],head=["Product","Qty","Unit","Amount"];
 const cell=(x,top,w,h,text,bold=false,right=false)=>{doc.rect(x,top,w,h);doc.setFont("helvetica",bold?"bold":"normal");const t=doc.splitTextToSize(safe(text),w-2);doc.text(t,right?x+w-1:x+1,top+2.6,{align:right?"right":"left"});};
 doc.setFontSize(8);head.forEach((t,i)=>cell(xs[i],y,widths[i],6,t,true));y+=6;
 for(const line of data.lines||[]){const vals=[line.name,line.quantity+" "+line.unit,line.unitPrice,line.lineTotal],wrapped=vals.map((v,i)=>doc.splitTextToSize(safe(v),widths[i]-2)),h=Math.max(6,...wrapped.map(t=>t.length*3.2+2));if(y+h>116)throw new Error("A6 PDF content overflow. Reduce bill lines or shorten product details.");vals.forEach((v,i)=>cell(xs[i],y,widths[i],h,v,false,i===3));y+=h;}
 y+=2;doc.setFont("helvetica","normal");doc.setFontSize(8);const t=data.totals||{};
 const rows=[["Subtotal",t.subtotal],["Discount",t.discount],[t.taxLabel||"VAT / Tax",t.tax],["Grand Total",t.grandTotal],["Paid",t.paid],["Due",t.due]].filter(r=>r[1]!==null&&r[1]!==undefined);
 for(const [label,value] of rows){if(y>119)throw new Error("A6 PDF totals overflow. Reduce bill lines or optional fields.");if(label==="Grand Total"){doc.line(M,y,W-M,y);y+=2;doc.setFont("helvetica","bold");}doc.text(safe(label),M,y);doc.text("BDT "+safe(value),W-M,y,{align:"right"});y+=4;}
 if(data.qrDataUrl){const q=17,qx=(W-q)/2,qy=120;if(y>qy-2)throw new Error("A6 PDF QR/footer overflow. Reduce bill lines.");doc.addImage(data.qrDataUrl,"PNG",qx,qy,q,q);doc.setFont("helvetica","normal");doc.setFontSize(8);doc.text(data.shop?.mapUrl?"Scan for shop location":"Scan to visit shop profile",W/2,qy+q+2,{align:"center"});}
 doc.setFont("helvetica","normal");doc.setFontSize(8);doc.line(M,143,W-M,143);doc.text("DRAFT ONLY - NOT AN ISSUED INVOICE. Thank you.",W/2,146,{align:"center"});
 if(doc.getNumberOfPages()!==1)throw new Error("A6 PDF must remain one page.");
 const s=doc.internal.pageSize;if(Math.abs(s.getWidth()-105)>.02||Math.abs(s.getHeight()-148)>.02)throw new Error("PDF page size is not A6 portrait.");
 return doc;
}
