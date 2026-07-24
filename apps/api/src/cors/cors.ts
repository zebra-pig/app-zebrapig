/**
 * Credentialed CORS is only needed for browser callers. The public /t page is
 * rendered server-side (Nuxt SSR on Cloudflare) so it sends no Origin and is
 * unaffected. Browser-origin calls are restricted to the public site + local dev.
 */
const ALLOWED = [
  "https://zebrapig.com",
  "https://www.zebrapig.com",
  "http://localhost:3000",
  "http://localhost:3001",
];

export const allowedOrigins = (origin: string): string =>
  ALLOWED.includes(origin) ? origin : ALLOWED[0];
