const RESET_MARKER = "lis_fresh_start_2026_08";

const LEGACY_KEYS = [
  "lis_tracker_gist_id",
  "lis_tracker_github_token",
  "lis_tracker_current_reader",
  "lis_legacy_migration_map_v1",
];

const LEGACY_PREFIXES = ["lis_local_vault_"];

export function prepareFreshStart() {
  if (typeof window === "undefined") return;

  try {
    const storage = window.localStorage;
    if (storage.getItem(RESET_MARKER) === "1") return;

    for (const key of LEGACY_KEYS) storage.removeItem(key);

    const keysToRemove: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key && LEGACY_PREFIXES.some(prefix => key.startsWith(prefix))) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) storage.removeItem(key);

    storage.setItem(RESET_MARKER, "1");
  } catch {
    // ReaderContext will still surface unsupported/blocked storage through isConfigured().
  }
}
