import type { PendingMemoRecord } from "./memo-pending-store.mjs";
export function syncPendingMemoLoad(
  unresolved: PendingMemoRecord | null | undefined,
  callbacks: {
    setPending: (record: PendingMemoRecord | null) => void;
    restoreForm: (snapshot: PendingMemoRecord["formSnapshot"]) => void;
  }
): void;
