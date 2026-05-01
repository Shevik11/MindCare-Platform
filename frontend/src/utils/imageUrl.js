// Utility to get correct image URL
// For local uploads (/uploads/...): join with VITE_API_URL when set, otherwise use the path as-is
// (same origin — Vite dev proxy, or production gateway/CDN in front of the app).
// External URLs (http://, https://) are used as-is.

const getImageUrl = imageUrl => {
  if (!imageUrl) return '';

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  if (imageUrl.startsWith('/uploads/')) {
    const base = import.meta.env.VITE_API_URL?.trim();
    if (base) {
      return new URL(imageUrl, base).href;
    }
    return imageUrl;
  }

  return imageUrl;
};

export default getImageUrl;
