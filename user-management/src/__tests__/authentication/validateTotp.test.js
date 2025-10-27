import { jest } from '@jest/globals';
import { validateTOTP } from '../../authentication/validateTotp.js';
import { isExistingUser } from '../../db_adapter.js';
import { verifyTOTPToken } from '../../utilitis/totp.js';

// Mock dependencies
jest.mock('../../db_adapter.js');
jest.mock('../../utilitis/totp.js');

describe('TOTP Validation', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      verified: false,
      user: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 404 for user not found', async () => {
    mockReq.body = {
      email: 'nonexistent@example.com',
      token: '123456'
    };
    isExistingUser.mockResolvedValue(null);

    await validateTOTP(mockReq, mockRes, mockNext);

    expect(isExistingUser).toHaveBeenCalledWith({ email: 'nonexistent@example.com' }, expect.anything());
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'User not found or TOTP not set up'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid TOTP token', async () => {
    const mockUser = {
      email: 'test@example.com',
      totpSecret: 'mock-secret'
    };

    mockReq.body = {
      email: 'test@example.com',
      token: '123456'
    };
    isExistingUser.mockResolvedValue(mockUser);
    verifyTOTPToken.mockReturnValue(false);

    await validateTOTP(mockReq, mockRes, mockNext);

    expect(verifyTOTPToken).toHaveBeenCalledWith('123456', 'mock-secret');
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Invalid totp'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should validate TOTP successfully and call next', async () => {
    const mockUser = {
      email: 'test@example.com',
      totpSecret: 'mock-secret'
    };

    mockReq.body = {
      email: 'test@example.com',
      token: '123456'
    };
    isExistingUser.mockResolvedValue(mockUser);
    verifyTOTPToken.mockReturnValue(true);

    await validateTOTP(mockReq, mockRes, mockNext);

    expect(verifyTOTPToken).toHaveBeenCalledWith('123456', 'mock-secret');
    expect(mockReq.verified).toBe(true);
    expect(mockReq.user).toBe(mockUser);
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should handle TOTP verification errors', async () => {
    const mockUser = {
      email: 'test@example.com',
      totpSecret: 'mock-secret'
    };

    mockReq.body = {
      email: 'test@example.com',
      token: '123456'
    };
    isExistingUser.mockResolvedValue(mockUser);
    verifyTOTPToken.mockImplementation(() => {
      throw new Error('TOTP verification failed');
    });

    await validateTOTP(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Internal server error'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle database errors', async () => {
    mockReq.body = {
      email: 'test@example.com',
      token: '123456'
    };
    isExistingUser.mockRejectedValue(new Error('Database connection failed'));

    await validateTOTP(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Internal server error'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle user without TOTP secret', async () => {
    const mockUser = {
      email: 'test@example.com',
      totpSecret: null
    };

    mockReq.body = {
      email: 'test@example.com',
      token: '123456'
    };
    isExistingUser.mockResolvedValue(mockUser);
    verifyTOTPToken.mockReturnValue(false);

    await validateTOTP(mockReq, mockRes, mockNext);

    expect(verifyTOTPToken).toHaveBeenCalledWith('123456', null);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Invalid totp'
    });
  });

  it('should handle different token formats', async () => {
    const mockUser = {
      email: 'test@example.com',
      totpSecret: 'mock-secret'
    };

    mockReq.body = {
      email: 'test@example.com',
      token: '000000' // All zeros
    };
    isExistingUser.mockResolvedValue(mockUser);
    verifyTOTPToken.mockReturnValue(false);

    await validateTOTP(mockReq, mockRes, mockNext);

    expect(verifyTOTPToken).toHaveBeenCalledWith('000000', 'mock-secret');
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Invalid totp'
    });
  });

  it('should handle case sensitivity in email', async () => {
    const mockUser = {
      email: 'Test@Example.com',
      totpSecret: 'mock-secret'
    };

    mockReq.body = {
      email: 'test@example.com',
      token: '123456'
    };
    isExistingUser.mockResolvedValue(mockUser);
    verifyTOTPToken.mockReturnValue(true);

    await validateTOTP(mockReq, mockRes, mockNext);

    expect(isExistingUser).toHaveBeenCalledWith({ email: 'test@example.com' }, expect.anything());
    expect(mockNext).toHaveBeenCalled();
  });
});
