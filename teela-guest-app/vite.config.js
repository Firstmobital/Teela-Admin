import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      manifest: {
        name: 'Teela Resort',
        short_name: 'Teela',
        description: 'Guest management app for Teela luxury glamping resort',
        theme_color: '#3D1F08',
        background_color: '#F9F6F1',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'portrait-primary',
        categories: ['travel', 'hospitality'],
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}'],
        ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/staff\/login/,
          /^\/stay\/verify/,
        ],
        runtimeCaching: [
          // Cache menu items (read-only, safe to cache)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/menu_items/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'menu-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
              },
            },
          },
          // Cache activities (read-only, safe to cache)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/activities/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'activities-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
              },
            },
          },
          // Cache guest preferences (read-heavy, can cache with longer expiry)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/reservations/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'reservations-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
            },
          },
          // DO NOT cache: chat_messages, food_orders, sos_alerts, bill data, payments
          // These require real-time updates and must be fetched fresh
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
})

