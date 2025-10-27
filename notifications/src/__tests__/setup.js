import { jest } from '@jest/globals';

// Mock environment variables
process.env.RABBITMQ_URL = 'amqp://localhost:5672';
process.env.PORT = '8001';

// Mock external dependencies
jest.mock('amqplib', () => ({
  connect: jest.fn(() => Promise.resolve({
    createChannel: jest.fn(() => Promise.resolve({
      assertQueue: jest.fn(),
      consume: jest.fn(),
      ack: jest.fn(),
      nack: jest.fn()
    }))
  }))
}));

jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn(() => Promise.resolve())
  }))
}));

// Global test setup
beforeAll(async () => {
  // Setup any global test configuration
});

afterAll(async () => {
  // Cleanup after all tests
});

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});
