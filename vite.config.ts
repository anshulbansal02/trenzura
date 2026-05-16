import { defineConfig } from 'vite'

import { cloudflare } from '@cloudflare/vite-plugin'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  server: {
    host: '127.0.0.1',
    port: 37149,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 39217,
    strictPort: true,
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true,
        failOnError: true,
        filter: ({ path }) => path === '/' || path.startsWith('/products'),
      },
    }),
    viteReact(),
  ],
})

export default config
