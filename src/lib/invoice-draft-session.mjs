/**
 * In-memory session boundary for local invoice drafts and issued-invoice reads.
 * Invalidating a session never deletes or mutates persisted drafts.
 */
export function createInvoiceDraftSessionGuard() {
  let generation = 0;
  let active = null;

  return {
    begin() {
      generation += 1;
      active = null;
      return generation;
    },
    activate(requestGeneration, ownerId, shopId) {
      if (requestGeneration !== generation || !ownerId || !shopId) return null;
      active = { ownerId, shopId };
      return { generation, ownerId, shopId };
    },
    invalidate() {
      generation += 1;
      active = null;
      return generation;
    },
    isGenerationCurrent(requestGeneration) {
      return requestGeneration === generation;
    },
    isCurrent(snapshot) {
      return Boolean(
        snapshot &&
        snapshot.generation === generation &&
        active &&
        active.ownerId === snapshot.ownerId &&
        active.shopId === snapshot.shopId
      );
    },
    capture(ownerId, shopId) {
      if (!ownerId || !shopId || !active ||
          active.ownerId !== ownerId || active.shopId !== shopId) return null;
      return { generation, ownerId, shopId };
    },
    isActive(ownerId, shopId) {
      return Boolean(active && active.ownerId === ownerId && active.shopId === shopId);
    },
    canAccess(draft, ownerId, shopId) {
      return Boolean(
        active &&
        active.ownerId === ownerId &&
        active.shopId === shopId &&
        draft &&
        draft.owner_id === ownerId &&
        draft.shop_id === shopId
      );
    },
  };
}

/**
 * Execute a session-bound async task. The task may only commit UI state while
 * the exact captured owner/shop/generation remains current, including error
 * and completion paths.
 */
export async function runSessionBoundRequest({ guard, snapshot, request, onSuccess, onError, onFinally }) {
  if (!guard || !snapshot || !guard.isCurrent(snapshot)) return false;
  try {
    const value = await request();
    if (!guard.isCurrent(snapshot)) return false;
    onSuccess?.(value);
    return true;
  } catch (error) {
    if (!guard.isCurrent(snapshot)) return false;
    onError?.(error);
    return false;
  } finally {
    if (guard.isCurrent(snapshot)) onFinally?.();
  }
}
