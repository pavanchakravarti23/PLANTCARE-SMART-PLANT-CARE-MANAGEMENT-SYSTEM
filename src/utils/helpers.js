/**
 * General utility helpers for sanitization, IDs, image validation, and toasts.
 */

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Escapes HTML special characters to prevent XSS injection when rendering templates.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates a unique identifier with an optional prefix.
 * @param {string} [prefix]
 * @returns {string}
 */
export function generateId(prefix = 'pc') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}-${Date.now().toString(36)}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

/**
 * Validates an uploaded image file for type and reasonable size.
 * @param {File|Blob|null} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'Please select an image file.' };
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Unsupported format. Please upload a JPG, PNG, or WEBP image.'
    };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return {
      valid: false,
      error: 'Image exceeds 5 MB limit. Please choose a smaller photograph.'
    };
  }
  return { valid: true };
}

/**
 * Resizes/compresses large browser images via canvas to keep IndexedDB lean.
 * Falls back to returning the original file if canvas is unavailable.
 * @param {File} file
 * @param {number} [maxDimension]
 * @returns {Promise<Blob>}
 */
export function optimizeImageForStorage(file, maxDimension = 1200) {
  return new Promise((resolve) => {
    if (typeof document === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) {
      resolve(file);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        let { width, height } = img;
        if (width <= maxDimension && height <= maxDimension && file.size <= 450 * 1024) {
          URL.revokeObjectURL(objectUrl);
          resolve(file);
          return;
        }

        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            resolve(blob || file);
          },
          'image/jpeg',
          0.84
        );
      } catch {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Returns a greeting suited for the local hour of day.
 * @param {Date} [now]
 * @returns {string}
 */
export function getGreeting(now = new Date()) {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Triggers a JSON file download in the browser.
 * @param {string} filename
 * @param {object} data
 */
export function downloadJsonFile(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
