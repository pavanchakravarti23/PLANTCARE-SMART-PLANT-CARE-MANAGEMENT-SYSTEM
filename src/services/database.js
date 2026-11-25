/**
 * IndexedDB media storage service for PlantCare.
 * Stores plant photographs and growth diary images outside LocalStorage
 * to avoid the ~5MB LocalStorage quota bottleneck.
 */

const DB_NAME = 'plantcare_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'images';

const memoryUrlCache = new Map();
const memoryFallbackStore = new Map();

function hasIndexedDB() {
  return typeof indexedDB !== 'undefined';
}

function openMediaDB() {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDB()) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    if (typeof FileReader === 'undefined') {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => reject(reader.error || new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = /data:([^;]+);base64/.exec(header || '');
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(base64 || '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export const MediaDatabase = {
  /**
   * Saves an image Blob or DataURL under a unique imageId.
   * @param {string} id
   * @param {Blob|string} payload
   * @param {object} [meta]
   * @returns {Promise<string>}
   */
  async saveImage(id, payload, meta = {}) {
    if (!id) throw new Error('Image ID is required');
    const dataUrl = typeof payload === 'string' ? payload : await blobToDataUrl(payload);
    const record = {
      id,
      dataUrl,
      mimeType: meta.mimeType || (payload instanceof Blob ? payload.type : 'image/jpeg'),
      size: meta.size || (payload instanceof Blob ? payload.size : dataUrl?.length || 0),
      createdAt: new Date().toISOString()
    };

    if (dataUrl) {
      memoryUrlCache.set(id, dataUrl);
    }

    if (!hasIndexedDB()) {
      memoryFallbackStore.set(id, record);
      return id;
    }

    try {
      const db = await openMediaDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || new Error('IndexedDB write failed'));
      });
      db.close();
    } catch {
      memoryFallbackStore.set(id, record);
    }
    return id;
  },

  /**
   * Retrieves a displayable URL (DataURL or ObjectURL) for a stored imageId.
   * @param {string} id
   * @returns {Promise<string|null>}
   */
  async getImageUrl(id) {
    if (!id) return null;
    if (memoryUrlCache.has(id)) {
      return memoryUrlCache.get(id);
    }

    if (!hasIndexedDB()) {
      const fallback = memoryFallbackStore.get(id);
      return fallback?.dataUrl || null;
    }

    try {
      const db = await openMediaDB();
      const record = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
      db.close();

      if (!record) return null;
      const url = record.dataUrl || (record.blob ? URL.createObjectURL(record.blob) : null);
      if (url) memoryUrlCache.set(id, url);
      return url;
    } catch {
      const fallback = memoryFallbackStore.get(id);
      return fallback?.dataUrl || null;
    }
  },

  /**
   * Deletes an image by id from IndexedDB and memory cache.
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deleteImage(id) {
    if (!id) return;
    memoryUrlCache.delete(id);
    memoryFallbackStore.delete(id);

    if (!hasIndexedDB()) return;

    try {
      const db = await openMediaDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    } catch {
      // Ignore delete error if store doesn't exist
    }
  },

  /**
   * Deletes multiple image ids safely.
   * @param {string[]} ids
   * @returns {Promise<void>}
   */
  async deleteImages(ids = []) {
    await Promise.all(ids.filter(Boolean).map((id) => this.deleteImage(id)));
  },

  /**
   * Exports all stored images as a map { [id]: dataUrl } for backup JSON.
   * @returns {Promise<Record<string, string>>}
   */
  async exportAllImages() {
    const out = {};
    if (!hasIndexedDB()) {
      for (const [id, rec] of memoryFallbackStore.entries()) {
        if (rec.dataUrl) out[id] = rec.dataUrl;
      }
      return out;
    }

    try {
      const db = await openMediaDB();
      const records = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
      db.close();

      for (const rec of records) {
        if (rec?.id && rec?.dataUrl) {
          out[rec.id] = rec.dataUrl;
        }
      }
    } catch {
      for (const [id, rec] of memoryFallbackStore.entries()) {
        if (rec.dataUrl) out[id] = rec.dataUrl;
      }
    }
    return out;
  },

  /**
   * Restores images from an exported { [id]: dataUrl } dictionary.
   * @param {Record<string, string>} imageMap
   * @returns {Promise<void>}
   */
  async importAllImages(imageMap = {}) {
    if (!imageMap || typeof imageMap !== 'object') return;
    const entries = Object.entries(imageMap).filter(
      ([id, dataUrl]) => typeof id === 'string' && typeof dataUrl === 'string' && dataUrl.startsWith('data:image/')
    );
    await Promise.all(
      entries.map(([id, dataUrl]) => this.saveImage(id, dataUrlToBlob(dataUrl), { mimeType: 'image/jpeg' }))
    );
  },

  /**
   * Clears all stored images from IndexedDB and caches.
   * @returns {Promise<void>}
   */
  async clearAllImages() {
    memoryUrlCache.clear();
    memoryFallbackStore.clear();

    if (!hasIndexedDB()) return;

    try {
      const db = await openMediaDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    } catch {
      // Ignore cleanup errors
    }
  }
};
