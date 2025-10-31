
const formatDate = (dateString) => {
  if (!dateString) return null;
  // Normalize common non-ISO formats, e.g. "YYYY-MM-DD HH:mm:ss.SSS+02"
  let normalized = String(dateString);
  // Replace space between date and time with 'T'
  normalized = normalized.replace(/^(\d{4}-\d{2}-\d{2})\s(\d{2}:\d{2}:\d{2}(?:\.\d+)?)/, '$1T$2');
  // Ensure timezone like +02 becomes +02:00 to be ISO-compatible
  normalized = normalized.replace(/([+-]\d{2})(?!:)(?!\d)/, '$1:00');
  const date = new Date(normalized);
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
  if (obj == null) return obj;

  if (obj instanceof Date) {
    return formatDate(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => formatObjectDates(item));
  }

  if (typeof obj !== 'object') return obj;

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
    if (!Object.prototype.hasOwnProperty.call(formatted, key)) continue;
    const value = formatted[key];
    if (value instanceof Date) {
      formatted[key] = formatDate(value);
    } else if (typeof value === 'string') {
      // Detect likely date strings and format them
      const isDateLike = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2}|[+-]\d{2})?$/.test(value);
      if (isDateLike) {
        formatted[key] = formatDate(value);
        continue;
      }
    } else if (value && typeof value === 'object') {
      formatted[key] = formatObjectDates(value);
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
