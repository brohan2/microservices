import { redis } from "../utilitis/redis.js";


export const validateOtp = async (req, res,next) => {
  // in this we need to validate otp and update details to database
  const { otp_received, email } = req.body;
  try {
    const strdata = await redis.get(`Pending_user:${email}`);
    console.log(email);
    console.log(strdata);
    if (!strdata) {
      return res
        .status(400)
        .json({ error: "No signup request found or OTP expired" });
    }
    const data = JSON.parse(strdata);
    const username = data.username;
    if (data.user_otp !== otp_received)
      return res.status(400).json({ error: "Invalid OTP" });
    if (Date.now() > data.otp_Expiry)
      return res.status(400).json({ error: "OTP expired" });
    req.data = data
    next()
  } catch (e) {
    console.log(e);
  }
};