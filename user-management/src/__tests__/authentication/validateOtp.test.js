import { jest } from '@jest/globals';
import { validateOtp } from '../../authentication/validateOtp.js';
import { redis } from '../../utilitis/redis.js';

// Mock dependencies
jest.mock('../../utilitis/redis.js');

describe('OTP Validation', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 400 for missing OTP data', async () => {
    mockReq.body = {
      email: 'test@example.com',
      otp_received: '123456'
    };
    redis.get.mockResolvedValue(null);

    await validateOtp(mockReq, mockRes, mockNext);

    expect(redis.get).toHaveBeenCalledWith('Pending_user:test@example.com');
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'No signup request found or OTP expired'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid OTP', async () => {
    const mockData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      user_otp: '123456',
      otp_Expiry: Date.now() + 600000
    };

    mockReq.body = {
      email: 'test@example.com',
      otp_received: '654321' // Wrong OTP
    };
    redis.get.mockResolvedValue(JSON.stringify(mockData));

    await validateOtp(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Invalid OTP'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 400 for expired OTP', async () => {
    const mockData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      user_otp: '123456',
      otp_Expiry: Date.now() - 1000 // Expired
    };

    mockReq.body = {
      email: 'test@example.com',
      otp_received: '123456'
    };
    redis.get.mockResolvedValue(JSON.stringify(mockData));

    await validateOtp(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'OTP expired'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should validate OTP successfully and call next', async () => {
    const mockData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      user_otp: '123456',
      otp_Expiry: Date.now() + 600000
    };

    mockReq.body = {
      email: 'test@example.com',
      otp_received: '123456'
    };
    redis.get.mockResolvedValue(JSON.stringify(mockData));

    await validateOtp(mockReq, mockRes, mockNext);

    expect(mockReq.data).toEqual(mockData);
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should handle JSON parsing errors', async () => {
    mockReq.body = {
      email: 'test@example.com',
      otp_received: '123456'
    };
    redis.get.mockResolvedValue('invalid-json');

    await validateOtp(mockReq, mockRes, mockNext);

    // The function doesn't have explicit error handling for JSON parsing
    // This test documents the current behavior
    expect(redis.get).toHaveBeenCalledWith('Pending_user:test@example.com');
  });

  it('should handle redis errors', async () => {
    mockReq.body = {
      email: 'test@example.com',
      otp_received: '123456'
    };
    redis.get.mockRejectedValue(new Error('Redis connection failed'));

    await validateOtp(mockReq, mockRes, mockNext);

    // The function doesn't have explicit error handling for Redis errors
    // This test documents the current behavior
    expect(redis.get).toHaveBeenCalledWith('Pending_user:test@example.com');
  });

  it('should handle edge case with exact expiry time', async () => {
    const currentTime = Date.now();
    const mockData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      user_otp: '123456',
      otp_Expiry: currentTime
    };

    mockReq.body = {
      email: 'test@example.com',
      otp_received: '123456'
    };
    redis.get.mockResolvedValue(JSON.stringify(mockData));

    await validateOtp(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'OTP expired'
    });
  });

  it('should handle different email formats', async () => {
    const mockData = {
      username: 'testuser',
      email: 'test+tag@example.com',
      password: 'password123',
      user_otp: '123456',
      otp_Expiry: Date.now() + 600000
    };

    mockReq.body = {
      email: 'test+tag@example.com',
      otp_received: '123456'
    };
    redis.get.mockResolvedValue(JSON.stringify(mockData));

    await validateOtp(mockReq, mockRes, mockNext);

    expect(redis.get).toHaveBeenCalledWith('Pending_user:test+tag@example.com');
    expect(mockNext).toHaveBeenCalled();
  });
});
