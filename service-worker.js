// service-worker.js
const CACHE = 'cvpro-full-logs-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/favicon.svg',
  './css/app.css',
  './js/log.js',
  './js/app.js',
  './js/blocks.js',
  './js/drag.js',
  './js/inspector.js',
  './js/ai.js',
  './js/domutil.js',
  './js/exporter.js',
  './js/state.js',
  './templates/templates.json'
];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(CACHE).then(c=> c.addAll(ASSETS))); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(keys=> Promise.all(keys.filter(k=>k!==CACHE).map(k=> caches.delete(k))))); });
self.addEventListener('fetch', e=>{ e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request))); });
