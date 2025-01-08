module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@dto/(.*)$': '<rootDir>/src/dto/$1',
    '^@interfaces/(.*)$': '<rootDir>/src/interfaces/$1',
    '^@app/common/messaging/(.*)$': '<rootDir>/../../src/common/messaging/$1',
    '^@app/common/services/(.*)$': '<rootDir>/../../src/common/services/$1',
    '^@app/common/(.*)$': '<rootDir>/../../src/common/$1',
    '^@app/common$': '<rootDir>/../../src/common'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx'
      }
    }]
  },
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)"
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
}; 