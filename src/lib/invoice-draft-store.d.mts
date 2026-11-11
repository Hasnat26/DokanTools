export type LocalInvoiceDraft = {
  id: string;
  owner_id: string;
  shop_id: string;
  created_at: string;
  updated_at: string;
  lines: Array<{
    catalog_item_id: string;
    item_name: string;
    quantity_text: string;
    unit_price_text: string;
  }>;
};
export function saveInvoiceDraft(draft: LocalInvoiceDraft): Promise<boolean>;
export function listInvoiceDrafts(ownerId: string, shopId: string): Promise<LocalInvoiceDraft[]>;
export function deleteInvoiceDraft(ownerId: string, shopId: string, draftId: string): Promise<boolean>;
