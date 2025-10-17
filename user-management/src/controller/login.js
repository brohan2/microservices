import z from "zod";
import { isExistingUser } from "../db_adapter.js";
import User from '../schema/userSchema.js'
import bcrypt from 'bcrypt'
import {generateToken} from '../authentication/jwt.js'
import { sendOtp } from "../utilitis/mail.js";
import {redis} from '../utilitis/redis.js'
import {validateOtp} from "../authentication/validateOtp.js";
import {validateTOTP} from "../authentication/validateTotp.js";
import { generateOTP } from "../utilitis/otp.js";

const loginValidation = z.object({
  email: z.email("email not in correct format"),
  password: z.string().min(6, "Mainimum 6 characters"),
});

const login = async (req, res) => {
    try{
        const {email} = req.user || req.body
        const token = generateToken({email});
        return res.status(200).json({"message":"User login successfull",token:token})
    }
    catch (e) {
    console.log(e)
  }
};


const verification = async (req,res,next)=>{
      try{
        const { email, password } = req.body;
    const validation = loginValidation.safeParse({email,password})
    if(!validation.success){
        return res.status(400).json({"error":"Email or password formating is bad"})
    }
    const existing = await isExistingUser({email},User)

  
    if(!existing){
        return res.status(400).json({"error":"User not registered"})
    }
    const match_password = await bcrypt.compare(password,existing.password)
    if(!match_password){
        return res.status(400).json({"error":"Invalid creds"})
    }
    if(existing.isVerified==false){
        return res.status(400).json({"error":"User not verifed, please signup using invite ID"})
    }
    const verificationtype =existing.twofactor;
    if(verificationtype =="otp"){
   const user_otp = generateOTP();

      const stagingData = JSON.stringify({
 
        email,
        password,
        user_otp,
        otp_Expiry: Date.now() + 60 * 10000,
      });
    
      await redis.set(`Pending_user:${email}`, stagingData, "EX", 600);

      await sendOtp(email, user_otp);
      return res.status(200).json({ validationType:"otp", message: "Otp sent to email" });
    }
    else if(verificationtype=="totp"){
        return res.status(200).json({validationType:"totp",message:"User verified, TOTP required"})
    }
      else{
        if(existing.role == "super_admin"){
          login(req,res)
        }
      }
      }catch(e){
        console.log(e)
      }
}
export {login,verification}