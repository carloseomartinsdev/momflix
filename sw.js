const CACHE_NAME = 'momflix-v1';
const urlsToCache = [
  '/',
  '/assets/css/main.css',
  '/assets/css/header.css',
  '/assets/css/cards.css',
  '/assets/css/badges.css',
  '/assets/css/modals.css',
  '/assets/js/app.js',
  '/assets/js/api.js',
  '/logoS.png',
  '/favicon.ico'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});