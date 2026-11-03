export type PendingMemoRecord = {
  shopId: string;
  operationId: string;
  payload: {
    p_request_id: string;
    p_shop_id: string;
    p_customer_id: string | null;
    p_items: Array<Record<string, unknown>>;
    p_due_amount: number;
  };
  formSnapshot: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    items: Array<{ product_id: string; name: string; qty: string; unit: string; price: string; price_override_reason?: string }>;
    due: string;
  };
  createdAt: string;
};
export function createMemoPendingStore(adapter: { claim(record: PendingMemoRecord): Promise<unknown>; get(shopId: string): Promise<PendingMemoRecord | null | undefined>; deleteIfMatches(shopId: string, operationId: string, payload?: PendingMemoRecord["payload"]): Promise<boolean> }): {
  save(record: PendingMemoRecord): Promise<void>;
  get(shopId: string): Promise<PendingMemoRecord | null>;
  remove(shopId: string, operationId: string, payload?: PendingMemoRecord["payload"]): Promise<boolean>;
};
export const memoPendingStore: ReturnType<typeof createMemoPendingStore>;
