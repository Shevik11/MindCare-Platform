// Test db/models/index.js
const { User, Psychologist, Comment } = require('../../../db/models');

describe('DB Models Index', () => {
  it('should export User model', () => {
    expect(User).toBeDefined();
  });

  it('should export Psychologist model', () => {
    expect(Psychologist).toBeDefined();
  });

  it('should export Comment model', () => {
    expect(Comment).toBeDefined();
  });
});
