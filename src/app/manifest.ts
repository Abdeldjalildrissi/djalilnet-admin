import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DjalilNet Admin Portal',
    short_name: 'AdminPortal',
    description: 'Back-office administration for DjalilNet',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#3b82f6',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '16x16 32x32 64x64',
        type: 'image/x-icon',
      },
    ],
  }
}
