import { Logger } from '@nestjs/common';

// Disable logging during tests
Logger.prototype.log = jest.fn();
Logger.prototype.error = jest.fn();
Logger.prototype.warn = jest.fn();
Logger.prototype.debug = jest.fn();
Logger.prototype.verbose = jest.fn();

// Set test timeout
jest.setTimeout(10000);

// Mock crypto for consistent UUIDs in tests
const mockUUID = '00000000-0000-0000-0000-000000000000';
global.crypto = {
  randomUUID: () => mockUUID,
  subtle: {} as SubtleCrypto,
  getRandomValues: <T extends ArrayBufferView | null>(array: T): T => array,
} as Crypto;

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
}); 