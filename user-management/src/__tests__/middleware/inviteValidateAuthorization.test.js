import { jest } from '@jest/globals';
import inviteValidateAuthorization from '../../middleware/inviteValidateAuthorization.js';

describe('Invite Validate Authorization Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      user: {},
      authorized: false
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('super_admin role', () => {
    beforeEach(() => {
      mockReq.user = { role: 'super_admin' };
    });

    it('should authorize site_admin invitation', async () => {
      mockReq.body = { inviteRole: 'site_admin' };

      await inviteValidateAuthorization(mockReq, mockRes, mockNext);

      expect(mockReq.authorized).toBe(true);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should authorize operator invitation', async () => {
      mockReq.body = { inviteRole: 'operator' };

      await inviteValidateAuthorization(mockReq, mockRes, mockNext);

      expect(mockReq.authorized).toBe(true);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should authorize client_admin invitation', async () => {
      mockReq.body = { inviteRole: 'client_admin' };

      await inviteValidateAuthorization(mockReq, mockRes, mockNext);

      expect(mockReq.authorized).toBe(true);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not authorize super_admin invitation', async () => {
      mockReq.body = { inviteRole: 'super_admin' };

      await inviteValidateAuthorization(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'You are not authorized to perform this action'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not authorize client_user invitation', async () => {
      mockReq.body = { inviteRole: 'client_user' };

      await inviteValidateAuthorization(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'You are not authorized to perform this action'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('site_admin role', () => {
    beforeEach(() => {
      mockReq.user = { role: 'site_admin' };
    });

    it('should authorize operator invitation', async () => {
      mockReq.body = { inviteRole: 'operator' };

      await inviteValidateAuthorization(mockReq, mockRes, mockNext);

      expect(mockReq.authorized).toBe(true);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should authorize client_admin invitation', async () => {
      mockReq.body = { inviteRole: 'client_admin' };

      await inviteValidateAuthorization(mockReq, mockRes, mockNext);

      expect(mockReq.authorized).toBe(true);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not authorize super_admin invitation', async () => {
      mockReq.body = { inviteRole: 'super_admin' };

      await inviteValidateAuthorization(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'You are not authorized to perform this action'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not authorize site_admin invitation', async () => {
      mockReq.body = { inviteRole: 'site_admin' };

      await inviteValidateAuthorization(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'You are not authorized to perform this action'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not authorize client_user invitation', async () => {
      mockReq.body = { inviteRole: 'client_user' };

      await inviteValidateAuthorization(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'You are not authorized to perform this action'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('operator role', () => {
    beforeEach(() => {
      mockReq.user = { role: 'operator' };
    });

    it('should authorize client_admin invitation', async () => {
      mockReq.body = { inviteRole: 'client_admin' };

      await inviteValidateAuthorization(mockReq, mockRes, mockNext);

      expect(mockReq.authorized).toBe(true);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not authorize super_admin invitation', async () => {
      mockReq.body = { inviteRole: 'super_admin' };

      await inviteValidateAuthorization(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'You are not authorized to perform this action'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not authorize site_admin invitation', async () => {
      mockReq.body = { inviteRole: 'site_admin' };

      await inviteValidateAuthorization(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'You are not authorized to perform this action'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not authorize operator invitation', async () => {
      mockReq.body = { inviteRole: 'operator' };

      await inviteValidateAuthorization(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'You are not authorized to perform this action'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not authorize client_user invitation', async () => {
      mockReq.body = { inviteRole: 'client_user' };

      await inviteValidateAuthorization(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'You are not authorized to perform this action'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('client_admin role', () => {
    beforeEach(() => {
      mockReq.user = { role: 'client_admin' };
    });

    it('should authorize client_user invitation', async () => {
      mockReq.body = { inviteRole: 'client_user' };

      await inviteValidateAuthorization(mockReq, mockRes, mockNext);

      expect(mockReq.authorized).toBe(true);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not authorize super_admin invitation', async () => {
      mockReq.body = { inviteRole: 'super_admin' };

      await inviteValidateAuthorization(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'You are not authorized to perform this action'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not authorize site_admin invitation', async () => {
      mockReq.body = { inviteRole: 'site_admin' };

      await inviteValidateAuthorization(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'You are not authorized to perform this action'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not authorize operator invitation', async () => {
      mockReq.body = { inviteRole: 'operator' };

      await inviteValidateAuthorization(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'You are not authorized to perform this action'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not authorize client_admin invitation', async () => {
      mockReq.body = { inviteRole: 'client_admin' };

      await inviteValidateAuthorization(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'You are not authorized to perform this action'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('client_user role', () => {
    beforeEach(() => {
      mockReq.user = { role: 'client_user' };
    });

    it('should not authorize any invitation', async () => {
      const roles = ['super_admin', 'site_admin', 'operator', 'client_admin', 'client_user'];
      
      for (const role of roles) {
        mockReq.body = { inviteRole: role };
        jest.clearAllMocks();

        await inviteValidateAuthorization(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'You are not authorized to perform this action'
        });
        expect(mockNext).not.toHaveBeenCalled();
      }
    });
  });

  describe('edge cases', () => {
    it('should handle missing user role', async () => {
      mockReq.user = {};
      mockReq.body = { inviteRole: 'super_admin' };

      await inviteValidateAuthorization(mockReq, mockRes, mockNext);

      // The middleware doesn't handle missing role explicitly, so it will fall through
      // This test documents the current behavior
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle missing inviteRole', async () => {
      mockReq.user = { role: 'super_admin' };
      mockReq.body = {};

      await inviteValidateAuthorization(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'You are not authorized to perform this action'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle invalid role', async () => {
      mockReq.user = { role: 'invalid_role' };
      mockReq.body = { inviteRole: 'super_admin' };

      await inviteValidateAuthorization(mockReq, mockRes, mockNext);

      // The middleware doesn't handle invalid roles explicitly, so it will fall through
      // This test documents the current behavior
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
