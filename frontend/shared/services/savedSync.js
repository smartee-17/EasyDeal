/* ============================================================
   EASYDEAL - SAVED-STATE CHANGE SIGNAL

   Notifies other pages and tabs that saved state may be stale.

   Carries no data and holds no state: listeners must re-read
   GET /api/saved and re-render, so the server stays the only authority.
   Covers a change made on another page or tab, and one made while this
   page was hidden.

   Usage:
     notifySavedChanged();            // after a confirmed write
     onSavedChanged(() => reload());  // another context wrote
     onSavedMayBeStale(() => reload()); // focus regained
   ============================================================ */

const CHANNEL_NAME = 'easydeal-saved';
/* localStorage key is a ping for browsers/contexts without BroadcastChannel,
   and for same-tab cross-page updates. The value is a changing nonce so the
   repeated-identical-value case cannot swallow the event. */
const STORAGE_KEY = 'easydeal-saved-ping';

let channel = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch {
  channel = null;
}

const localListeners = new Set();
const staleListeners = new Set();

/** Deliver "saved state may have changed" to this context's subscribers. */
function emitChanged() {
  for (const listener of localListeners) {
    try {
      listener();
    } catch (error) {
      console.error('[savedSync] changed listener failed:', error);
    }
  }
}

if (channel) {
  channel.addEventListener('message', emitChanged);
}

/* A storage event fires in the OTHER tabs/windows that share the origin,
   which is exactly the set we cannot reach with the in-page listener. */
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) emitChanged();
});

/** Wires the no-op-ingress behaviour for backgrounded pages: when a document
    becomes visible again it may have missed changes made while it was hidden,
    so subscribers are told to re-check rather than to trust cached state. */
let wasHidden = document.visibilityState === 'hidden';

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    wasHidden = true;
    return;
  }
  if (wasHidden) {
    wasHidden = false;
    emitStale();
  }
});

window.addEventListener('focus', emitStale);

function emitStale() {
  for (const listener of staleListeners) {
    try {
      listener();
    } catch (error) {
      console.error('[savedSync] stale listener failed:', error);
    }
  }
}

/**
 * Announce that a save or unsave was confirmed by the server, so other
 * pages/tabs can reconcile. Call this only after a successful request.
 *
 * This deliberately does NOT notify listeners in the current context: the
 * caller already applied the server's answer to its own UI, so echoing it
 * back would only spend a second request on the same page. The callbacks
 * reachable from here belong to other documents.
 */
export function notifySavedChanged() {
  // Other contexts: cheap ping carrying no state.
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()) + Math.random());
  } catch {
    // Private mode or a full quota must not break the write that just succeeded.
  }
  channel?.postMessage('changed');
}

/**
 * Subscribe to "another context confirmed a saved-state write".
 * @param {() => void} listener
 * @returns {() => void} unsubscribe
 */
export function onSavedChanged(listener) {
  localListeners.add(listener);
  return () => localListeners.delete(listener);
}

/**
 * Subscribe to "this page may have missed a change, re-read the server".
 * @param {() => void} listener
 * @returns {() => void} unsubscribe
 */
export function onSavedMayBeStale(listener) {
  staleListeners.add(listener);
  return () => staleListeners.delete(listener);
}