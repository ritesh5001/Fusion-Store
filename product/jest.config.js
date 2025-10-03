module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js']
};
