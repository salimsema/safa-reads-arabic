const CACHE_NAME = 'safa-arabic-offline-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/speech.js',
  '/js/sound.js',
  '/manifest.json',
  '/data/letters.json',
  '/assets/icons/icon-72.png',
  '/assets/icons/icon-96.png',
  '/assets/icons/icon-128.png',
  '/assets/icons/icon-144.png',
  '/assets/icons/icon-152.png',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-384.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/icon.svg',
  // Sound files
  '/sounds/1_alif.mp3',
  '/sounds/2_baa.mp3',
  '/sounds/3_taa.mp3',
  '/sounds/4_thaa.mp3',
  '/sounds/5_jeem.mp3',
  '/sounds/6_haa.mp3',
  '/sounds/7_khaa.mp3',
  '/sounds/8_daal.mp3',
  '/sounds/9_zaal.mp3',
  '/sounds/10_raa.mp3',
  '/sounds/11_zaa.mp3',
  '/sounds/12_seen.mp3',
  '/sounds/13_sheen.mp3',
  '/sounds/14_saad.mp3',
  '/sounds/15_daad.mp3',
  '/sounds/16_taah.mp3',
  '/sounds/17_zhaa.mp3',
  '/sounds/18_ain.mp3',
  '/sounds/19_ghain.mp3',
  '/sounds/20_faa.mp3',
  '/sounds/21_qaaf.mp3',
  '/sounds/22_kaaf.mp3',
  '/sounds/23_laam.mp3',
  '/sounds/24_meem.mp3',
  '/sounds/25_noon.mp3',
  '/sounds/26_haah.mp3',
  '/sounds/27_waw.mp3',
  '/sounds/28_hamzah.mp3',
  '/sounds/29_yaa.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return Promise.allSettled(
          STATIC_ASSETS.map(url =>
            cache.add(url).catch(err =>
              console.warn(`Failed to cache ${url}:`, err)
            )
          );
        });
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Not found', { status: 404 });
      });
    })
  );
});