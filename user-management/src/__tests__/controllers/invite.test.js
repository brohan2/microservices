import { jest } from '@jest/globals';
import invite from '../../controller/invite.js';
import { isExistingUser, invitedUserCreate } from '../../db_adapter.js';
import { sendToQueue } from '../../rabbitmq/producer.js';

// Mock dependencies
jest.mock('../../db_adapter.js', () => ({
  isExistingUser: jest.fn(),
  invitedUserCreate: jest.fn()
}));
jest.mock('../../rabbitmq/producer.js', () => ({
  sendToQueue: jest.fn()
}));

describe('Invite Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      data: {},
      user: {},
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  it('should return 400 for client_admin without organisation', async () => {
    mockReq.data = {
      inviteEmail: 'test@example.com',
      inviteRole: 'client_admin'
    };
    mockReq.user = {
      email: 'admin@example.com',
      id: 'user123'
    };
    mockReq.body = {}; // No organisation provided

    await invite(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Organisation required for client admin'
    });
  });

  it('should return 400 for existing user', async () => {
    mockReq.data = {
      inviteEmail: 'existing@example.com',
      inviteRole: 'operator'
    };
    mockReq.user = {
      email: 'admin@example.com',
      id: 'user123'
    };
    mockReq.body = {};
    isExistingUser.mockResolvedValue({ email: 'existing@example.com' });

    await invite(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'User already exits'
    });
  });

  it('should create invitation successfully for non-client_admin', async () => {
    mockReq.data = {
      inviteEmail: 'newuser@example.com',
      inviteRole: 'operator'
    };
    mockReq.user = {
      email: 'admin@example.com',
      id: 'user123'
    };
    mockReq.body = {};
    isExistingUser.mockResolvedValue(false);
    invitedUserCreate.mockResolvedValue({ success: true });
    sendToQueue.mockResolvedValue();

    await invite(mockReq, mockRes);

    expect(isExistingUser).toHaveBeenCalledWith({ email: 'newuser@example.com' }, expect.anything());
    expect(invitedUserCreate).toHaveBeenCalled();
    expect(sendToQueue).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'User saved successfully'
    });
  });

  it('should create invitation successfully for client_admin with organisation', async () => {
    mockReq.data = {
      inviteEmail: 'client@example.com',
      inviteRole: 'client_admin'
    };
    mockReq.user = {
      email: 'admin@example.com',
      id: 'user123'
    };
    mockReq.body = {
      organisation: 'Test Organisation'
    };
    isExistingUser.mockResolvedValue(false);
    invitedUserCreate.mockResolvedValue({ success: true });
    sendToQueue.mockResolvedValue();

    await invite(mockReq, mockRes);

    expect(invitedUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'client',
        inviteEmail: 'client@example.com',
        inviteRole: 'client_admin',
        email: 'admin@example.com',
        id: 'user123',
        organisation: 'Test Organisation'
      }),
      expect.anything()
    );
    expect(sendToQueue).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('should handle queue sending errors', async () => {
    mockReq.data = {
      inviteEmail: 'newuser@example.com',
      inviteRole: 'operator'
    };
    mockReq.user = {
      email: 'admin@example.com',
      id: 'user123'
    };
    mockReq.body = {};
    isExistingUser.mockResolvedValue(false);
    invitedUserCreate.mockResolvedValue({ success: true });
    sendToQueue.mockRejectedValue(new Error('Queue error'));

    await invite(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Failed to send message to queue'
    });
  });

  it('should handle internal server errors', async () => {
    mockReq.data = {
      inviteEmail: 'newuser@example.com',
      inviteRole: 'operator'
    };
    mockReq.user = {
      email: 'admin@example.com',
      id: 'user123'
    };
    mockReq.body = {};
    isExistingUser.mockRejectedValue(new Error('Database error'));

    await invite(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  it('should generate correct invite message', async () => {
    mockReq.data = {
      inviteEmail: 'test@example.com',
      inviteRole: 'operator'
    };
    mockReq.user = {
      email: 'admin@example.com',
      id: 'user123'
    };
    mockReq.body = {};
    isExistingUser.mockResolvedValue(false);
    invitedUserCreate.mockResolvedValue({ success: true });
    sendToQueue.mockResolvedValue();

    await invite(mockReq, mockRes);

    expect(sendToQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        content: expect.stringContaining('Hello, you have been invited as operator')
      })
    );
  });

  it('should create unique invite ID', async () => {
    mockReq.data = {
      inviteEmail: 'test@example.com',
      inviteRole: 'operator'
    };
    mockReq.user = {
      email: 'admin@example.com',
      id: 'user123'
    };
    mockReq.body = {};
    isExistingUser.mockResolvedValue(false);
    invitedUserCreate.mockResolvedValue({ success: true });
    sendToQueue.mockResolvedValue();

    await invite(mockReq, mockReq);

    expect(invitedUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        invite_id: expect.any(String)
      }),
      expect.anything()
    );
  });
});
