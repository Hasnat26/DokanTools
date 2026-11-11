import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { InvoiceDTO } from "@/lib/invoice-contract";
export const runtime="nodejs";export const dynamic="force-dynamic";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function GET(req:NextRequest,ctx:{params:Promise<{invoiceId:string}>}){
 const {invoiceId}=await ctx.params;if(!UUID.test(invoiceId))return NextResponse.json({error:{code:"INVALID_INVOICE_ID"}},{status:400});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,token=req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
 if(!url||!anon||!token||token.length>8192)return NextResponse.json({error:{code:"UNAUTHENTICATED"}},{status:401});
 const client=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:"Bearer "+token}}});
 const {data:user,error:ue}=await client.auth.getUser(token);if(ue||!user.user)return NextResponse.json({error:{code:"UNAUTHENTICATED"}},{status:401});
 const shopId=req.nextUrl.searchParams.get("shopId");if(!shopId||!UUID.test(shopId))return NextResponse.json({error:{code:"INVALID_SHOP_ID"}},{status:400});
 const {data:r,error}=await client.from("invoices").select("id,shop_id,bill_number,issued_at,total_amount,shop_name_snapshot,shop_address_snapshot,shop_phone_snapshot,map_url_snapshot").eq("shop_id",shopId).eq("id",invoiceId).maybeSingle();if(error||!r)return NextResponse.json({error:{code:"INVOICE_NOT_FOUND"}},{status:404});
 const {data:l,error:le}=await client.from("invoice_lines").select("line_no,catalog_item_id_snapshot,item_name_snapshot,unit_snapshot,quantity,unit_price,line_total").eq("shop_id",shopId).eq("invoice_id",invoiceId).order("line_no",{ascending:true});if(le||!l)return NextResponse.json({error:{code:"INVOICE_UNAVAILABLE"}},{status:503});
 const invoice:InvoiceDTO={id:r.id,shopId:r.shop_id,billNumber:String(r.bill_number),issuedAt:r.issued_at,currency:"BDT",totalAmount:String(r.total_amount),header:{shopName:r.shop_name_snapshot,shopAddress:r.shop_address_snapshot,shopPhone:r.shop_phone_snapshot,mapUrl:r.map_url_snapshot},lines:l.map(x=>({lineNo:x.line_no,catalogItemId:x.catalog_item_id_snapshot,itemName:x.item_name_snapshot,unit:x.unit_snapshot,quantity:String(x.quantity),unitPrice:String(x.unit_price),lineTotal:String(x.line_total)}))};
 return NextResponse.json({invoice},{headers:{"Cache-Control":"no-store","Pragma":"no-cache"}});
}
