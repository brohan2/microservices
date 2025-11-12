import User from "../schema/userSchema.js";
import z, { check } from "zod";
import { generateToken, generateRefreshToken } from "../authentication/jwt.js";
import {validateOtp} from "../authentication/validateOtp.js";
import {validateTOTP} from "../authentication/validateTotp.js";
import {
  isExistingUser,
  invitedUserSignup,
  secretSetup,
  EnableTotp,
} from "../db_adapter.js";
import bcrypt from "bcrypt";
import { createClient } from "redis";
import nodemailer from "nodemailer";
import { generateOTP } from "../utilitis/otp.js";
import { sendOtp } from "../utilitis/mail.js";
import { redis } from "../utilitis/redis.js";
import {
  generateTOTPSecret,
  generateQRCode,
  verifyTOTPToken,
} from "../utilitis/totp.js";

const signupValidation = z
  .object({
    username: z.string().min(3, "Minimum three character"),
    email: z.email("email not in correct format"),
    password: z.string().min(6, "Mainimum 6 characters"),
    confirmpassword: z.string().min(6, "Minimum 6 characters"),
  })
  .refine((data) => data.password == data.confirmpassword, {
    path: ["confirmpassword"],
    error: "Password not matched",
  });

const invitedSignup = async (req, res) => {
  try {
    const {
      email,
      password,
      invite_id,
      username,
      verification_preference,
      confirmpassword,
    } = req.body;
    const verifydetails = signupValidation.safeParse({
      email,
      password,
      username,
      confirmpassword,
    });

    if (!verifydetails.success) {
      console.log(verifydetails.error);
      return res.status(403).json({
        message: "Validation failed",
        errors: verifydetails.error?.issues || [],
      });
    }

    const checkExisting = await isExistingUser({ email, invite_id }, User);
    if (!checkExisting) {
      return res
        .status(404)
        .json({ error: "User not invited or already exists" });
    }
    if (checkExisting.isVerified) {
      return res
        .status(400)
        .json({ error: "User already signed up, please login" });
    }
    // OTP VALIDATION
    if (verification_preference == "otp") {
      // OTP logic
      const user_otp = generateOTP();

      const stagingData = JSON.stringify({
        username,
        email,
        password,
        invite_id,
        user_otp,
        otp_Expiry: Date.now() + 60 * 10000,
      });

      await redis.set(`Pending_user:${email}`, stagingData, "EX", 600);

      await sendOtp(email, user_otp);
      return res.status(200).json({ message: "Otp sent to email" });
    } 
    // TOTP Logic
    else if (verification_preference == "totp") {
      try {
        const hashed_password = await bcrypt.hash(password, 10);
        const updated_user = await invitedUserSignup(
          { email, hashed_password, username, twofactor:"totp" },
          User
        );
        if(updated_user){
        const { qrCodeDataUrl, secret } = await setupTOTP(email);
        await secretSetup({ email, secret }, User);
        return res.status(200).json({ messgae: "QR sent", QR: qrCodeDataUrl });
        }
      } catch (e) {
        console.log(e);
        return res.status(400).json({ error: "Unable to signup" });
      }
    }
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};




const otpsignup = async (req,res)=>{
  try{
    const {username,email,password,invite_id,user_otp,otp_Expiry} = req.data
    const data = req.data
    console.log("data:",data)
    const hashed_password = await bcrypt.hash(data.password, 10);
    const updated_user = await invitedUserSignup(
      { email, hashed_password, username,twofactor:"otp" },
      User
    );
    const tokenuser = { email, username };
    const token = generateToken(tokenuser);
    const refreshToken = generateRefreshToken(tokenuser);
    await redis
      .del(`Pending_user:${email}`)
      .then(
        res
          .status(200)
          .json({ message: "User registered successfully", token: token, refreshToken })
      );
  }catch(e){
    console.log(e)
    res.status(500).json({error:"Signup failed"})
  }
}


const totpsignup = async (req,res)=>{
  try{
    const verified = req.verified
    const {email}=req.user
  if (verified) {
      await EnableTotp({ email }, User);
      const token = generateToken({email});
      const refreshToken = generateRefreshToken({email});

      return res.json({
        success: true,
        message: "TOTP token verified successfully",
        token: token,
        refreshToken
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired TOTP token" });
    }}
    catch(e){
      console.log(e)
      res.status(500).json({error:"internal server error"})
    }
}

const setupTOTP = async (email) => {
  const { secret, otpauthUrl } = generateTOTPSecret(email);
  const qrCodeDataUrl = await generateQRCode(otpauthUrl);
  return { qrCodeDataUrl, secret };
};



export { invitedSignup, validateOtp, validateTOTP, otpsignup,totpsignup};
