// Test setup file
import { logger } from '../src/utils/logger';

// Set test environment
process.env.NODE_ENV = 'test';

// Mock logger for tests to avoid console output
jest.mock('../src/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    level: 'error',
  },
}));

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
