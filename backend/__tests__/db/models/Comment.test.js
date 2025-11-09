// Test db/models/Comment.js
const Comment = require('../../../db/models/Comment');

describe('Comment Model', () => {
  it('should export Comment model', () => {
    expect(Comment).toBeDefined();
  });

  it('should be the same as Comment from db/db', () => {
    const { Comment: CommentFromDb } = require('../../../db/db');
    expect(Comment).toBe(CommentFromDb);
  });
});
