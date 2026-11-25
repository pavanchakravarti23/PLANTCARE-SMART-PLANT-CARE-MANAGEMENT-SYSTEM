/**
 * Shared UI helpers: Lucide icon mounting, modals, confirmation dialogs,
 * toast notifications, status badges, and async IndexedDB image hydration.
 */

import {
  AlarmClock,
  AlertTriangle,
  ArrowLeft,
  Award,
  BarChart3,
  Bell,
  BellRing,
  BookOpen,
  CalendarDays,
  CalendarPlus,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Droplets,
  Eye,
  Flame,
  Flower2,
  GitCompare,
  Info,
  Layers,
  LayoutDashboard,
  MapPin,
  Menu,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  SkipForward,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Sun,
  Trash2,
  Trophy,
  Upload,
  X,
  createIcons
} from 'lucide';
import { store } from '../services/store.js';
import { escapeHtml } from './helpers.js';

const APP_ICONS = {
  AlarmClock,
  AlertTriangle,
  ArrowLeft,
  Award,
  BarChart3,
  Bell,
  BellRing,
  BookOpen,
  CalendarDays,
  CalendarPlus,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Droplets,
  Eye,
  Flame,
  Flower2,
  GitCompare,
  Info,
  Layers,
  LayoutDashboard,
  MapPin,
  Menu,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  SkipForward,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Sun,
  Trash2,
  Trophy,
  Upload,
  X
};

/**
 * Replaces [data-icon] placeholders inside root with crisp Lucide SVG icons.
 * @param {ParentNode} [root]
 */
export function mountIcons(root = document) {
  try {
    createIcons({
      icons: APP_ICONS,
      nameAttr: 'data-icon',
      attrs: { class: 'lucide', 'aria-hidden': 'true' }
    });
  } catch {
    // Ignore in non-DOM test contexts
  }
}

export function iconSpan(name, cls = 'icon-inline') {
  return `<span class="${escapeHtml(cls)}" data-icon="${escapeHtml(name)}"></span>`;
}

/**
 * Displays a temporary toast message.
 * @param {string} message
 * @param {'info'|'success'|'error'} [type]
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast is-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3600);
}

let activeModalCleanup = null;

export function closeModal() {
  const root = document.getElementById('modal-root');
  const body = document.getElementById('modal-body');
  if (!root || !body) return;

  root.hidden = true;
  body.innerHTML = '';
  if (typeof activeModalCleanup === 'function') {
    activeModalCleanup();
    activeModalCleanup = null;
  }
}

/**
 * Opens the shared modal dialog with safe title and HTML body.
 * @param {string} title
 * @param {string} bodyHtml
 * @param {(bodyEl: HTMLElement) => void|(() => void)} [onMount]
 */
export function openModal(title, bodyHtml, onMount = null) {
  const root = document.getElementById('modal-root');
  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');
  if (!root || !titleEl || !bodyEl) return;

  closeModal();
  titleEl.textContent = title;
  bodyEl.innerHTML = bodyHtml;
  root.hidden = false;
  mountIcons(root);

  if (typeof onMount === 'function') {
    const cleanup = onMount(bodyEl);
    if (typeof cleanup === 'function') {
      activeModalCleanup = cleanup;
    }
  }
}

/**
 * Accessible confirmation modal replacing browser window.confirm.
 */
export function confirmDialog({
  title = 'Confirm action',
  message,
  confirmLabel = 'Confirm',
  danger = false
}) {
  return new Promise((resolve) => {
    openModal(
      title,
      `
        <p style="margin:0 0 18px; color: var(--charcoal);">${escapeHtml(message)}</p>
        <div class="form-actions" style="margin-top: 8px;">
          <button type="button" class="btn btn-secondary" id="confirm-cancel-btn">Cancel</button>
          <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirm-ok-btn">
            ${escapeHtml(confirmLabel)}
          </button>
        </div>
      `,
      (bodyEl) => {
        let settled = false;
        const finish = (val) => {
          if (settled) return;
          settled = true;
          closeModal();
          resolve(val);
        };
        bodyEl.querySelector('#confirm-cancel-btn')?.addEventListener('click', () => finish(false));
        bodyEl.querySelector('#confirm-ok-btn')?.addEventListener('click', () => finish(true));
        return () => {
          if (!settled) {
            settled = true;
            resolve(false);
          }
        };
      }
    );
  });
}

export function statusBadgeHtml(computedStatus) {
  switch (computedStatus) {
    case 'overdue':
      return `<span class="badge badge-overdue">Overdue</span>`;
    case 'due_today':
      return `<span class="badge badge-due-today">Due Today</span>`;
    case 'upcoming':
      return `<span class="badge badge-upcoming">Upcoming</span>`;
    case 'completed':
      return `<span class="badge badge-completed">Completed</span>`;
    case 'skipped':
      return `<span class="badge badge-skipped">Skipped</span>`;
    default:
      return `<span class="badge badge-neutral">${escapeHtml(computedStatus)}</span>`;
  }
}

/**
 * Resolves IndexedDB image placeholders (`img[data-image-id]`) asynchronously.
 * @param {ParentNode} root
 */
export async function hydrateAsyncImages(root) {
  const imgs = Array.from(root.querySelectorAll('img[data-image-id]'));
  await Promise.all(
    imgs.map(async (img) => {
      const imageId = img.getAttribute('data-image-id');
      const fallback = img.getAttribute('data-fallback') || './images/default-plant.svg';
      if (!imageId) return;
      const src = await store.resolveImageSrc(imageId, fallback);
      if (src) img.src = src;
    })
  );
}
