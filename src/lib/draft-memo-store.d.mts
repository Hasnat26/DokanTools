import type {DraftMemoLine} from "./draft-memo-domain.mjs";
export type DraftMemo={id:string;owner_id:string;shop_id:string;shop_name:string;lines:DraftMemoLine[];created_at:string;updated_at?:string};
export function saveDraftMemo(draft:DraftMemo,owner:string,shop:string):Promise<boolean>;
export function loadDraftMemo(owner:string,shop:string,id:string):Promise<DraftMemo|null>;
export function listDraftMemos(owner:string,shop:string):Promise<DraftMemo[]>;
export function deleteDraftMemo(owner:string,shop:string,id:string):Promise<boolean>;
