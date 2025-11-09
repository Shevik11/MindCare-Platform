// Test db/models/User.js
const User = require('../../../db/models/User');

describe('User Model', () => {
  it('should export User model', () => {
    expect(User).toBeDefined();
  });

  it('should be the same as User from db/db', () => {
    const { User: UserFromDb } = require('../../../db/db');
    expect(User).toBe(UserFromDb);
  });
});
