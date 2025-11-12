import z from "zod";
import bcrypt from "bcrypt";
import User from "../schema/userSchema.js";
import { redis } from "../utilitis/redis.js";
import { sendOtp } from "../utilitis/mail.js";
import { generateOTP } from "../utilitis/otp.js";
import { generateResetToken, verifyResetToken } from "../authentication/jwt.js";
import { verifyTOTPToken } from "../utilitis/totp.js";

const emailSchema = z.object({
  email: z.string().email()
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
  confirmNewPassword: z.string().min(6)
}).refine(d => d.newPassword === d.confirmNewPassword, { path: ["confirmNewPassword"], message: "Passwords do not match" });

const resetPasswordSchema = z.object({
  resetToken: z.string().min(10),
  newPassword: z.string().min(6),
  confirmNewPassword: z.string().min(6)
}).refine(d => d.newPassword === d.confirmNewPassword, { path: ["confirmNewPassword"], message: "Passwords do not match" });

export const forgotInitiate = async (req, res) => {
  try {
    const parsed = emailSchema.safeParse(req.body);
    if (!parsed.success) return res.status(200).json({ message: "If the email exists, a verification step has been initiated" });
    const { email } = parsed.data;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: "If the email exists, a verification step has been initiated" });
    }
    if (user.twofactor === "totp") {
      return res.status(200).json({ validationType: "totp", message: "Provide TOTP to continue" });
    }
    const user_otp = generateOTP();
    const stagingData = JSON.stringify({
      email,
      user_otp,
      otp_Expiry: Date.now() + 10 * 60 * 1000
    });
    await redis.set(`Reset_user:${email}`, stagingData, "EX", 600);
    await sendOtp(email, user_otp);
    return res.status(200).json({ validationType: "otp", message: "If the email exists, a verification code has been sent" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const forgotVerifyOtp = async (req, res) => {
  try {
    const { email, otp_received } = req.body || {};
    if (!email || !otp_received) return res.status(400).json({ error: "email and otp_received required" });
    const strdata = await redis.get(`Reset_user:${email}`);
    if (!strdata) return res.status(400).json({ error: "Invalid or expired verification" });
    const data = JSON.parse(strdata);
    if (Date.now() > data.otp_Expiry) return res.status(400).json({ error: "Invalid or expired verification" });
    if (String(data.user_otp) !== String(otp_received)) return res.status(400).json({ error: "Invalid or expired verification" });
    const resetToken = generateResetToken({ email });
    await redis.del(`Reset_user:${email}`);
    return res.status(200).json({ resetToken, message: "Verification successful" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const forgotVerifyTotp = async (req, res) => {
  try {
    const { email, token } = req.body || {};
    if (!email || !token) return res.status(400).json({ error: "email and token required" });
    const user = await User.findOne({ email });
    if (!user || !user.totpSecret) return res.status(400).json({ error: "Invalid verification" });
    const ok = verifyTOTPToken(token, user.totpSecret);
    if (!ok) return res.status(400).json({ error: "Invalid or expired verification" });
    const resetToken = generateResetToken({ email });
    return res.status(200).json({ resetToken, message: "Verification successful" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const passwordReset = async (req, res) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });
    const { resetToken, newPassword } = parsed.data;
    let payload;
    try {
      payload = verifyResetToken(resetToken);
    } catch (e) {
      return res.status(401).json({ error: "Invalid or expired reset token" });
    }
    const email = payload?.email;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ _id: user._id }, { $set: { password: hashed } });
    return res.status(200).json({ message: "Password reset successfully" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const passwordUpdate = async (req, res) => {
  try {
    const parsed = updatePasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });
    const { currentPassword, newPassword } = parsed.data;
    const { email } = req.user || {};
    if (!email) return res.status(401).json({ error: "Unauthorized" });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    const ok = await bcrypt.compare(currentPassword, user.password || "");
    if (!ok) return res.status(400).json({ error: "Invalid current password" });
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ _id: user._id }, { $set: { password: hashed } });
    return res.status(200).json({ message: "Password updated successfully" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};


