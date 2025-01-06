module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/'],
  moduleNameMapper: {
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@dto/(.*)$': '<rootDir>/src/dto/$1',
    '^@interfaces/(.*)$': '<rootDir>/src/interfaces/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@health/(.*)$': '<rootDir>/src/health/$1',
    '^@rabbitmq/(.*)$': '<rootDir>/src/rabbitmq/$1',
    '^@exceptions/(.*)$': '<rootDir>/src/exceptions/$1',
  },
}; 