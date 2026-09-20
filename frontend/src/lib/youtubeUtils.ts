/**
 * Utility functions for parsing and rendering YouTube videos and thumbnails.
 */

export function extractYouTubeVideoId(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  // Matches youtu.be, youtube.com/watch?v=, youtube.com/embed/, youtube.com/shorts/, etc.
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  // Direct 11-character video ID fallback
  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export function getYouTubeEmbedUrl(url?: string | null): string | null {
  const videoId = extractYouTubeVideoId(url);
  return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
}

export function getYouTubeThumbnailUrl(url?: string | null): string | null {
  const videoId = extractYouTubeVideoId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
}

