import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

// Mock winston
const mockWinston = {
  addColors: jest.fn(),
  createLogger: jest.fn(),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    colorize: jest.fn(),
    printf: jest.fn(),
    json: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
};

jest.mock('winston', () => mockWinston);

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create logger with correct configuration', () => {
    // Import after mocks are set up
    const { logger } = require('../../../src/utils/logger');
    
    expect(mockWinston.createLogger).toHaveBeenCalledWith({
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        debug: 4,
      },
      transports: expect.any(Array),
      exitOnError: false,
    });
  });

  it('should add colors to winston', () => {
    require('../../../src/utils/logger');
    
    expect(mockWinston.addColors).toHaveBeenCalledWith({
      error: 'red',
      warn: 'yellow',
      info: 'green',
      http: 'magenta',
      debug: 'white',
    });
  });

  it('should create console transport with correct format', () => {
    require('../../../src/utils/logger');
    
    expect(mockWinston.transports.Console).toHaveBeenCalledWith({
      format: expect.any(Function),
    });
  });

  it('should create file transports for error and combined logs', () => {
    require('../../../src/utils/logger');
    
    expect(mockWinston.transports.File).toHaveBeenCalledTimes(2);
    
    // Check error log transport
    expect(mockWinston.transports.File).toHaveBeenCalledWith({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: expect.any(Function),
    });
    
    // Check combined log transport
    expect(mockWinston.transports.File).toHaveBeenCalledWith({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      format: expect.any(Function),
    });
  });

  it('should create logs directory if it does not exist', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    require('../../../src/utils/logger');
    
    expect(fs.existsSync).toHaveBeenCalledWith(path.join(process.cwd(), 'logs'));
    expect(fs.mkdirSync).toHaveBeenCalledWith(path.join(process.cwd(), 'logs'), { recursive: true });
  });

  it('should not create logs directory if it already exists', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    require('../../../src/utils/logger');
    
    expect(fs.existsSync).toHaveBeenCalledWith(path.join(process.cwd(), 'logs'));
    expect(fs.mkdirSync).not.toHaveBeenCalled();
  });

  it('should set correct log level based on NODE_ENV', () => {
    const originalEnv = process.env.NODE_ENV;
    
    // Test development environment
    process.env.NODE_ENV = 'development';
    jest.resetModules();
    require('../../../src/utils/logger');
    
    expect(mockWinston.createLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'debug',
      })
    );
    
    // Test production environment
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    require('../../../src/utils/logger');
    
    expect(mockWinston.createLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
      })
    );
    
    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });
});
