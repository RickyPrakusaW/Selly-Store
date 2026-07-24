const CATALOG_CHANGED_EVENT = "seli:catalog-changed";
const CATALOG_CHANGED_STORAGE_KEY = "seli_catalog_changed_at";

export function announceCatalogChange(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CATALOG_CHANGED_STORAGE_KEY, String(Date.now()));
  window.dispatchEvent(new Event(CATALOG_CHANGED_EVENT));
}

export function subscribeToCatalogChanges(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (event.key === CATALOG_CHANGED_STORAGE_KEY) callback();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(CATALOG_CHANGED_EVENT, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CATALOG_CHANGED_EVENT, callback);
  };
}
