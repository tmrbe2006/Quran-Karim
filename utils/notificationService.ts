// Simple In-App & Browser Push Notification Manager for Daily Adhkar

export interface NotificationSettings {
  enabled: boolean;
  morningTime: string; // "07:00"
  eveningTime: string; // "17:00"
  browserPermission: NotificationPermission | 'unsupported';
}

const NOTIFICATION_SETTINGS_KEY = 'quran_app_notifications_config';
const LAST_ALERT_DATE_KEY = 'quran_app_last_alert_dates';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  morningTime: '07:00',
  eveningTime: '17:00',
  browserPermission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
};

export function loadNotificationSettings(): NotificationSettings {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_SETTINGS;
  try {
    const saved = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    const perm: NotificationPermission | 'unsupported' = 'Notification' in window ? Notification.permission : 'unsupported';
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...parsed,
        browserPermission: perm
      };
    }
    return {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      browserPermission: perm
    };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save notification settings:', e);
  }
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    const settings = loadNotificationSettings();
    saveNotificationSettings({
      ...settings,
      browserPermission: permission
    });
    return permission;
  } catch (e) {
    console.warn('Error requesting notification permission:', e);
    return 'denied';
  }
}

/**
 * Dispatch system notification or service worker notification
 */
export function sendAdhkarNotification(title: string, body: string, category: 'morning' | 'evening'): void {
  if (typeof window === 'undefined') return;

  // 1. Try Browser HTML5 Notification
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: `adhkar-${category}`,
        dir: 'rtl',
        lang: 'ar'
      });
      notif.onclick = () => {
        window.focus();
      };
    } catch {
      // If direct constructor fails (e.g. mobile Chrome requiring service worker), try sw registration
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification(title, {
            body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: `adhkar-${category}`,
            dir: 'rtl',
            lang: 'ar'
          } as any);
        }).catch(() => {});
      }
    }
  }
}

/**
 * Check if morning or evening adhkar alert should fire right now based on local time
 */
export function checkAdhkarTimeTriggers(
  settings: NotificationSettings,
  onTriggerInAppToast?: (type: 'morning' | 'evening', title: string, body: string) => void
): void {
  if (!settings.enabled) return;

  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const todayKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

  let alertRecords: Record<string, boolean> = {};
  try {
    const stored = localStorage.getItem(LAST_ALERT_DATE_KEY);
    if (stored) alertRecords = JSON.parse(stored);
  } catch {}

  const [mHour, mMin] = settings.morningTime.split(':').map(Number);
  const [eHour, eMin] = settings.eveningTime.split(':').map(Number);

  // 1. Morning Check: window between mHour:mMin and 11:59 AM
  const morningKey = `${todayKey}_morning`;
  const isMorningTimeWindow = (currentHours > mHour || (currentHours === mHour && currentMinutes >= mMin)) && currentHours < 12;

  if (isMorningTimeWindow && !alertRecords[morningKey]) {
    alertRecords[morningKey] = true;
    localStorage.setItem(LAST_ALERT_DATE_KEY, JSON.stringify(alertRecords));

    const title = '☀️ حان وقت أذكار الصباح';
    const body = 'أصبحنا وأصبح الملك لله.. ابدأ يومك بذكر الله وحصّن نفسك بأذكار الصباح المباركة.';

    sendAdhkarNotification(title, body, 'morning');
    if (onTriggerInAppToast) {
      onTriggerInAppToast('morning', title, body);
    }
    return;
  }

  // 2. Evening Check: window between eHour:eMin and 23:59
  const eveningKey = `${todayKey}_evening`;
  const isEveningTimeWindow = (currentHours > eHour || (currentHours === eHour && currentMinutes >= eMin)) && currentHours < 24;

  if (isEveningTimeWindow && !alertRecords[eveningKey]) {
    alertRecords[eveningKey] = true;
    localStorage.setItem(LAST_ALERT_DATE_KEY, JSON.stringify(alertRecords));

    const title = '🌙 حان وقت أذكار المساء';
    const body = 'أمسينا وأمسى الملك لله.. حصّن نفسك وعائلتك بأذكار المساء واختم يومك بذكر الله.';

    sendAdhkarNotification(title, body, 'evening');
    if (onTriggerInAppToast) {
      onTriggerInAppToast('evening', title, body);
    }
    return;
  }
}
