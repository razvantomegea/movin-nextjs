// Development-only service worker for PWA testing
const CACHE_NAME = 'movin-dev-v1';
const urlsToCache = [
  '/',
  '/manifest',
  '/icons/icon-192.webp',
  '/icons/icon-512.webp',
  '/offline.html'
];

// Install event - cache essential resources
self.addEventListener('install', function(event) {
  console.log('[Dev SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[Dev SW] Caching essential resources');
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.log('[Dev SW] Cache installation failed:', error);
      })
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('[Dev SW] Activating...');
  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('[Dev SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch event - network first strategy
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request)
      .catch(function() {
        // If network fails, try cache
        return caches.match(event.request)
          .then(function(response) {
            if (response) {
              return response;
            }
            
            // If no cache match and it's a page request, return offline page
            if (event.request.destination === 'document') {
              return caches.match('/offline.html');
            }
            
            return new Response('Offline content not available', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Push notification functionality
self.addEventListener('push', function(event) {
  console.log('[Dev SW] Push event received:', event);
  
  if (!event.data) {
    console.log('[Dev SW] Push event but no data');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('[Dev SW] Error parsing push data:', e);
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

// Notification click handler
self.addEventListener('notificationclick', function(event) {
  console.log('[Dev SW] Notification clicked:', event);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard';
  
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

// Notification close handler
self.addEventListener('notificationclose', function(event) {
  console.log('[Dev SW] Notification closed:', event);
});

console.log('[Dev SW] Development service worker loaded'); 