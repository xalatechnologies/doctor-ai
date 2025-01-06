module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.performance.spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/../../src/$1',
    '^@controllers/(.*)$': '<rootDir>/../../src/controllers/$1',
    '^@services/(.*)$': '<rootDir>/../../src/services/$1',
    '^@dto/(.*)$': '<rootDir>/../../src/dto/$1',
    '^@interfaces/(.*)$': '<rootDir>/../../src/interfaces/$1',
    '^@exceptions/(.*)$': '<rootDir>/../../src/exceptions/$1',
    '^@config/(.*)$': '<rootDir>/../../src/config/$1',
    '^@health/(.*)$': '<rootDir>/../../src/health/$1',
    '^@rabbitmq/(.*)$': '<rootDir>/../../src/rabbitmq/$1',
    '^@test/(.*)$': '<rootDir>/../$1'
  },
  testTimeout: 60000, // Increased timeout for performance tests
}; 