import type {DraftMemoLine,DraftMemoOptions} from "./draft-memo-domain.mjs";
export type DraftMemo={id:string;owner_id:string;shop_id:string;shop_name:string;shop_address?:string|null;shop_phone?:string|null;lines:DraftMemoLine[];options:DraftMemoOptions;created_at:string;updated_at?:string};
export function saveDraftMemo(draft:DraftMemo,owner:string,shop:string):Promise<boolean>;
export function loadDraftMemo(owner:string,shop:string,id:string):Promise<DraftMemo|null>;
export function listDraftMemos(owner:string,shop:string):Promise<DraftMemo[]>;
export function deleteDraftMemo(owner:string,shop:string,id:string):Promise<boolean>;
