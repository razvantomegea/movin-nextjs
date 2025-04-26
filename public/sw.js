// This is the service worker with the combined offline experience (Offline page + Offline copy of pages)

const CACHE = "movin-offline"

// Skip waiting so that the new service worker activates immediately
self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

// Simple offline-first strategy
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  // Handle navigation requests differently
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If navigation fails, show the offline page
        return caches.match("/offline/")
      }),
    )
    return
  }

  // For all other requests, try the network first, then fall back to the cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If we got a valid response, clone it and update the cache
        if (response && response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // If the network is unavailable, try to match the request to the cache
        return caches.match(event.request)
      }),
  )
})

// Clear old caches during activation
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})
