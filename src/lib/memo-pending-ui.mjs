/**
 * Synchronize page pending state after a successful pending-store read.
 * Always publish the read result (including null); restore form fields only
 * when an unresolved operation exists. This helper does not mutate the store.
 */
export function syncPendingMemoLoad(unresolved, { setPending, restoreForm }) {
  setPending(unresolved ?? null);
  if (unresolved) restoreForm(unresolved.formSnapshot);
}
