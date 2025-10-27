import { jest } from '@jest/globals';

// Test env
process.env.NODE_ENV = 'test';
process.env.JWT_TOKEN = 'test-jwt-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test_user_management';
process.env.RABBITMQ_URL = 'amqp://localhost:5672';
process.env.PORT = '8000';

// Mock external dependencies
jest.mock('mongoose', () => ({
  connect: jest.fn(() => Promise.resolve()),
  model: jest.fn(),
  Schema: jest.fn(function () { return {}; }),
  Types: { ObjectId: jest.fn() }
}));

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    disconnect: jest.fn()
  }))
}));

jest.mock('amqplib', () => ({
  connect: jest.fn(() => Promise.resolve({
    createChannel: jest.fn(() => Promise.resolve({
      assertQueue: jest.fn(),
      sendToQueue: jest.fn(),
      consume: jest.fn(),
      ack: jest.fn(),
      nack: jest.fn()
    }))
  }))
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(() => Promise.resolve())
  }))
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn()
}));

jest.mock('speakeasy', () => ({
  generateSecret: jest.fn(),
  totp: { verify: jest.fn() }
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn()
}));

beforeAll(async () => {});
afterAll(async () => {});
beforeEach(() => { jest.clearAllMocks(); });
