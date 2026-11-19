import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'HardWorkAI — Assistente de IA',
    short_name: 'HardWorkAI',
    description:
      'Assistente de IA multi-provedor com roteamento inteligente, anexos multimodais, busca na web e conectores MCP.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#FAF9F5',
    theme_color: '#C96442',
    lang: 'pt-BR',
    categories: ['productivity', 'utilities'],
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
  };
}
