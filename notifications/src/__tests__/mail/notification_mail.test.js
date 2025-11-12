import { jest } from '@jest/globals';
import nodemailer from 'nodemailer';
import { sendEmail } from '../../mail/notification_mail.js';

// Mock nodemailer
jest.mock('nodemailer');

describe('Notification Mail Service', () => {
  let mockTransporter;

  beforeEach(() => {
    mockTransporter = {
      sendMail: jest.fn()
    };
    nodemailer.createTransport.mockReturnValue(mockTransporter);
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'mock-message-id' });

      const email = 'test@example.com';
      const content = 'Test email content';

      await sendEmail(email, content);

      expect(nodemailer.createTransporter).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: 'campusconnectofficial9@gmail.com',
          pass: 'slyiukvhoubxerpx'
        }
      });
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'SocialLen',
        to: 'test@example.com',
        subject: 'Invite User',
        text: 'Test email content'
      });
    });

    it('should handle different email addresses', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'mock-message-id' });

      const email = 'user+tag@example.com';
      const content = 'Welcome to our platform';

      await sendEmail(email, content);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'SocialLen',
        to: 'user+tag@example.com',
        subject: 'Invite User',
        text: 'Welcome to our platform'
      });
    });

    it('should handle different content types', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'mock-message-id' });

      const email = 'test@example.com';
      const content = 'HTML content with <b>bold</b> text';

      await sendEmail(email, content);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'SocialLen',
        to: 'test@example.com',
        subject: 'Invite User',
        text: 'HTML content with <b>bold</b> text'
      });
    });

    it('should handle empty content', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'mock-message-id' });

      const email = 'test@example.com';
      const content = '';

      await sendEmail(email, content);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'SocialLen',
        to: 'test@example.com',
        subject: 'Invite User',
        text: ''
      });
    });

    it('should handle long content', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'mock-message-id' });

      const email = 'test@example.com';
      const content = 'A'.repeat(10000); // Very long content

      await sendEmail(email, content);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'SocialLen',
        to: 'test@example.com',
        subject: 'Invite User',
        text: content
      });
    });

    it('should handle special characters in content', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'mock-message-id' });

      const email = 'test@example.com';
      const content = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';

      await sendEmail(email, content);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'SocialLen',
        to: 'test@example.com',
        subject: 'Invite User',
        text: 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?'
      });
    });

    it('should handle email sending errors', async () => {
      const error = new Error('SMTP connection failed');
      mockTransporter.sendMail.mockRejectedValue(error);

      const email = 'test@example.com';
      const content = 'Test content';

      await expect(sendEmail(email, content)).rejects.toThrow('SMTP connection failed');
    });

    it('should handle invalid email addresses', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Invalid email address'));

      const email = 'invalid-email';
      const content = 'Test content';

      await expect(sendEmail(email, content)).rejects.toThrow('Invalid email address');
    });

    it('should handle network errors', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Network timeout'));

      const email = 'test@example.com';
      const content = 'Test content';

      await expect(sendEmail(email, content)).rejects.toThrow('Network timeout');
    });

    it('should handle authentication errors', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Authentication failed'));

      const email = 'test@example.com';
      const content = 'Test content';

      await expect(sendEmail(email, content)).rejects.toThrow('Authentication failed');
    });

    it('should handle rate limiting errors', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Rate limit exceeded'));

      const email = 'test@example.com';
      const content = 'Test content';

      await expect(sendEmail(email, content)).rejects.toThrow('Rate limit exceeded');
    });
  });
});
