import { jest } from '@jest/globals';
import { generateOTP } from '../../utilitis/otp.js';

describe('OTP Utilities', () => {
  describe('generateOTP', () => {
    it('should generate a 6-digit OTP', () => {
      const otp = generateOTP();
      
      expect(otp).toMatch(/^\d{6}$/);
      expect(otp.length).toBe(6);
    });

    it('should generate different OTPs on multiple calls', () => {
      const otp1 = generateOTP();
      const otp2 = generateOTP();
      
      // While it's theoretically possible for them to be the same,
      // the probability is very low (1 in 1,000,000)
      expect(otp1).not.toBe(otp2);
    });

    it('should generate OTP within valid range', () => {
      const otp = generateOTP();
      const otpNumber = parseInt(otp);
      
      expect(otpNumber).toBeGreaterThanOrEqual(100000);
      expect(otpNumber).toBeLessThanOrEqual(999999);
    });

    it('should always return a string', () => {
      const otp = generateOTP();
      
      expect(typeof otp).toBe('string');
    });

    it('should generate multiple OTPs correctly', () => {
      const otps = [];
      for (let i = 0; i < 10; i++) {
        otps.push(generateOTP());
      }
      
      // All should be 6 digits
      otps.forEach(otp => {
        expect(otp).toMatch(/^\d{6}$/);
      });
      
      // Should have some variation (not all the same)
      const uniqueOtps = new Set(otps);
      expect(uniqueOtps.size).toBeGreaterThan(1);
    });
  });
});
