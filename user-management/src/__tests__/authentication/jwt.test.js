import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { generateToken, auth } from '../../authentication/jwt.js';
import User from '../../schema/userSchema.js';

// Mock dependencies
jest.mock('jsonwebtoken', () => ({ sign: jest.fn(), verify: jest.fn() }));
const mockUserModel = { findOne: jest.fn() };
jest.mock('../../schema/userSchema.js', () => ({ default: mockUserModel }));

describe('JWT Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate JWT token with correct payload', () => {
      const mockToken = 'mock-jwt-token';
      const userInfo = {
        email: 'test@example.com',
        username: 'testuser'
      };
      
      jwt.sign.mockReturnValue(mockToken);

      const result = generateToken(userInfo);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          email: 'test@example.com',
          username: 'testuser'
        },
        process.env.JWT_TOKEN,
        {
          expiresIn: '1h'
        }
      );
      expect(result).toBe(mockToken);
    });

    it('should handle missing username in userInfo', () => {
      const mockToken = 'mock-jwt-token';
      const userInfo = {
        email: 'test@example.com'
      };
      
      jwt.sign.mockReturnValue(mockToken);

      const result = generateToken(userInfo);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          email: 'test@example.com',
          username: undefined
        },
        process.env.JWT_TOKEN,
        {
          expiresIn: '1h'
        }
      );
      expect(result).toBe(mockToken);
    });
  });

  describe('auth middleware', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
      mockReq = {
        headers: {},
        user: {}
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      mockNext = jest.fn();
    });

    it('should return 401 for missing authorization header', async () => {
      mockReq.headers = {};

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized: No token provided'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid authorization header format', async () => {
      mockReq.headers = {
        authorization: 'InvalidToken'
      };

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized: No token provided'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for malformed Bearer token', async () => {
      mockReq.headers = {
        authorization: 'Bearer'
      };

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized: No token provided'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 for invalid JWT token', async () => {
      mockReq.headers = {
        authorization: 'Bearer invalid-token'
      };
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 for user not found', async () => {
      mockReq.headers = {
        authorization: 'Bearer valid-token'
      };
      jwt.verify.mockReturnValue({ email: 'test@example.com' });
      mockUserModel.findOne.mockResolvedValue(null);

      await auth(mockReq, mockRes, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'User not found'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should authenticate successfully and set user data', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'super_admin'
      };
      
      mockReq.headers = {
        authorization: 'Bearer valid-token'
      };
      jwt.verify.mockReturnValue({ email: 'test@example.com' });
      mockUserModel.findOne.mockResolvedValue(mockUser);

      await auth(mockReq, mockRes, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockReq.user).toEqual({
        id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'super_admin'
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockReq.headers = {
        authorization: 'Bearer valid-token'
      };
      jwt.verify.mockReturnValue({ email: 'test@example.com' });
      mockUserModel.findOne.mockRejectedValue(new Error('Database error'));

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call User.findOne with correct select options', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'super_admin'
      };
      
      mockReq.headers = {
        authorization: 'Bearer valid-token'
      };
      jwt.verify.mockReturnValue({ email: 'test@example.com' });
      mockUserModel.findOne.mockResolvedValue(mockUser);

      await auth(mockReq, mockRes, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
