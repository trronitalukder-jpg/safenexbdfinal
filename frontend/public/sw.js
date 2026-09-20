// SafnexBD Service Worker with Push Notification & Offline Support
const CACHE_NAME = 'safnexbd-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let browser handle requests normally
});

// Handle notification click to navigate to chat or wallet
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickUrl = event.notification?.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If client is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(clickUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(clickUrl);
      }
    })
  );
});

// Background push notification handler if push server is used
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || 'SafnexBD';
    const options = {
      body: payload.body || 'New update available',
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/icon-192.png',
      tag: payload.tag || 'safnexbd-alert',
      data: {
        url: payload.url || '/dashboard',
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Push handling error:', err);
  }
});
