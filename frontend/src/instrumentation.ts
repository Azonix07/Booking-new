export async function register() {
  // Node 25 exposes a broken `localStorage` global that breaks SSR.
  // Remove it so our `isBrowserStorage()` guard works correctly.
  if (typeof window === "undefined" && typeof globalThis.localStorage !== "undefined") {
    // @ts-expect-error — intentional cleanup of broken Node global
    delete globalThis.localStorage;
  }
}
