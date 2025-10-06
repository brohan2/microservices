import z from "zod";
import { isExistingUser } from "../db_adapter.js";
import User from '../schema/userSchema.js'
import bcrypt from 'bcrypt'
import {generateToken} from '../authentication/jwt.js'

const loginValidation = z.object({
  email: z.email("email not in correct format"),
  password: z.string().min(6, "Mainimum 6 characters"),
});

const login = async (req, res) => {
  try {
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
    const username = existing.username
    const token = generateToken({email,username});
    return res.status(200).json({"message":"User login successfull",token:token})
  } catch (e) {
    console.log(e)
  }
};
export default login