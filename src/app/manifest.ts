import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Campus Solver',
    short_name: 'CSolver',
    description: 'AI-powered grievance tracking that ensures accountability, transparency, and resolution for every campus issue.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#F7F6F3',
    theme_color: '#F7F6F3',
    icons: [
      {
        src: '/icon-192x192.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/icon-512x512.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  }
}
