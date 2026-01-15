import API_BASE_URL from '../config/api';

const getImageUrl = imageUrl => {
  if (!imageUrl) return '';

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  if (imageUrl.startsWith('/uploads/')) {
    return `${API_BASE_URL}${imageUrl}`;
  }

  return imageUrl;
};

export default getImageUrl;
