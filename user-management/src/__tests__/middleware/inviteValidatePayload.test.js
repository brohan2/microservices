import { jest } from '@jest/globals';
import inviteValidatePayload from '../../middleware/inviteValidatePayload.js';

describe('Invite Validate Payload Middleware', () => {
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

    it('should return 422 for invalid email format', async () => {
      mockReq.body = {
        inviteEmail: 'invalid-email',
        inviteRole: 'super_admin'
      };

      await inviteValidatePayload(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(422);
      expect(mockRes.json).toHaveBeenCalledWith({
        errors: expect.any(Array)
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

  it('should return 422 for invalid role', async () => {
    mockReq.body = {
      inviteEmail: 'test@example.com',
      inviteRole: 'invalid_role'
    };

    await inviteValidatePayload(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(422);
    expect(mockRes.json).toHaveBeenCalledWith({
      errors: expect.any(Array)
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should validate super_admin role successfully', async () => {
    mockReq.body = {
      inviteEmail: 'admin@example.com',
      inviteRole: 'super_admin'
    };

    await inviteValidatePayload(mockReq, mockRes, mockNext);

    expect(mockReq.data).toEqual({
      inviteEmail: 'admin@example.com',
      inviteRole: 'super_admin'
    });
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should validate site_admin role successfully', async () => {
    mockReq.body = {
      inviteEmail: 'siteadmin@example.com',
      inviteRole: 'site_admin'
    };

    await inviteValidatePayload(mockReq, mockRes, mockNext);

    expect(mockReq.data).toEqual({
      inviteEmail: 'siteadmin@example.com',
      inviteRole: 'site_admin'
    });
    expect(mockNext).toHaveBeenCalled();
  });

  it('should validate operator role successfully', async () => {
    mockReq.body = {
      inviteEmail: 'operator@example.com',
      inviteRole: 'operator'
    };

    await inviteValidatePayload(mockReq, mockRes, mockNext);

    expect(mockReq.data).toEqual({
      inviteEmail: 'operator@example.com',
      inviteRole: 'operator'
    });
    expect(mockNext).toHaveBeenCalled();
  });

  it('should validate client_admin role successfully', async () => {
    mockReq.body = {
      inviteEmail: 'clientadmin@example.com',
      inviteRole: 'client_admin'
    };

    await inviteValidatePayload(mockReq, mockRes, mockNext);

    expect(mockReq.data).toEqual({
      inviteEmail: 'clientadmin@example.com',
      inviteRole: 'client_admin'
    });
    expect(mockNext).toHaveBeenCalled();
  });

  it('should validate client_user role successfully', async () => {
    mockReq.body = {
      inviteEmail: 'clientuser@example.com',
      inviteRole: 'client_user'
    };

    await inviteValidatePayload(mockReq, mockRes, mockNext);

    expect(mockReq.data).toEqual({
      inviteEmail: 'clientuser@example.com',
      inviteRole: 'client_user'
    });
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle missing inviteEmail', async () => {
    mockReq.body = {
      inviteRole: 'super_admin'
    };

    await inviteValidatePayload(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(422);
    expect(mockRes.json).toHaveBeenCalledWith({
      errors: expect.any(Array)
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle missing inviteRole', async () => {
    mockReq.body = {
      inviteEmail: 'test@example.com'
    };

    await inviteValidatePayload(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(422);
    expect(mockRes.json).toHaveBeenCalledWith({
      errors: expect.any(Array)
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle empty body', async () => {
    mockReq.body = {};

    await inviteValidatePayload(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(422);
    expect(mockRes.json).toHaveBeenCalledWith({
      errors: expect.any(Array)
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle case sensitivity in email', async () => {
    mockReq.body = {
      inviteEmail: 'Test@Example.COM',
      inviteRole: 'super_admin'
    };

    await inviteValidatePayload(mockReq, mockRes, mockNext);

    expect(mockReq.data).toEqual({
      inviteEmail: 'Test@Example.COM',
      inviteRole: 'super_admin'
    });
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle special characters in email', async () => {
    mockReq.body = {
      inviteEmail: 'test+tag@example.com',
      inviteRole: 'super_admin'
    };

    await inviteValidatePayload(mockReq, mockRes, mockNext);

    expect(mockReq.data).toEqual({
      inviteEmail: 'test+tag@example.com',
      inviteRole: 'super_admin'
    });
    expect(mockNext).toHaveBeenCalled();
  });
});
