/**
 * Browser Notification service for PlantCare.
 * Wraps the Web Notifications API cleanly and transparently reports
 * browser support and permission limitations.
 */

const notifiedThisSession = new Set();

export const NotificationService = {
  isSupported() {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  getPermission() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  },

  async requestPermission() {
    if (!this.isSupported()) {
      return { status: 'unsupported', granted: false };
    }
    try {
      const permission = await Notification.requestPermission();
      return { status: permission, granted: permission === 'granted' };
    } catch {
      return { status: this.getPermission(), granted: false };
    }
  },

  /**
   * Sends a browser notification if supported, permitted, and enabled by settings.
   * Deduplicates notifications per key during the active session.
   */
  notify(title, body, dedupeKey = null, enabled = true) {
    if (!enabled || !this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }
    if (dedupeKey && notifiedThisSession.has(dedupeKey)) {
      return false;
    }

    try {
      new Notification(title, {
        body,
        icon: './icons/plantcare-logo.svg',
        tag: dedupeKey || undefined
      });
      if (dedupeKey) notifiedThisSession.add(dedupeKey);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Triggers a gentle summary notification when due/overdue tasks exist on app open.
   */
  notifyDueSummary(overdueCount, dueTodayCount, enabled) {
    if (!enabled || (overdueCount === 0 && dueTodayCount === 0)) return false;
    const parts = [];
    if (overdueCount > 0) parts.push(`${overdueCount} overdue`);
    if (dueTodayCount > 0) parts.push(`${dueTodayCount} due today`);

    const todayKey = `summary:${new Date().toDateString()}:${overdueCount}:${dueTodayCount}`;
    return this.notify(
      'PlantCare Care Reminder',
      `You have ${parts.join(' and ')} plant care ${overdueCount + dueTodayCount === 1 ? 'task' : 'tasks'}.`,
      todayKey,
      enabled
    );
  }
};
