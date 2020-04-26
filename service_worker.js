
// give the cache for this app a particular name
const cache_name = 'maths_taths_app_cache';

// a list of static assets to cache
const static_assets = [
	'index.html',
	'src/app.js',
	'src/style.css',
	'manifest.json'
];


// install the cache objects
self.addEventListener('install', async e => {
	const cache = await caches.open( cache_name );
	await cache.addAll( static_assets );
	self.skipWaiting();
});

// activate
self.addEventListener('activate', e => {
	self.clients.claim();
});

// listen for fetch events from the client
self.addEventListener('fetch', async e => {

	// grab details of the request
	const req = await e.request.clone();
	const url = new URL( req.url );

	// for local files other than php
	if( url.pathname.slice(-3) != "php" ) {

		// prioritise cache first
		e.respondWith( cacheFirst( req ) );
	} else {

		// otherwise (mostly for php requests)
		// prioritise a network response
		e.respondWith( networkFirst( req ) );
	}
});

async function cacheFirst(req) {
	const cache = await caches.open(cache_name);

	// see if we have a valid result in cache already
	return await cache.match(req) || await fetch(req);
}

const networkFirst = async req => {

	// grab the cache
	const cache = await caches.open(cache_name);

	// try to get the data over the network
	try {
		return await fetch(req);

	// if the network request fails
	} catch (e) {
        if( req.method == "POST" ) return;
        return await cache.match( req );
	}
}
