import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Private/auth surfaces and share-by-secret-link pages must not be indexed
        disallow: ['/api/', '/dashboard/', '/admin/', '/auth/', '/builder/', '/preview/', '/seller/', '/flyer/'],
      },
    ],
  }
}
