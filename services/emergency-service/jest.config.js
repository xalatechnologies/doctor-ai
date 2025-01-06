module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/$1',
    '^@controllers/(.*)$': '<rootDir>/controllers/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@dto/(.*)$': '<rootDir>/dto/$1',
    '^@interfaces/(.*)$': '<rootDir>/interfaces/$1',
    '^@exceptions/(.*)$': '<rootDir>/exceptions/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@health/(.*)$': '<rootDir>/health/$1',
    '^@test/(.*)$': '<rootDir>/../test/$1'
  }
}; 