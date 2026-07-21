module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  clearMocks: true,
  collectCoverageFrom: [
    'backend/**/*.js',
    '!backend/**/node_modules/**'
  ]
};
