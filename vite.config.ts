import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: [
            'favicon.ico',
            'apple-touch-icon.png',
            'icon.svg',
            'pwa-192x192.png',
            'pwa-512x512.png',
            'pwa-maskable-512x512.png',
            'tailwindcss.js',
            'data/quran-uthmani.json',
            'data/tafsir-jalalayn.json',
            'data/surahs.json'
          ],
          manifest: {
            id: '/',
            name: 'القرآن الكريم - المصحف الرقمي',
            short_name: 'القرآن',
            description: 'تطبيق متقدم لتلاوة القرآن الكريم والأذكار وتحديد القبلة بدون اتصال بالإنترنت.',
            theme_color: '#051d14',
            background_color: '#020d09',
            display: 'standalone',
            start_url: '/',
            scope: '/',
            dir: 'rtl',
            lang: 'ar',
            icons: [
              {
                src: '/pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
              },
              {
                src: '/pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
              },
              {
                src: '/pwa-maskable-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
              },
            ],
          },
          workbox: {
            maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json}'],
            navigateFallback: '/index.html',
            navigateFallbackDenylist: [/^\/api/],
            cleanupOutdatedCaches: true,
            clientsClaim: true,
            skipWaiting: true,
            runtimeCaching: [
              {
                urlPattern: ({ url }) => url.pathname.startsWith('/data/'),
                handler: 'CacheFirst',
                options: {
                  cacheName: 'quran-bundled-data',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365,
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365,
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'gstatic-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365,
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              {
                urlPattern: /^https:\/\/cdn\.tailwindcss\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'tailwindcss-cache',
                  expiration: {
                    maxEntries: 5,
                    maxAgeSeconds: 60 * 60 * 24 * 30,
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              {
                urlPattern: /^https:\/\/api\.alquran\.cloud\/v1\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'quran-api-cache',
                  networkTimeoutSeconds: 3,
                  expiration: {
                    maxEntries: 300,
                    maxAgeSeconds: 60 * 60 * 24 * 60,
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              {
                urlPattern: /^https:\/\/everyayah\.com\/data\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'quran-audio-cache',
                  expiration: {
                    maxEntries: 2000,
                    maxAgeSeconds: 60 * 60 * 24 * 180,
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              {
                urlPattern: /^https:\/\/cdn\.islamic\.network\/quran\/audio\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'quran-audio-cache',
                  expiration: {
                    maxEntries: 2000,
                    maxAgeSeconds: 60 * 60 * 24 * 180,
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              }
            ],
          },
          devOptions: {
            enabled: true,
            type: 'module',
          },
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
