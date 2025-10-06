import User from "../schema/userSchema.js";
import z, { check } from "zod";
import { generateToken } from "../authentication/jwt.js";
import { isExistingUser,invitedUserSignup } from "../db_adapter.js";
import bcrypt from "bcrypt";
import { createClient } from "redis";
import nodemailer from "nodemailer";
import { generateOTP } from "../twofactor/otp.js";
import { sendOtp } from "../twofactor/mail.js";
import {redis} from '../twofactor/redis.js'


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
      console.log(verifydetails.error());
      return res.status(403).json({
        message: verifydetails.error(),
        errors: verifydetails.error(),
      });
    }

    const checkExisting = await isExistingUser({ email, invite_id }, User);
    if (!checkExisting) {
      return res.status(404).json({ error: "User not invited or found" });
    }
    if(checkExisting.isVerified){
        return res.status(400).json({error:"User already signed up, please login"})
    }
    if (verification_preference == "otp") {
      //otp logic
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
    } else if (verification_preference == "totp") {
    }
    // we need to set the password, and update the user profile (verified, invite status etc)

    // const token = generateToken({ email, password });
    // return res.status(200).json({
    //   message: "Login success",
    //   token,
    // });
  } catch (e) {
    console.log(e);
  }
};
const validateOtp = async (req, res) => {
  // in this we need to validate otp and update details to database
  const { otp_received, email } = req.body;
  try {
    const strdata = await redis.get(`Pending_user:${email}`);
    console.log(email)
    console.log(strdata)
    if (!strdata) {
      return res
        .status(400)
        .json({ error: "No signup request found or OTP expired" });
    }
    const data = JSON.parse(strdata);
    // console.log(data);
    const username = data.username
    if (data.user_otp !== otp_received)
      return res.status(400).json({ error: "Invalid OTP" });
    if (Date.now() > data.otp_Expiry)
      return res.status(400).json({ error: "OTP expired" });

    const hashed_password = await bcrypt.hash(data.password, 10);
    const updated_user = await invitedUserSignup({email,hashed_password,username},User)
    const tokenuser ={email,username}
    const token = generateToken(tokenuser);
    await redis.del(`pendingUser:${email}`)
    .then(
     res
      .status(200)
      .json({ message: "User registered successfully", token: token }));
  } catch (e) {
    console.log(e);
  }
};
export {invitedSignup,validateOtp};
