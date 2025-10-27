import { DatabaseAdapter } from "./DatabaseAdapter.js";
import User from "../schema/userSchema.js";

/**
 * MongoDB-specific implementation of DatabaseAdapter
 */
export class MongoDBAdapter extends DatabaseAdapter {
  constructor() {
    super();
    this.model = User;
  }

  /**
   * Create an invited user in MongoDB
   */
  async invitedUserCreate(data) {
    const newUser = new this.model({
      username: data.username,
      email: data.inviteEmail,
      role: data.inviteRole,
      invited_by: data.id,
      invite_id: data.invite_id,
      organisation: data.organisation,
    });
    await newUser.save();
    return newUser;
  }

  /**
   * Check if a user exists in MongoDB
   */
  async isExistingUser(info) {
    const existingUser = await this.model.findOne(info);
    if (existingUser) {
      return existingUser;
    } else {
      return false;
    }
  }

  /**
   * Sign up an invited user in MongoDB
   */
  async invitedUserSignup(data) {
    const update = await this.model.findOneAndUpdate(
      { email: data.email },
      {
        $set: {
          username: data.username,
          password: data.hashed_password,
          isVerified: true,
          invite_status: "accepted",
          inviteAcceptedAt: Date.now(),
          lastLogin: Date.now(),
          twofactor: data.twofactor,
        },
      },
      { new: true, runValidators: true }
    );
    if (update) {
      return update;
    } else {
      return false;
    }
  }

  /**
   * Get all invites for a user in MongoDB
   */
  async getAllInvites(data) {
    const { id, irole } = data;
    const users = await this.model
      .find({
        $and: [{ invited_by: id }, { role: irole }],
      })
      .select("username email invite_status");
    return users;
  }

  /**
   * Setup TOTP secret for a user in MongoDB
   */
  async secretSetup(data) {
    const { secret } = data;
    const user = await this.model.findOneAndUpdate(
      { email: data.email },
      {
        $set: {
          totpSecret: secret,
        },
      },
      { new: true, runValidators: true }
    );
    return user;
  }

  /**
   * Enable TOTP for a user in MongoDB
   */
  async EnableTotp(data) {
    const { email } = data;
    const user = await this.model.findOneAndUpdate(
      { email: email },
      {
        $set: {
          totpEnabled: true,
        },
      },
      { new: true, runValidators: true }
    );
    return user;
  }
}
