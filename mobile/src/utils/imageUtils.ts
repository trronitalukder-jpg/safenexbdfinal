import { DEFAULT_HOST } from '../config';

/**
 * Resolves an image URL to an absolute path pointing to the backend static file server,
 * or returns the URL directly if already absolute or base64.
 */
export function getImageUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  const backendBase = `http://${DEFAULT_HOST}:5000`;
  return `${backendBase}${cleanPath}`;
}

export const resolveImageUrl = getImageUrl;

