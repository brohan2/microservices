/**
 * Abstract Database Adapter Interface
 * Defines the contract that all database adapters must implement
 */
export class DatabaseAdapter {
  constructor() {
    if (this.constructor === DatabaseAdapter) {
      throw new Error("Cannot instantiate abstract DatabaseAdapter class");
    }
  }

  /**
   * Create an invited user in the database
   * @param {Object} data - User data
   * @returns {Promise<Object>} Created user
   */
  async invitedUserCreate(data) {
    throw new Error("invitedUserCreate must be implemented by subclass");
  }

  /**
   * Check if a user exists in the database
   * @param {Object} info - Search criteria
   * @returns {Promise<Object|false>} User if exists, false otherwise
   */
  async isExistingUser(info) {
    throw new Error("isExistingUser must be implemented by subclass");
  }

  /**
   * Sign up an invited user
   * @param {Object} data - User signup data
   * @returns {Promise<Object|false>} Updated user or false if failed
   */
  async invitedUserSignup(data) {
    throw new Error("invitedUserSignup must be implemented by subclass");
  }

  /**
   * Get all invites for a user
   * @param {Object} data - Filter criteria
   * @returns {Promise<Array>} List of invites
   */
  async getAllInvites(data) {
    throw new Error("getAllInvites must be implemented by subclass");
  }

  /**
   * Setup TOTP secret for a user
   * @param {Object} data - Secret setup data
   * @returns {Promise<Object>} Updated user
   */
  async secretSetup(data) {
    throw new Error("secretSetup must be implemented by subclass");
  }

  /**
   * Enable TOTP for a user
   * @param {Object} data - Enable TOTP data
   * @returns {Promise<Object>} Updated user
   */
  async EnableTotp(data) {
    throw new Error("EnableTotp must be implemented by subclass");
  }
}
