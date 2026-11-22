const CACHE_PREFIX = 'iktis-'
const CACHE_NAME = `${CACHE_PREFIX}public-shell-v2`
const OWNED_CACHE_NAMES = new Set([
  'iktis-public-shell-v1',
  CACHE_NAME,
])
const SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
]
const PUBLIC_NAVIGATION_PATHS = new Set([
  '/',
  '/landing',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/privacy',
  '/terms',
])

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => OWNED_CACHE_NAMES.has(cacheName) && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      ))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const requestUrl = new URL(request.url)

  // Only handle safe, same-origin GET requests. API calls—including same-origin
  // /api rewrites—must always go to the network with cookies intact.
  if (
    request.method !== 'GET'
    || requestUrl.origin !== self.location.origin
    || requestUrl.pathname.startsWith('/api/')
  ) {
    return
  }

  if (request.mode === 'navigate') {
    if (!PUBLIC_NAVIGATION_PATHS.has(requestUrl.pathname)) return

    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html')),
    )
    return
  }

  // Cache only static resources. Private JSON responses and document navigations
  // are deliberately excluded to prevent stale authenticated data.
  if (!['script', 'style', 'image', 'font'].includes(request.destination)) return

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse

      return fetch(request).then((response) => {
        if (!response.ok) return response
        const responseCopy = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy))
        return response
      })
    }),
  )
})
