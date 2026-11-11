export type InvoiceDraftSessionSnapshot = {
  generation: number;
  ownerId: string;
  shopId: string;
};
export function createInvoiceDraftSessionGuard(): {
  begin(): number;
  activate(requestGeneration: number, ownerId: string, shopId: string): InvoiceDraftSessionSnapshot | null;
  invalidate(): number;
  isGenerationCurrent(requestGeneration: number): boolean;
  isCurrent(snapshot: InvoiceDraftSessionSnapshot | null): boolean;
  isActive(ownerId: string, shopId: string): boolean;
  canAccess(draft: { owner_id: string; shop_id: string } | null, ownerId: string, shopId: string): boolean;
};
