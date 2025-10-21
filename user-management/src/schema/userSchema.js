import mongoose, { mongo } from "mongoose";
import { lowercase } from "zod";

const ProfileSchema = new mongoose.Schema({
  photoUrl: { type: String, default: null },
  phoneNumber: { type: String, default: null },
});
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
      default: null,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      enum: [
        "super_admin",
        "site_admin",
        "operator",
        "client_admin",
        "client_user",
      ],
    },
    password: {
      type: String,
      default: null,
    },
    invited_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    invite_status: {
      type: String,
      enum: ["pending", "accepted", "expired"],
      default: "pending",
    },
    profile: {
      type: ProfileSchema,
      default: () => ({}),
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
    inviteAcceptedAt: {
      type: Date,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    invite_id: {
      type: String,
      required: true,
    },
    invite_expiry: {
      type: Date,
      required: true,
      default: Date.now() + 24 * 60 * 60 * 1000,
    },
    twofactor: {
      type: String,
      enum: ["otp", "totp","none"],
      default: "none",
    },
    totpSecret: {
      type: String,
      default: null,
    },
    totpEnabled: {
      type: Boolean,
      default: false,
    },
    organisation:{
      type:String,
      default:null
    }
  },
  { timestamps: true }
);
const User = mongoose.model("User", userSchema);

export default User;
