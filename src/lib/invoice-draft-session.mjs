/**
 * In-memory session boundary for local invoice drafts.
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
    isCurrent(snapshot) {
      return Boolean(
        snapshot &&
        snapshot.generation === generation &&
        active &&
        active.ownerId === snapshot.ownerId &&
        active.shopId === snapshot.shopId
      );
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
