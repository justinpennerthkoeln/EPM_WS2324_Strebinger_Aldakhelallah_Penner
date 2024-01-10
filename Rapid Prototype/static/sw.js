const CACHE_NAME = `synhub-cache-v1`;

// Use the install event to pre-cache all initial resources.
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    cache.addAll([
      '/',
      'login',
      'register',
      'logout'
    ]);
  })());
});

self.addEventListener('fetch', event => {
  if(event.request.method === "POST"){} else {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
  
      // Get the resource from the cache.
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      } else {
          try {
            // If the resource was not in the cache, try the network.
            const fetchResponse = await fetch(event.request);
            
            await cache.put(event.request, await fetchResponse.clone());
  
            // Save the resource in the cache and return it.
            return await fetchResponse;
          } catch (e) {
            console.log(e);
          }
      }
    })());
  }
});
