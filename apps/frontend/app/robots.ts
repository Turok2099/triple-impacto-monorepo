import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/auth/',
        '/dashboard/',
        '/login/',
        '/registro/',
        '/forgot-password/',
        '/reset-password/',
        '/completar-perfil/',
        '/donar/',
        '/homologacion-fiserv/',
        '/test-pagos-rest/',
        '/ongs/ong-template/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
