import { jest } from '@jest/globals';
import { invitedSignup, otpsignup, totpsignup } from '../../controller/invitedSignup.js';
import { isExistingUser, invitedUserSignup, secretSetup, EnableTotp } from '../../db_adapter.js';
import { generateToken } from '../../authentication/jwt.js';
import { sendOtp } from '../../utilitis/mail.js';
import { generateOTP } from '../../utilitis/otp.js';
import { redis } from '../../utilitis/redis.js';
import bcrypt from 'bcrypt';

// Mock dependencies
jest.mock('../../db_adapter.js', () => ({
  isExistingUser: jest.fn(),
  invitedUserSignup: jest.fn(),
  secretSetup: jest.fn(),
  EnableTotp: jest.fn()
}));
jest.mock('../../authentication/jwt.js', () => ({ generateToken: jest.fn() }));
jest.mock('../../utilitis/mail.js', () => ({ sendOtp: jest.fn() }));
jest.mock('../../utilitis/otp.js', () => ({ generateOTP: jest.fn() }));
jest.mock('../../utilitis/redis.js', () => ({ redis: { set: jest.fn(), get: jest.fn(), del: jest.fn() } }));

describe('Invited Signup Controller', () => {
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

  describe('invitedSignup', () => {
    it('should return 403 for invalid username', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
        confirmpassword: 'password123',
        username: 'ab', // Too short
        invite_id: 'test123',
        verification_preference: 'otp'
      };

      await invitedSignup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should return 403 for invalid email format', async () => {
      mockReq.body = {
        email: 'invalid-email',
        password: 'password123',
        confirmpassword: 'password123',
        username: 'testuser',
        invite_id: 'test123',
        verification_preference: 'otp'
      };

      await invitedSignup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should return 403 for password mismatch', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
        confirmpassword: 'different123',
        username: 'testuser',
        invite_id: 'test123',
        verification_preference: 'otp'
      };

      await invitedSignup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should return 404 for non-invited user', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
        confirmpassword: 'password123',
        username: 'testuser',
        invite_id: 'test123',
        verification_preference: 'otp'
      };
      isExistingUser.mockResolvedValue(false);

      await invitedSignup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'User not invited or already exists'
      });
    });

    it('should return 400 for already verified user', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
        confirmpassword: 'password123',
        username: 'testuser',
        invite_id: 'test123',
        verification_preference: 'otp'
      };
      const mockUser = {
        email: 'test@example.com',
        isVerified: true
      };
      isExistingUser.mockResolvedValue(mockUser);

      await invitedSignup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'User already signed up, please login'
      });
    });

    it('should handle OTP verification preference', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
        confirmpassword: 'password123',
        username: 'testuser',
        invite_id: 'test123',
        verification_preference: 'otp'
      };
      const mockUser = {
        email: 'test@example.com',
        isVerified: false
      };
      isExistingUser.mockResolvedValue(mockUser);
      generateOTP.mockReturnValue('123456');
      redis.set = jest.fn().mockResolvedValue();
      sendOtp.mockResolvedValue();

      await invitedSignup(mockReq, mockRes);

      expect(generateOTP).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalled();
      expect(sendOtp).toHaveBeenCalledWith('test@example.com', '123456');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Otp sent to email'
      });
    });

    it('should handle TOTP verification preference', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
        confirmpassword: 'password123',
        username: 'testuser',
        invite_id: 'test123',
        verification_preference: 'totp'
      };
      const mockUser = {
        email: 'test@example.com',
        isVerified: false
      };
      isExistingUser.mockResolvedValue(mockUser);
      bcrypt.hash = jest.fn().mockResolvedValue('hashedpassword');
      invitedUserSignup.mockResolvedValue({ success: true });
      
      // Mock the setupTOTP function
      const mockSetupTOTP = jest.fn().mockResolvedValue({
        qrCodeDataUrl: 'data:image/png;base64,mockqr',
        secret: 'mocksecret'
      });
      
      // Mock the secretSetup function
      secretSetup.mockResolvedValue({ success: true });

      await invitedSignup(mockReq, mockRes);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(invitedUserSignup).toHaveBeenCalled();
    });

    it('should handle internal server errors', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
        confirmpassword: 'password123',
        username: 'testuser',
        invite_id: 'test123',
        verification_preference: 'otp'
      };
      isExistingUser.mockRejectedValue(new Error('Database error'));

      await invitedSignup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      });
    });
  });

  describe('otpsignup', () => {
    it('should complete OTP signup successfully', async () => {
      const mockData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        invite_id: 'test123',
        user_otp: '123456',
        otp_Expiry: Date.now() + 600000
      };
      mockReq.data = mockData;
      
      bcrypt.hash = jest.fn().mockResolvedValue('hashedpassword');
      invitedUserSignup.mockResolvedValue({ success: true });
      generateToken.mockReturnValue('mock-jwt-token');
      redis.del = jest.fn().mockResolvedValue();

      await otpsignup(mockReq, mockRes);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(invitedUserSignup).toHaveBeenCalledWith({
        email: 'test@example.com',
        hashed_password: 'hashedpassword',
        username: 'testuser',
        twofactor: 'otp'
      }, expect.anything());
      expect(generateToken).toHaveBeenCalledWith({
        email: 'test@example.com',
        username: 'testuser'
      });
      expect(redis.del).toHaveBeenCalledWith(`pendingUser:test@example.com`);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User registered successfully',
        token: 'mock-jwt-token'
      });
    });

    it('should handle signup failures', async () => {
      mockReq.data = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        invite_id: 'test123',
        user_otp: '123456',
        otp_Expiry: Date.now() + 600000
      };
      
      bcrypt.hash = jest.fn().mockRejectedValue(new Error('Hash failed'));

      await otpsignup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Signup failed'
      });
    });
  });

  describe('totpsignup', () => {
    it('should complete TOTP signup successfully', async () => {
      mockReq.verified = true;
      mockReq.user = { email: 'test@example.com' };
      generateToken.mockReturnValue('mock-jwt-token');
      EnableTotp.mockResolvedValue({ success: true });

      await totpsignup(mockReq, mockRes);

      expect(EnableTotp).toHaveBeenCalledWith({ email: 'test@example.com' }, expect.anything());
      expect(generateToken).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'TOTP token verified successfully',
        token: 'mock-jwt-token'
      });
    });

    it('should return error for invalid TOTP', async () => {
      mockReq.verified = false;
      mockReq.user = { email: 'test@example.com' };

      await totpsignup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired TOTP token'
      });
    });

    it('should handle internal server errors', async () => {
      mockReq.verified = true;
      mockReq.user = { email: 'test@example.com' };
      EnableTotp.mockRejectedValue(new Error('Database error'));

      await totpsignup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'internal server error'
      });
    });
  });
});
