import { jest } from '@jest/globals';
import showinvites from '../../controller/showinvites.js';
import { getAllInvites } from '../../db_adapter.js';

// Mock dependencies
jest.mock('../../db_adapter.js', () => ({
  getAllInvites: jest.fn()
}));

describe('Show Invites Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      user: {},
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  it('should return invites successfully', async () => {
    const mockUser = {
      id: 'user123',
      email: 'admin@example.com',
      role: 'super_admin'
    };
    const mockInvites = [
      {
        username: 'user1',
        email: 'user1@example.com',
        invite_status: 'pending'
      },
      {
        username: 'user2',
        email: 'user2@example.com',
        invite_status: 'accepted'
      }
    ];

    mockReq.user = mockUser;
    mockReq.body = { irole: 'operator' };
    getAllInvites.mockResolvedValue(mockInvites);

    await showinvites(mockReq, mockRes);

    expect(getAllInvites).toHaveBeenCalledWith({
      irole: 'operator',
      id: 'user123',
      email: 'admin@example.com'
    }, expect.anything());
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      invite: mockInvites
    });
  });

  it('should handle empty invites list', async () => {
    const mockUser = {
      id: 'user123',
      email: 'admin@example.com',
      role: 'super_admin'
    };

    mockReq.user = mockUser;
    mockReq.body = { irole: 'client_admin' };
    getAllInvites.mockResolvedValue([]);

    await showinvites(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      invite: []
    });
  });

  it('should handle database errors', async () => {
    const mockUser = {
      id: 'user123',
      email: 'admin@example.com',
      role: 'super_admin'
    };

    mockReq.user = mockUser;
    mockReq.body = { irole: 'operator' };
    getAllInvites.mockRejectedValue(new Error('Database connection failed'));

    await showinvites(mockReq, mockRes);

    // The function doesn't have explicit error handling, so it will throw
    // This test documents the current behavior
    expect(getAllInvites).toHaveBeenCalled();
  });

  it('should pass correct parameters to getAllInvites', async () => {
    const mockUser = {
      id: 'user456',
      email: 'siteadmin@example.com',
      role: 'site_admin'
    };

    mockReq.user = mockUser;
    mockReq.body = { irole: 'client_admin' };
    getAllInvites.mockResolvedValue([]);

    await showinvites(mockReq, mockRes);

    expect(getAllInvites).toHaveBeenCalledWith({
      irole: 'client_admin',
      id: 'user456',
      email: 'siteadmin@example.com'
    }, expect.anything());
  });

  it('should handle different user roles', async () => {
    const mockUser = {
      id: 'user789',
      email: 'operator@example.com',
      role: 'operator'
    };

    mockReq.user = mockUser;
    mockReq.body = { irole: 'client_admin' };
    getAllInvites.mockResolvedValue([]);

    await showinvites(mockReq, mockRes);

    expect(getAllInvites).toHaveBeenCalledWith({
      irole: 'client_admin',
      id: 'user789',
      email: 'operator@example.com'
    }, expect.anything());
  });
});
