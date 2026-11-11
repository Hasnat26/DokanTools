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
  capture(ownerId: string, shopId: string): InvoiceDraftSessionSnapshot | null;
  isActive(ownerId: string, shopId: string): boolean;
  canAccess(draft: { owner_id: string; shop_id: string } | null, ownerId: string, shopId: string): boolean;
};
export function runSessionBoundRequest<T>(options: {
  guard: ReturnType<typeof createInvoiceDraftSessionGuard>;
  snapshot: InvoiceDraftSessionSnapshot | null;
  request: () => Promise<T>;
  onSuccess?: (value: T) => void;
  onError?: (error: unknown) => void;
  onFinally?: () => void;
}): Promise<boolean>;
