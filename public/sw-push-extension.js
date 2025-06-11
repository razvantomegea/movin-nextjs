// Push notification extension for the main service worker
// This script should be imported by the main service worker

// Push notification handling
self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('Error parsing push data:', e);
    data = {
      title: 'Movin',
      body: event.data.text() || 'You have a new notification',
      icon: '/icons/icon-192.webp',
      badge: '/icons/icon-96.webp'
    };
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icons/icon-192.webp',
    badge: data.badge || '/icons/icon-96.webp',
    tag: data.tag || 'movin-notification',
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    vibrate: data.vibrate || [200, 100, 200],
    timestamp: Date.now(),
    ...(data.image && { image: data.image })
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Movin', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const rawUrl = event.notification.data?.url || '/dashboard';
  const urlToOpen = rawUrl.startsWith('/') ? rawUrl : '/dashboard';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // Try to focus existing window
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => {
            if ('navigate' in client) {
              return client.navigate(urlToOpen);
            }
          });
        }
      }
      
      // Open new window if no existing window found
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event);
  // Track notification dismissal if needed
});

console.log('Push notification extension loaded'); 