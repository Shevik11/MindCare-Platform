
const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleString('uk-UA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatObjectDates = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
 
  let plainObj = obj;
  if (obj.toJSON && typeof obj.toJSON === 'function') {
    plainObj = obj.toJSON();
  }
  
 
  const formatted = { ...plainObj };
  
 
  if (formatted.createdAt) {
    formatted.createdAt = formatDate(formatted.createdAt);
  }
  
 
  if (formatted.updatedAt) {
    formatted.updatedAt = formatDate(formatted.updatedAt);
  }
  
 
  for (const key in formatted) {
    if (formatted[key] && typeof formatted[key] === 'object') {
      formatted[key] = formatObjectDates(formatted[key]);
    }
  }
  
  return formatted;
};

const formatDates = (req, res, next) => {
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    if (Array.isArray(data)) {
      data = data.map(item => formatObjectDates(item));
    } else {
      data = formatObjectDates(data);
    }
    return originalJson(data);
  };
  
  next();
};

module.exports = formatDates;
