// Only register service worker in production and if supported
if (
  "serviceWorker" in navigator &&
  (window.location.protocol === "https:" || window.location.hostname === "localhost")
) {
  // Check if we're in a preview environment
  const isPreviewEnvironment =
    window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("vercel-preview")

  if (!isPreviewEnvironment) {
    window.addEventListener("load", () => {
      const swUrl = "/sw.js"

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log("ServiceWorker registration successful with scope: ", registration.scope)
        })
        .catch((err) => {
          console.error("ServiceWorker registration failed: ", err)
        })
    })
  } else {
    console.log("Service Worker registration skipped in preview environment")
  }
}
