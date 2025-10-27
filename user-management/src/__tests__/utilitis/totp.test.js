import { jest } from '@jest/globals';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import {
  generateTOTPSecret,
  generateQRCode,
  verifyTOTPToken
} from '../../utilitis/totp.js';

// Mock dependencies
jest.mock('speakeasy', () => ({
  generateSecret: jest.fn(),
  totp: { verify: jest.fn() }
}));
jest.mock('qrcode', () => ({
  toDataURL: jest.fn()
}));

describe('TOTP Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTOTPSecret', () => {
    it('should generate TOTP secret with correct parameters', () => {
      const mockSecret = {
        base32: 'mock-secret-base32',
        otpauth_url: 'otpauth://totp/UserManagementService%20(test@example.com)?secret=mock-secret-base32'
      };
      speakeasy.generateSecret.mockReturnValue(mockSecret);

      const result = generateTOTPSecret('test@example.com');

      expect(speakeasy.generateSecret).toHaveBeenCalledWith({
        name: 'UserManagementService (test@example.com)',
        length: 32
      });
      expect(result).toEqual({
        secret: 'mock-secret-base32',
        otpauthUrl: 'otpauth://totp/UserManagementService%20(test@example.com)?secret=mock-secret-base32'
      });
    });

    it('should handle different email formats', () => {
      const mockSecret = {
        base32: 'mock-secret-base32',
        otpauth_url: 'otpauth://totp/UserManagementService%20(test+tag@example.com)?secret=mock-secret-base32'
      };
      speakeasy.generateSecret.mockReturnValue(mockSecret);

      const result = generateTOTPSecret('test+tag@example.com');

      expect(speakeasy.generateSecret).toHaveBeenCalledWith({
        name: 'UserManagementService (test+tag@example.com)',
        length: 32
      });
      expect(result.secret).toBe('mock-secret-base32');
    });

    it('should handle special characters in email', () => {
      const mockSecret = {
        base32: 'mock-secret-base32',
        otpauth_url: 'otpauth://totp/UserManagementService%20(test.user@example.com)?secret=mock-secret-base32'
      };
      speakeasy.generateSecret.mockReturnValue(mockSecret);

      const result = generateTOTPSecret('test.user@example.com');

      expect(speakeasy.generateSecret).toHaveBeenCalledWith({
        name: 'UserManagementService (test.user@example.com)',
        length: 32
      });
    });
  });

  describe('generateQRCode', () => {
    it('should generate QR code successfully', async () => {
      const mockQRCode = 'data:image/png;base64,mockqrcode';
      QRCode.toDataURL.mockResolvedValue(mockQRCode);

      const otpauthUrl = 'otpauth://totp/UserManagementService%20(test@example.com)?secret=mock-secret';
      const result = await generateQRCode(otpauthUrl);

      expect(QRCode.toDataURL).toHaveBeenCalledWith(otpauthUrl);
      expect(result).toBe(mockQRCode);
    });

    it('should handle QR code generation errors', async () => {
      QRCode.toDataURL.mockRejectedValue(new Error('QR generation failed'));

      const otpauthUrl = 'otpauth://totp/UserManagementService%20(test@example.com)?secret=mock-secret';
      
      await expect(generateQRCode(otpauthUrl)).rejects.toThrow('Failed to generate QR code');
    });

    it('should handle different otpauth URLs', async () => {
      const mockQRCode = 'data:image/png;base64,mockqrcode';
      QRCode.toDataURL.mockResolvedValue(mockQRCode);

      const otpauthUrl = 'otpauth://totp/TestApp%20(user@example.com)?secret=testsecret&issuer=TestApp';
      const result = await generateQRCode(otpauthUrl);

      expect(QRCode.toDataURL).toHaveBeenCalledWith(otpauthUrl);
      expect(result).toBe(mockQRCode);
    });
  });

  describe('verifyTOTPToken', () => {
    it('should verify valid TOTP token', () => {
      speakeasy.totp.verify.mockReturnValue(true);

      const result = verifyTOTPToken('123456', 'mock-secret');

      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: 'mock-secret',
        encoding: 'base32',
        token: '123456',
        window: 2
      });
      expect(result).toBe(true);
    });

    it('should reject invalid TOTP token', () => {
      speakeasy.totp.verify.mockReturnValue(false);

      const result = verifyTOTPToken('654321', 'mock-secret');

      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: 'mock-secret',
        encoding: 'base32',
        token: '654321',
        window: 2
      });
      expect(result).toBe(false);
    });

    it('should handle different token formats', () => {
      speakeasy.totp.verify.mockReturnValue(true);

      const result = verifyTOTPToken('000000', 'mock-secret');

      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: 'mock-secret',
        encoding: 'base32',
        token: '000000',
        window: 2
      });
      expect(result).toBe(true);
    });

    it('should handle empty secret', () => {
      speakeasy.totp.verify.mockReturnValue(false);

      const result = verifyTOTPToken('123456', '');

      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: '',
        encoding: 'base32',
        token: '123456',
        window: 2
      });
      expect(result).toBe(false);
    });

    it('should handle null secret', () => {
      speakeasy.totp.verify.mockReturnValue(false);

      const result = verifyTOTPToken('123456', null);

      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: null,
        encoding: 'base32',
        token: '123456',
        window: 2
      });
      expect(result).toBe(false);
    });

    it('should handle speakeasy errors', () => {
      speakeasy.totp.verify.mockImplementation(() => {
        throw new Error('Speakeasy error');
      });

      expect(() => verifyTOTPToken('123456', 'mock-secret')).toThrow('Speakeasy error');
    });
  });
});
