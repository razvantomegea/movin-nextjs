import { type MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://app.getmovin.ai';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/subscription/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
