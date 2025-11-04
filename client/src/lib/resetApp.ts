/**
 * Nuclear option: Clear all app data and reset to fresh state
 * Clears: IndexedDB, Service Workers, localStorage, sessionStorage, cache
 */
export async function resetAppData(): Promise<void> {
  try {
    console.log('🔥 Starting nuclear reset...');

    // 1. Clear IndexedDB (photo storage)
    if ('indexedDB' in window) {
      const databases = await window.indexedDB.databases();
      for (const db of databases) {
        if (db.name) {
          console.log(`Deleting IndexedDB: ${db.name}`);
          window.indexedDB.deleteDatabase(db.name);
        }
      }
    }

    // 2. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        console.log('Unregistering service worker...');
        await registration.unregister();
      }
    }

    // 3. Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        console.log(`Deleting cache: ${cacheName}`);
        await caches.delete(cacheName);
      }
    }

    // 4. Clear localStorage
    localStorage.clear();
    console.log('Cleared localStorage');

    // 5. Clear sessionStorage
    sessionStorage.clear();
    console.log('Cleared sessionStorage');

    console.log('✅ Nuclear reset complete! Reloading...');

    // 6. Hard reload the page (bypass cache)
    window.location.reload();
  } catch (error) {
    console.error('Error during reset:', error);
    // Still try to reload even if there was an error
    window.location.reload();
  }
}
