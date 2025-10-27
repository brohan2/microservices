import { jest } from '@jest/globals';
import { consumeQueue } from '../../rabbitmq/consumer.js';
import { getChannel, getQueueName } from '../../rabbitmq/setup.js';
import { sendEmail } from '../../mail/notification_mail.js';

// Mock dependencies
jest.mock('../../rabbitmq/setup.js');
jest.mock('../../mail/notification_mail.js');

describe('RabbitMQ Consumer', () => {
  let mockChannel;
  let mockQueueName;

  beforeEach(() => {
    mockChannel = {
      consume: jest.fn(),
      ack: jest.fn(),
      nack: jest.fn()
    };
    mockQueueName = 'notification_queue';
    
    getChannel.mockReturnValue(mockChannel);
    getQueueName.mockReturnValue(mockQueueName);
    jest.clearAllMocks();
  });

  describe('consumeQueue', () => {
    it('should set up message consumption', async () => {
      await consumeQueue();

      expect(getChannel).toHaveBeenCalled();
      expect(getQueueName).toHaveBeenCalled();
      expect(mockChannel.consume).toHaveBeenCalledWith(
        'notification_queue',
        expect.any(Function)
      );
    });

    it('should handle null message', async () => {
      await consumeQueue();

      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      await consumeCallback(null);

      expect(sendEmail).not.toHaveBeenCalled();
      expect(mockChannel.ack).not.toHaveBeenCalled();
      expect(mockChannel.nack).not.toHaveBeenCalled();
    });

    it('should process valid message successfully', async () => {
      const mockMessage = {
        content: Buffer.from(JSON.stringify({
          to: 'test@example.com',
          content: 'Test email content'
        }))
      };

      sendEmail.mockResolvedValue();

      await consumeQueue();

      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      await consumeCallback(mockMessage);

      expect(sendEmail).toHaveBeenCalledWith('test@example.com', 'Test email content');
      expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
    });

    it('should handle email sending errors with retry', async () => {
      const mockMessage = {
        content: Buffer.from(JSON.stringify({
          to: 'test@example.com',
          content: 'Test email content'
        }))
      };

      const error = new Error('Email sending failed');
      sendEmail.mockRejectedValue(error);

      await consumeQueue();

      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      await consumeCallback(mockMessage);

      expect(sendEmail).toHaveBeenCalledWith('test@example.com', 'Test email content');
      expect(mockChannel.nack).toHaveBeenCalledWith(mockMessage, false, true);
      expect(mockChannel.ack).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON in message', async () => {
      const mockMessage = {
        content: Buffer.from('invalid-json')
      };

      await consumeQueue();

      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      
      // Should not throw error, but handle gracefully
      await expect(consumeCallback(mockMessage)).rejects.toThrow();
    });

    it('should handle message with missing fields', async () => {
      const mockMessage = {
        content: Buffer.from(JSON.stringify({
          to: 'test@example.com'
          // Missing content field
        }))
      };

      sendEmail.mockResolvedValue();

      await consumeQueue();

      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      await consumeCallback(mockMessage);

      expect(sendEmail).toHaveBeenCalledWith('test@example.com', undefined);
      expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
    });

    it('should handle message with empty content', async () => {
      const mockMessage = {
        content: Buffer.from(JSON.stringify({
          to: 'test@example.com',
          content: ''
        }))
      };

      sendEmail.mockResolvedValue();

      await consumeQueue();

      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      await consumeCallback(mockMessage);

      expect(sendEmail).toHaveBeenCalledWith('test@example.com', '');
      expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
    });

    it('should handle different email addresses', async () => {
      const mockMessage = {
        content: Buffer.from(JSON.stringify({
          to: 'user+tag@example.com',
          content: 'Test email content'
        }))
      };

      sendEmail.mockResolvedValue();

      await consumeQueue();

      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      await consumeCallback(mockMessage);

      expect(sendEmail).toHaveBeenCalledWith('user+tag@example.com', 'Test email content');
      expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
    });

    it('should handle long content messages', async () => {
      const longContent = 'A'.repeat(10000);
      const mockMessage = {
        content: Buffer.from(JSON.stringify({
          to: 'test@example.com',
          content: longContent
        }))
      };

      sendEmail.mockResolvedValue();

      await consumeQueue();

      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      await consumeCallback(mockMessage);

      expect(sendEmail).toHaveBeenCalledWith('test@example.com', longContent);
      expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
    });

    it('should handle special characters in content', async () => {
      const mockMessage = {
        content: Buffer.from(JSON.stringify({
          to: 'test@example.com',
          content: 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?'
        }))
      };

      sendEmail.mockResolvedValue();

      await consumeQueue();

      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      await consumeCallback(mockMessage);

      expect(sendEmail).toHaveBeenCalledWith('test@example.com', 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?');
      expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
    });

    it('should handle network errors during email sending', async () => {
      const mockMessage = {
        content: Buffer.from(JSON.stringify({
          to: 'test@example.com',
          content: 'Test email content'
        }))
      };

      const networkError = new Error('Network timeout');
      sendEmail.mockRejectedValue(networkError);

      await consumeQueue();

      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      await consumeCallback(mockMessage);

      expect(sendEmail).toHaveBeenCalledWith('test@example.com', 'Test email content');
      expect(mockChannel.nack).toHaveBeenCalledWith(mockMessage, false, true);
    });

    it('should handle authentication errors during email sending', async () => {
      const mockMessage = {
        content: Buffer.from(JSON.stringify({
          to: 'test@example.com',
          content: 'Test email content'
        }))
      };

      const authError = new Error('Authentication failed');
      sendEmail.mockRejectedValue(authError);

      await consumeQueue();

      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      await consumeCallback(mockMessage);

      expect(sendEmail).toHaveBeenCalledWith('test@example.com', 'Test email content');
      expect(mockChannel.nack).toHaveBeenCalledWith(mockMessage, false, true);
    });
  });
});
