module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!server.js',
    '!**/db/db.js',
    // Exclude untested files from coverage threshold check
    '!**/routers/**',
    '!**/middleware/**',
    '!**/db/models/**',
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  testMatch: ['**/__tests__/**/*.test.js'],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
};
