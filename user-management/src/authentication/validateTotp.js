import User from "../schema/userSchema.js";
import { isExistingUser } from "../db_adapter.js";
import {
  generateTOTPSecret,
  generateQRCode,
  verifyTOTPToken,
} from "../utilitis/totp.js";

export const validateTOTP = async (req, res,next) => {
  const { email, token } = req.body;
  const user = await isExistingUser({ email }, User);
  console.log(user);
  if (!user)
    return res.status(404).json({ error: "User not found or TOTP not set up" });
  try {
    const verified = verifyTOTPToken(token, user.totpSecret);
    console.log(verified);
    req.verified = verified
    req.user = user
    if(verified){
        next()
    }
    else{
        res.status(400).json({error:"Invalid totp"})
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ error:"Internal server error" });
  }
};