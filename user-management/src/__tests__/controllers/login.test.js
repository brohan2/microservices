import { jest } from '@jest/globals';
import { login, verification } from '../../controller/login.js';
import { isExistingUser } from '../../db_adapter.js';
import { generateToken } from '../../authentication/jwt.js';
import { sendOtp } from '../../utilitis/mail.js';
import { generateOTP } from '../../utilitis/otp.js';
import { redis } from '../../utilitis/redis.js';
import bcrypt from 'bcrypt';

// Mock dependencies
jest.mock('../../db_adapter.js', () => ({ isExistingUser: jest.fn() }));
jest.mock('../../authentication/jwt.js', () => ({ generateToken: jest.fn(), auth: jest.fn() }));
jest.mock('../../utilitis/mail.js', () => ({ sendOtp: jest.fn() }));
jest.mock('../../utilitis/otp.js', () => ({ generateOTP: jest.fn() }));
jest.mock('../../utilitis/redis.js', () => ({ redis: { set: jest.fn(), get: jest.fn(), del: jest.fn() } }));

describe('Login Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      user: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should generate token and return success message', async () => {
      const mockToken = 'mock-jwt-token';
      const mockEmail = 'test@example.com';
      
      mockReq.user = { email: mockEmail };
      generateToken.mockReturnValue(mockToken);

      await login(mockReq, mockRes);

      expect(generateToken).toHaveBeenCalledWith({ email: mockEmail });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User login successfull',
        token: mockToken
      });
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      generateToken.mockImplementation(() => {
        throw new Error('Token generation failed');
      });

      await login(mockReq, mockRes);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('verification', () => {
    it('should return 400 for invalid email format', async () => {
      mockReq.body = {
        email: 'invalid-email',
        password: 'password123'
      };

      await verification(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Email or password formating is bad'
      });
    });

    it('should return 400 for short password', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: '123'
      };

      await verification(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Email or password formating is bad'
      });
    });

    it('should return 400 for non-existing user', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      isExistingUser.mockResolvedValue(false);

      await verification(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'User not registered'
      });
    });

    it('should return 400 for invalid password', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      const mockUser = {
        email: 'test@example.com',
        password: 'hashedpassword',
        isVerified: true,
        twofactor: 'none'
      };
      isExistingUser.mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await verification(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid creds'
      });
    });

    it('should return 400 for unverified user', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      const mockUser = {
        email: 'test@example.com',
        password: 'hashedpassword',
        isVerified: false,
        twofactor: 'none'
      };
      isExistingUser.mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      await verification(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'User not verifed, please signup using invite ID'
      });
    });

    it('should handle OTP verification flow', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      const mockUser = {
        email: 'test@example.com',
        password: 'hashedpassword',
        isVerified: true,
        twofactor: 'otp'
      };
      isExistingUser.mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      generateOTP.mockReturnValue('123456');
      redis.set = jest.fn().mockResolvedValue();
      sendOtp.mockResolvedValue();

      await verification(mockReq, mockRes, mockNext);

      expect(generateOTP).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalled();
      expect(sendOtp).toHaveBeenCalledWith('test@example.com', '123456');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        validationType: 'otp',
        message: 'Otp sent to email'
      });
    });

    it('should handle TOTP verification flow', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      const mockUser = {
        email: 'test@example.com',
        password: 'hashedpassword',
        isVerified: true,
        twofactor: 'totp'
      };
      isExistingUser.mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      await verification(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        validationType: 'totp',
        message: 'User verified, TOTP required'
      });
    });

    it('should handle super_admin direct login', async () => {
      mockReq.body = {
        email: 'admin@example.com',
        password: 'password123'
      };
      const mockUser = {
        email: 'admin@example.com',
        password: 'hashedpassword',
        isVerified: true,
        twofactor: 'none',
        role: 'super_admin'
      };
      isExistingUser.mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      generateToken.mockReturnValue('mock-token');

      // Mock the login function call
      const loginSpy = jest.spyOn({ login }, 'login');
      
      await verification(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle internal server errors', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      isExistingUser.mockRejectedValue(new Error('Database error'));

      await verification(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      });
    });
  });
});
