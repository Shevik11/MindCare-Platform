// Test db/models/Psychologist.js
const Psychologist = require('../../../db/models/Psychologist');

describe('Psychologist Model', () => {
  it('should export Psychologist model', () => {
    expect(Psychologist).toBeDefined();
  });

  it('should be the same as Psychologist from db/db', () => {
    const { Psychologist: PsychologistFromDb } = require('../../../db/db');
    expect(Psychologist).toBe(PsychologistFromDb);
  });
});
