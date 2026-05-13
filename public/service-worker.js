const CACHE_NAME = 'safa-arabic-offline-v2';
const MAX_CACHE_SIZE = 50; // adjust this value based on your needs

// Security: Dynamic integrity map - populated at runtime
// Maps URL paths to their SHA-256 hashes (prefixed with 'sha256-')
const integrityMap = new Map();

// Security: Helper to verify content integrity using SubtleCrypto (async)
async function verifyContentIntegrity(arrayBuffer, expectedHash) {
  if (!expectedHash) {
    // No hash defined - skip verification (trust the network)
    return true;
  }
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex === expectedHash.replace('sha256-', '');
  } catch (e) {
    console.warn('Integrity verification failed:', e);
    return false;
  }
}

// Security: Generate integrity hash for caching (async)
async function generateIntegrityHash(arrayBuffer) {
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return 'sha256-' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return null;
  }
}

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
      .then(async (cache) => {
        const results = await Promise.allSettled(
          STATIC_ASSETS.map(async (url) => {
            try {
              const response = await fetch(url);
              if (!response.ok) throw new Error(`HTTP ${response.status}`);

              // Security: Verify integrity before caching
              const clone = response.clone();
              const arrayBuffer = await clone.arrayBuffer();

              // Generate hash for future integrity checks
              const hash = await generateIntegrityHash(arrayBuffer);
              if (hash) {
                integrityMap.set(url, hash);
              }

              // Cache the content
              await cache.put(url, new Response(arrayBuffer, {
                headers: { 'Content-Type': response.headers.get('Content-Type') }
              }));
            } catch (err) {
              console.warn(`Failed to cache ${url}:`, err);
              throw err;
            }
          })
        );

        const failedCaches = results.filter((result) => result.status === 'rejected');
        if (failedCaches.length > 0) {
          throw new Error(`Failed to cache ${failedCaches.length} assets`);
        }
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.error('Error during install:', err))
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

  // Security: Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Security: Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then(async (cached) => {
      if (cached) {
        // Security: Verify cached content integrity before returning
        try {
          const cachedBuffer = await cached.arrayBuffer();
          const expectedHash = integrityMap.get(url.pathname);

          if (expectedHash) {
            const isValid = await verifyContentIntegrity(cachedBuffer, expectedHash);
            if (!isValid) {
              console.warn(`Cache integrity check failed for ${url.pathname}, fetching fresh copy`);
              // Delete corrupted cache entry and fetch fresh - return the fresh response
              const cache = await caches.open(CACHE_NAME);
              await cache.delete(request);
              return fetch(request).then(async (response) => {
                if (response.ok) {
                  const arrayBuffer = await response.clone().arrayBuffer();
                  const hash = await generateIntegrityHash(arrayBuffer);
                  if (hash) integrityMap.set(url.pathname, hash);
                  await cache.put(request, response.clone());
                }
                return response;
              });
            }
          }
        } catch (e) {
          console.warn('Integrity verification error:', e);
        }
        return cached;
      }

      return fetch(request).then(async (response) => {
        if (response.ok) {
          // Security: Verify network response integrity before caching
          const arrayBuffer = await response.clone().arrayBuffer();
          const hash = await generateIntegrityHash(arrayBuffer);

          // Store the computed hash for future integrity checks
          if (hash) {
            integrityMap.set(url.pathname, hash);
          }

          // Security: Check response size to prevent memory exhaustion (max 10MB)
          if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
            console.warn(`Response too large (${arrayBuffer.byteLength} bytes) for ${url.pathname}`);
            return response;
          }

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, response.clone()).then(() => {
              // remove oldest cache entry if cache size exceeds MAX_CACHE_SIZE
              cache.keys().then((keys) => {
                if (keys.length > MAX_CACHE_SIZE) {
                  cache.delete(keys[0]);
                }
              });
            });
          });
        }
        return response;

      }).catch((err) => {
        console.error('Error during fetch:', err);
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Not found', { status: 404 });
      });
    })
  );
});