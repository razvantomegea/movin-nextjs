/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn't register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}

// Production service worker for PWA and push notifications
const CACHE_NAME = 'movin-prod-v1';
const urlsToCache = [
  '/',
  '/manifest',
  '/icons/icon-192.webp',
  '/icons/icon-512.webp'
];

// Install event - cache essential resources
self.addEventListener('install', function(event) {
  console.log('[Prod SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[Prod SW] Caching essential resources');
        // Use Promise.allSettled to handle individual cache failures gracefully
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn(`[Prod SW] Failed to cache ${url}:`, err);
              return null;
            })
          )
        );
      })
      .catch(function(error) {
        console.warn('[Prod SW] Cache installation failed:', error);
      })
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('[Prod SW] Activating...');
  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME && cacheName.includes('movin')) {
            console.log('[Prod SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).catch(error => {
      console.warn('[Prod SW] Cache cleanup failed:', error);
    })
  );
  
  self.clients.claim();
});

// Fetch event - network first strategy with intelligent caching
self.addEventListener('fetch', function(event) {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip non-HTTP(S) requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Skip API routes - they should always go to network
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone the response for caching
        const responseToCache = response.clone();
        
        // Cache successful responses for static assets
        if (response.status === 200 && (
          event.request.url.includes('.js') ||
          event.request.url.includes('.css') ||
          event.request.url.includes('.png') ||
          event.request.url.includes('.jpg') ||
          event.request.url.includes('.jpeg') ||
          event.request.url.includes('.webp') ||
          event.request.url.includes('.svg') ||
          event.request.url.includes('/icons/') ||
          event.request.destination === 'document'
        )) {
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            })
            .catch(err => {
              console.warn('[Prod SW] Failed to cache response:', err);
            });
        }
        
        return response;
      })
      .catch(() => {
        // Try to serve from cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            
            // If no cache match and it's a page request, return offline page
            if (event.request.destination === 'document') {
              return new Response(
                '<!DOCTYPE html><html><head><title>Offline - Movin</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,sans-serif;padding:2rem;text-align:center;background:#f5f5f5}h1{color:#333}button{padding:0.75rem 1.5rem;margin-top:1rem;background:#007bff;color:white;border:none;border-radius:0.5rem;cursor:pointer;font-size:1rem}button:hover{background:#0056b3}</style></head><body><h1>You are offline</h1><p>Please check your internet connection and try again.</p><button onclick="location.reload()">Retry</button></body></html>',
                { 
                  headers: { 
                    'Content-Type': 'text/html',
                    'Cache-Control': 'no-cache'
                  } 
                }
              );
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
  console.log('[Prod SW] Push event received:', event);
  
  if (!event.data) {
    console.log('[Prod SW] Push event but no data');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('[Prod SW] Error parsing push data:', e);
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
      .catch(error => {
        console.error('[Prod SW] Failed to show notification:', error);
      })
  );
});

// Notification click handler
self.addEventListener('notificationclick', function(event) {
  console.log('[Prod SW] Notification clicked:', event);
  
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
            } else {
              // Fallback: post message to client to navigate
              client.postMessage({ type: 'navigate', url: urlToOpen });
             }
           });
        }
      }
      
      // Open new window if no existing window found
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }).catch(error => {
      console.error('[Prod SW] Failed to handle notification click:', error);
    })
  );
});

// Notification close handler
self.addEventListener('notificationclose', function(event) {
  console.log('[Prod SW] Notification closed:', event);
});

// Handle service worker updates
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[Prod SW] Production service worker loaded');
