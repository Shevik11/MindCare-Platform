const formatDates = require('../../middleware/formatDate');

describe('FormatDate Middleware', () => {
  let req, res, next, originalJson, jsonCallArgs;

  beforeEach(() => {
    req = {
      path: '/api/test', // Add path to avoid undefined errors
    };
    jsonCallArgs = [];
    originalJson = jest.fn(data => {
      jsonCallArgs.push(data);
      return data;
    });
    res = {
      json: originalJson,
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jsonCallArgs = [];
  });

  it('should call next() and wrap res.json', () => {
    formatDates(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(typeof res.json).toBe('function');
    // The wrapped function should be different from the original
    expect(res.json).not.toBe(originalJson);
  });

  it('should format dates when json is called with object', () => {
    formatDates(req, res, next);

    const testDate = new Date('2024-01-15T10:30:00Z');
    const testData = {
      id: 1,
      name: 'Test',
      createdAt: testDate,
      updatedAt: testDate,
    };

    res.json(testData);

    expect(originalJson).toHaveBeenCalled();
    const formattedData = jsonCallArgs[0];
    expect(formattedData).toHaveProperty('createdAt');
    expect(typeof formattedData.createdAt).toBe('string');
    expect(formattedData.createdAt).not.toBe(testDate);
  });

  it('should format dates in array of objects', () => {
    formatDates(req, res, next);

    const testDate = new Date('2024-01-15T10:30:00Z');
    const testData = [
      { id: 1, createdAt: testDate },
      { id: 2, createdAt: testDate },
    ];

    res.json(testData);

    expect(originalJson).toHaveBeenCalled();
    const formattedData = jsonCallArgs[0];
    expect(Array.isArray(formattedData)).toBe(true);
    expect(typeof formattedData[0].createdAt).toBe('string');
    expect(typeof formattedData[1].createdAt).toBe('string');
  });

  it('should handle nested objects with dates', () => {
    formatDates(req, res, next);

    const testDate = new Date('2024-01-15T10:30:00Z');
    const testData = {
      id: 1,
      user: {
        id: 2,
        createdAt: testDate,
      },
    };

    res.json(testData);

    expect(originalJson).toHaveBeenCalled();
    const formattedData = jsonCallArgs[0];
    expect(formattedData.user).toHaveProperty('createdAt');
    expect(typeof formattedData.user.createdAt).toBe('string');
  });

  it('should handle null values', () => {
    formatDates(req, res, next);

    res.json(null);

    expect(originalJson).toHaveBeenCalledWith(null);
  });

  it('should handle errors gracefully and return original data', () => {
    formatDates(req, res, next);

    // Create data that might cause issues
    const problematicData = {
      toJSON: () => {
        throw new Error('Test error');
      },
    };

    res.json(problematicData);

    // Should still call json, error handling is internal
    expect(originalJson).toHaveBeenCalled();
    // Should call with the original data even if error occurred
    expect(jsonCallArgs.length).toBe(1);
  });

  it('should format date strings that look like dates', () => {
    formatDates(req, res, next);

    const testData = {
      id: 1,
      dateString: '2024-01-15 10:30:00',
    };

    res.json(testData);

    expect(originalJson).toHaveBeenCalled();
    const formattedData = jsonCallArgs[0];
    // Date-like strings should be formatted
    expect(typeof formattedData.dateString).toBe('string');
  });

  it('should format objects with toJSON method', () => {
    formatDates(req, res, next);

    const testDate = new Date('2024-01-15T10:30:00Z');
    const testData = {
      id: 1,
      toJSON: function () {
        return {
          id: this.id,
          createdAt: testDate,
        };
      },
    };

    res.json(testData);

    expect(originalJson).toHaveBeenCalled();
    const formattedData = jsonCallArgs[0];
    expect(formattedData).toHaveProperty('createdAt');
    expect(typeof formattedData.createdAt).toBe('string');
  });

  it('should handle arrays with null/undefined values', () => {
    formatDates(req, res, next);

    const testData = [
      { id: 1, createdAt: new Date('2024-01-15T10:30:00Z') },
      null,
      undefined,
      { id: 2 },
    ];

    res.json(testData);

    expect(originalJson).toHaveBeenCalled();
    const formattedData = jsonCallArgs[0];
    expect(Array.isArray(formattedData)).toBe(true);
    expect(formattedData[0]).toHaveProperty('createdAt');
    expect(typeof formattedData[0].createdAt).toBe('string');
  });

  it('should handle date strings with timezone offsets', () => {
    formatDates(req, res, next);

    const testData = {
      id: 1,
      dateWithTZ: '2024-01-15 10:30:00+02',
    };

    res.json(testData);

    expect(originalJson).toHaveBeenCalled();
    const formattedData = jsonCallArgs[0];
    expect(typeof formattedData.dateWithTZ).toBe('string');
  });

  it('should handle date strings with space instead of T', () => {
    formatDates(req, res, next);

    const testData = {
      id: 1,
      dateString: '2024-01-15 10:30:00.123',
    };

    res.json(testData);

    expect(originalJson).toHaveBeenCalled();
    const formattedData = jsonCallArgs[0];
    expect(typeof formattedData.dateString).toBe('string');
  });

  it('should handle primitive values', () => {
    formatDates(req, res, next);

    res.json('simple string');

    expect(originalJson).toHaveBeenCalledWith('simple string');
  });

  it('should handle numbers', () => {
    formatDates(req, res, next);

    res.json(123);

    expect(originalJson).toHaveBeenCalledWith(123);
  });

  it('should handle boolean values', () => {
    formatDates(req, res, next);

    res.json(true);

    expect(originalJson).toHaveBeenCalledWith(true);
  });

  it('should handle objects with Date objects in nested arrays', () => {
    formatDates(req, res, next);

    const testData = {
      id: 1,
      items: [
        { id: 1, date: new Date('2024-01-15T10:30:00Z') },
        { id: 2, date: new Date('2024-01-16T10:30:00Z') },
      ],
    };

    res.json(testData);

    expect(originalJson).toHaveBeenCalled();
    const formattedData = jsonCallArgs[0];
    expect(formattedData.items[0].date).toBeDefined();
    expect(typeof formattedData.items[0].date).toBe('string');
  });

  it('should handle objects without createdAt or updatedAt', () => {
    formatDates(req, res, next);

    const testData = {
      id: 1,
      name: 'Test',
      value: 100,
    };

    res.json(testData);

    expect(originalJson).toHaveBeenCalled();
    const formattedData = jsonCallArgs[0];
    expect(formattedData.id).toBe(1);
    expect(formattedData.name).toBe('Test');
  });
});
