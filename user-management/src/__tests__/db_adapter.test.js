import { jest } from '@jest/globals';
import {
  invitedUserCreate,
  isExistingUser,
  invitedUserSignup,
  getAllInvites,
  secretSetup,
  EnableTotp
} from '../db_adapter.js';
import User from '../schema/userSchema.js';

// Mock dependencies
jest.mock('../schema/userSchema.js');

describe('Database Adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('invitedUserCreate', () => {
    it('should create a new invited user', async () => {
      const mockUser = {
        save: jest.fn().mockResolvedValue({ _id: 'user123' })
      };
      User.mockImplementation(() => mockUser);

      const data = {
        username: 'testuser',
        inviteEmail: 'test@example.com',
        inviteRole: 'operator',
        id: 'inviter123',
        invite_id: 'invite123',
        organisation: 'Test Org'
      };

      await invitedUserCreate(data, User);

      expect(User).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        role: 'operator',
        invited_by: 'inviter123',
        invite_id: 'invite123',
        organisation: 'Test Org'
      });
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should handle save errors', async () => {
      const mockUser = {
        save: jest.fn().mockRejectedValue(new Error('Save failed'))
      };
      User.mockImplementation(() => mockUser);

      const data = {
        username: 'testuser',
        inviteEmail: 'test@example.com',
        inviteRole: 'operator',
        id: 'inviter123',
        invite_id: 'invite123',
        organisation: 'Test Org'
      };

      await expect(invitedUserCreate(data, User)).rejects.toThrow('Save failed');
    });
  });

  describe('isExistingUser', () => {
    it('should return user if found', async () => {
      const mockUser = { _id: 'user123', email: 'test@example.com' };
      User.findOne.mockResolvedValue(mockUser);

      const result = await isExistingUser({ email: 'test@example.com' }, User);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(result).toBe(mockUser);
    });

    it('should return false if user not found', async () => {
      User.findOne.mockResolvedValue(null);

      const result = await isExistingUser({ email: 'nonexistent@example.com' }, User);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      User.findOne.mockRejectedValue(new Error('Database error'));

      await expect(isExistingUser({ email: 'test@example.com' }, User)).rejects.toThrow('Database error');
    });

    it('should handle multiple search criteria', async () => {
      const mockUser = { _id: 'user123', email: 'test@example.com', invite_id: 'invite123' };
      User.findOne.mockResolvedValue(mockUser);

      const result = await isExistingUser({ email: 'test@example.com', invite_id: 'invite123' }, User);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com', invite_id: 'invite123' });
      expect(result).toBe(mockUser);
    });
  });

  describe('invitedUserSignup', () => {
    it('should update user signup successfully', async () => {
      const mockUpdatedUser = {
        _id: 'user123',
        email: 'test@example.com',
        isVerified: true,
        invite_status: 'accepted'
      };
      User.findOneAndUpdate.mockResolvedValue(mockUpdatedUser);

      const data = {
        email: 'test@example.com',
        username: 'testuser',
        hashed_password: 'hashedpass',
        twofactor: 'otp'
      };

      const result = await invitedUserSignup(data, User);

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        {
          $set: {
            username: 'testuser',
            password: 'hashedpass',
            isVerified: true,
            invite_status: 'accepted',
            inviteAcceptedAt: expect.any(Number),
            lastLogin: expect.any(Number),
            twofactor: 'otp'
          }
        },
        { new: true, runValidators: true }
      );
      expect(result).toBe(mockUpdatedUser);
    });

    it('should return false if update fails', async () => {
      User.findOneAndUpdate.mockResolvedValue(null);

      const data = {
        email: 'test@example.com',
        username: 'testuser',
        hashed_password: 'hashedpass',
        twofactor: 'otp'
      };

      const result = await invitedUserSignup(data, User);

      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      User.findOneAndUpdate.mockRejectedValue(new Error('Update failed'));

      const data = {
        email: 'test@example.com',
        username: 'testuser',
        hashed_password: 'hashedpass',
        twofactor: 'otp'
      };

      await expect(invitedUserSignup(data, User)).rejects.toThrow('Update failed');
    });
  });

  describe('getAllInvites', () => {
    it('should return all invites for user', async () => {
      const mockInvites = [
        { username: 'user1', email: 'user1@example.com', invite_status: 'pending' },
        { username: 'user2', email: 'user2@example.com', invite_status: 'accepted' }
      ];
      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockInvites)
      });

      const data = {
        id: 'user123',
        irole: 'operator'
      };

      const result = await getAllInvites(data, User);

      expect(User.find).toHaveBeenCalledWith({
        $and: [{ invited_by: 'user123' }, { role: 'operator' }]
      });
      expect(result).toBe(mockInvites);
    });

    it('should handle empty invites list', async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([])
      });

      const data = {
        id: 'user123',
        irole: 'operator'
      };

      const result = await getAllInvites(data, User);

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Query failed'))
      });

      const data = {
        id: 'user123',
        irole: 'operator'
      };

      await expect(getAllInvites(data, User)).rejects.toThrow('Query failed');
    });
  });

  describe('secretSetup', () => {
    it('should setup TOTP secret successfully', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        totpSecret: 'secret123'
      };
      User.findOneAndUpdate.mockResolvedValue(mockUser);

      const data = {
        email: 'test@example.com',
        secret: 'secret123'
      };

      const result = await secretSetup(data, User);

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        {
          $set: {
            totpSecret: 'secret123'
          }
        },
        { new: true, runValidators: true }
      );
      expect(result).toBe(mockUser);
    });

    it('should handle database errors', async () => {
      User.findOneAndUpdate.mockRejectedValue(new Error('Update failed'));

      const data = {
        email: 'test@example.com',
        secret: 'secret123'
      };

      await expect(secretSetup(data, User)).rejects.toThrow('Update failed');
    });
  });

  describe('EnableTotp', () => {
    it('should enable TOTP successfully', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        totpEnabled: true
      };
      User.findOneAndUpdate.mockResolvedValue(mockUser);

      const data = {
        email: 'test@example.com'
      };

      const result = await EnableTotp(data, User);

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        {
          $set: {
            totpEnabled: true
          }
        },
        { new: true, runValidators: true }
      );
      expect(result).toBe(mockUser);
    });

    it('should handle database errors', async () => {
      User.findOneAndUpdate.mockRejectedValue(new Error('Update failed'));

      const data = {
        email: 'test@example.com'
      };

      await expect(EnableTotp(data, User)).rejects.toThrow('Update failed');
    });
  });
});
