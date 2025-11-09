// Utility to get correct image URL
// For local uploads (/uploads/), always prepend backend URL
// External URLs (http://, https://) are used as-is

const getImageUrl = imageUrl => {
  if (!imageUrl) return '';

  // If it's already a full URL (http:// or https://), use as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // If it starts with /uploads/, it's a local file - prepend backend URL
  // This ensures images load correctly regardless of dev server (vite/react-scripts)
  if (imageUrl.startsWith('/uploads/')) {
    const backendUrl = 'http://localhost:5000';
    return `${backendUrl}${imageUrl}`;
  }

  // Otherwise, return as-is
  return imageUrl;
};

export default getImageUrl;
