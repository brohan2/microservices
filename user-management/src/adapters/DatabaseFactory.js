import { MongoDBAdapter } from "./MongoDBAdapter.js";

/**
 * Database Factory
 * Returns the appropriate database adapter based on configuration
 */
export class DatabaseFactory {
  /**
   * Get the appropriate database adapter
   * @param {String} type - Database type (default: 'mongodb')
   * @returns {DatabaseAdapter} Database adapter instance
   */
  static getAdapter(type = "mongodb") {
    switch (type.toLowerCase()) {
      case "mongodb":
        return new MongoDBAdapter();
      case "postgresql":
        // Currently not implemented
        throw new Error("PostgreSQL adapter not yet implemented");
      default:
        throw new Error(`Unknown database type: ${type}`);
    }
  }
}
