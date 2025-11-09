// Test checkPassword script
const bcrypt = require('bcryptjs');

// Mock bcrypt
jest.mock('bcryptjs');

// Mock console to avoid cluttering test output
jest.spyOn(console, 'log').mockImplementation();
jest.spyOn(console, 'error').mockImplementation();

describe('checkPassword script', () => {
  let checkPasswordScript;

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-require the script to get fresh module
    delete require.cache[require.resolve('../../scripts/checkPassword')];
    checkPasswordScript = require('../../scripts/checkPassword');
  });

  it('should find matching password when hash matches', async () => {
    const hash = '$2b$10$testhash';

    bcrypt.compare.mockImplementation(password => {
      return Promise.resolve(password === 'password123');
    });

    const result = await checkPasswordScript.checkPassword(hash);

    expect(result.found).toBe(true);
    expect(result.password).toBe('password123');
  });

  it('should not find password when hash does not match any common password', async () => {
    const hash = '$2b$10$testhash';

    bcrypt.compare.mockResolvedValue(false);

    const result = await checkPasswordScript.checkPassword(hash);

    expect(result.found).toBe(false);
    expect(result.password).toBeNull();
    expect(bcrypt.compare).toHaveBeenCalled();
  });

  it('should handle bcrypt errors gracefully', async () => {
    const hash = '$2b$10$testhash';

    bcrypt.compare.mockRejectedValue(new Error('Bcrypt error'));

    const result = await checkPasswordScript.checkPassword(hash);

    expect(result.found).toBe(false);
    expect(result.password).toBeNull();
  });

  it('should export commonPasswords array', () => {
    expect(checkPasswordScript.commonPasswords).toBeDefined();
    expect(Array.isArray(checkPasswordScript.commonPasswords)).toBe(true);
    expect(checkPasswordScript.commonPasswords.length).toBeGreaterThan(0);
  });
});
