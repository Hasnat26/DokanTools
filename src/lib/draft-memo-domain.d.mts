export type DraftMemoLine={product_id:string;item_name:string;unit:string;quantity:string;unit_price:string};
export type DraftMemoOptions={discountEnabled?:boolean;discountAmount?:string;taxEnabled?:boolean;taxRate?:string;paidEnabled?:boolean;paidAmount?:string};
export type DraftMemoCalc={valid:boolean;reason:string|null;lineTotals:number[];subtotalMinor:number;discountMinor:number;taxableMinor:number;taxMinor:number;grandTotalMinor:number;paidMinor:number;dueMinor:number;totalMinor:number};
export function calculateDraftMemo(lines:DraftMemoLine[],options?:DraftMemoOptions):DraftMemoCalc;
export function draftMemoStorageKey(owner:string,shop:string,id:string):string;
export function validateDraftMemoIdentity(draft:unknown,owner:string,shop:string,id?:string):true;
export function validateA6MemoFit(shop:{shop_name:string}|null,lines:DraftMemoLine[]):{valid:boolean;reason?:string;estimatedRows?:number};
