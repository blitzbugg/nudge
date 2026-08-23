/** A tiny in-process change signal for local database mutations.
 * SQLite is the persistent source of truth; this only lets mounted views refresh
 * immediately after an awaited write instead of waiting for their polling fallback.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

export function notifyDataChanged() {
  listeners.forEach((listener) => listener());
}

export function subscribeToDataChanges(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
