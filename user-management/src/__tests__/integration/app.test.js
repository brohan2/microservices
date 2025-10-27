import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import dotenv from 'dotenv';

// Mock all external dependencies before importing the app
jest.mock('../db/db-connection.js');
jest.mock('../utilitis/redis.js');
jest.mock('../rabbitmq/setup.js');
jest.mock('../db_adapter.js');
jest.mock('../authentication/jwt.js');
jest.mock('../utilitis/mail.js');
jest.mock('../utilitis/otp.js');
jest.mock('../utilitis/totp.js');

// Import after mocking
import app from '../../index.js';

dotenv.config();

describe('User Management Service Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    it('should return service status', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.text).toBe('User Management Service is running');
    });
  });

  describe('API Documentation', () => {
    it('should serve OpenAPI specification', async () => {
      const response = await request(app)
        .get('/openapi.yaml')
        .expect(200);

      expect(response.text).toContain('openapi:');
    });

    it('should serve Swagger UI', async () => {
      const response = await request(app)
        .get('/docs')
        .expect(200);

      expect(response.text).toContain('swagger');
    });
  });

  describe('User Authentication Routes', () => {
    describe('POST /api/user/login', () => {
      it('should return 400 for invalid email format', async () => {
        const response = await request(app)
          .post('/api/user/login')
          .send({
            email: 'invalid-email',
            password: 'password123'
          })
          .expect(400);

        expect(response.body.error).toContain('Email or password formating is bad');
      });

      it('should return 400 for short password', async () => {
        const response = await request(app)
          .post('/api/user/login')
          .send({
            email: 'test@example.com',
            password: '123'
          })
          .expect(400);

        expect(response.body.error).toContain('Email or password formating is bad');
      });

      it('should return 400 for missing fields', async () => {
        const response = await request(app)
          .post('/api/user/login')
          .send({
            email: 'test@example.com'
          })
          .expect(400);

        expect(response.body.error).toContain('Email or password formating is bad');
      });
    });

    describe('POST /api/user/validateotplogin', () => {
      it('should return 400 for missing OTP data', async () => {
        const response = await request(app)
          .post('/api/user/validateotplogin')
          .send({
            email: 'test@example.com',
            otp_received: '123456'
          })
          .expect(400);

        expect(response.body.error).toContain('No signup request found or OTP expired');
      });
    });

    describe('POST /api/user/validatetotplogin', () => {
      it('should return 404 for user not found', async () => {
        const response = await request(app)
          .post('/api/user/validatetotplogin')
          .send({
            email: 'nonexistent@example.com',
            token: '123456'
          })
          .expect(404);

        expect(response.body.error).toContain('User not found or TOTP not set up');
      });
    });

    describe('PATCH /api/user/invitedsignup', () => {
      it('should return 403 for invalid username', async () => {
        const response = await request(app)
          .patch('/api/user/invitedsignup')
          .send({
            email: 'test@example.com',
            password: 'password123',
            confirmpassword: 'password123',
            username: 'ab', // Too short
            invite_id: 'test123',
            verification_preference: 'otp'
          })
          .expect(403);

        expect(response.body.message).toBeDefined();
      });

      it('should return 403 for password mismatch', async () => {
        const response = await request(app)
          .patch('/api/user/invitedsignup')
          .send({
            email: 'test@example.com',
            password: 'password123',
            confirmpassword: 'different123',
            username: 'testuser',
            invite_id: 'test123',
            verification_preference: 'otp'
          })
          .expect(403);

        expect(response.body.message).toBeDefined();
      });

      it('should return 403 for invalid email format', async () => {
        const response = await request(app)
          .patch('/api/user/invitedsignup')
          .send({
            email: 'invalid-email',
            password: 'password123',
            confirmpassword: 'password123',
            username: 'testuser',
            invite_id: 'test123',
            verification_preference: 'otp'
          })
          .expect(403);

        expect(response.body.message).toBeDefined();
      });
    });

    describe('PATCH /api/user/validateotpsignup', () => {
      it('should return 400 for missing OTP data', async () => {
        const response = await request(app)
          .patch('/api/user/validateotpsignup')
          .send({
            email: 'test@example.com',
            otp_received: '123456'
          })
          .expect(400);

        expect(response.body.error).toContain('No signup request found or OTP expired');
      });
    });

    describe('PATCH /api/user/validatetotpsignup', () => {
      it('should return 404 for user not found', async () => {
        const response = await request(app)
          .patch('/api/user/validatetotpsignup')
          .send({
            email: 'nonexistent@example.com',
            token: '123456'
          })
          .expect(404);

        expect(response.body.error).toContain('User not found or TOTP not set up');
      });
    });
  });

  describe('Invitation Routes', () => {
    describe('POST /api/invite', () => {
      it('should return 401 for missing authorization header', async () => {
        const response = await request(app)
          .post('/api/invite')
          .send({
            inviteEmail: 'test@example.com',
            inviteRole: 'operator'
          })
          .expect(401);

        expect(response.body.error).toContain('Unauthorized: No token provided');
      });

      it('should return 401 for invalid authorization format', async () => {
        const response = await request(app)
          .post('/api/invite')
          .set('Authorization', 'InvalidToken')
          .send({
            inviteEmail: 'test@example.com',
            inviteRole: 'operator'
          })
          .expect(401);

        expect(response.body.error).toContain('Unauthorized: No token provided');
      });

      it('should return 422 for invalid email format', async () => {
        const response = await request(app)
          .post('/api/invite')
          .set('Authorization', 'Bearer valid-token')
          .send({
            inviteEmail: 'invalid-email',
            inviteRole: 'operator'
          })
          .expect(422);

        expect(response.body.errors).toBeDefined();
      });

      it('should return 422 for invalid role', async () => {
        const response = await request(app)
          .post('/api/invite')
          .set('Authorization', 'Bearer valid-token')
          .send({
            inviteEmail: 'test@example.com',
            inviteRole: 'invalid_role'
          })
          .expect(422);

        expect(response.body.errors).toBeDefined();
      });
    });

    describe('GET /api/inviteelist', () => {
      it('should return 401 for missing authorization header', async () => {
        const response = await request(app)
          .get('/api/inviteelist')
          .expect(401);

        expect(response.body.error).toContain('Unauthorized: No token provided');
      });

      it('should return 401 for invalid authorization format', async () => {
        const response = await request(app)
          .get('/api/inviteelist')
          .set('Authorization', 'InvalidToken')
          .expect(401);

        expect(response.body.error).toContain('Unauthorized: No token provided');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);
    });

    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .send({})
        .expect(400);

      expect(response.body.error).toContain('Email or password formating is bad');
    });
  });

  describe('Request Validation', () => {
    it('should handle extra fields in request body', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
          extraField: 'should be ignored'
        })
        .expect(400);

      expect(response.body.error).toContain('User not registered');
    });

    it('should handle null values in request body', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: null,
          password: null
        })
        .expect(400);

      expect(response.body.error).toContain('Email or password formating is bad');
    });

    it('should handle undefined values in request body', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: undefined,
          password: undefined
        })
        .expect(400);

      expect(response.body.error).toContain('Email or password formating is bad');
    });
  });
});
