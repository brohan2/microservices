/**
 * Database Adapter Module
 * Provides database operations using the adapter pattern
 * Currently supports MongoDB only
 */

import { DatabaseFactory } from "./adapters/DatabaseFactory.js";

// Get the MongoDB adapter instance
const dbAdapter = DatabaseFactory.getAdapter("mongodb");

/**
 * Create an invited user
 * @param {Object} data - User data including username, inviteEmail, inviteRole, id, invite_id, organisation
 * @param {Object} db - Database model (kept for backward compatibility, not used)
 * @returns {Promise<Object>} Created user
 */


export const invitedUserCreate = async (data, db) => {
  return await dbAdapter.invitedUserCreate(data);
};

/**
 * Check if a user exists
 * @param {Object} info - Search criteria (e.g., { email: "user@example.com" })
 * @param {Object} db - Database model (kept for backward compatibility, not used)
 * @returns {Promise<Object|false>} User if exists, false otherwise
 */
export const isExistingUser = async (info, db) => {
  return await dbAdapter.isExistingUser(info);
};

/**
 * Sign up an invited user (complete registration)
 * @param {Object} data - User signup data including email, username, hashed_password, twofactor
 * @param {Object} db - Database model (kept for backward compatibility, not used)
 * @returns {Promise<Object|false>} Updated user or false if failed
 */
export const invitedUserSignup = async (data, db) => {
  return await dbAdapter.invitedUserSignup(data);
};

/**
 * Get all invites for a user
 * @param {Object} data - Filter criteria including id (inviter_id) and irole (invite role)
 * @param {Object} db - Database model (kept for backward compatibility, not used)
 * @returns {Promise<Array>} List of invites
 */
export const getAllInvites = async (data, db) => {
  return await dbAdapter.getAllInvites(data);
};

/**
 * Setup TOTP secret for a user
 * @param {Object} data - Secret setup data including email and secret
 * @param {Object} db - Database model (kept for backward compatibility, not used)
 * @returns {Promise<Object>} Updated user
 */
export const secretSetup = async (data, db) => {
  return await dbAdapter.secretSetup(data);
};

/**
 * Enable TOTP for a user
 * @param {Object} data - Enable TOTP data including email
 * @param {Object} db - Database model (kept for backward compatibility, not used)
 * @returns {Promise<Object>} Updated user
 */
export const EnableTotp = async (data, db) => {
  return await dbAdapter.EnableTotp(data);
};