import User from '../schema/userSchema.js'
import z, { check } from 'zod'
import {generateToken} from '../authentication/jwt.js'
import { isExistingUser } from '../../db_adapter.js'
import bcrypt from 'bcrypt'





const invitedSignup = async (req,res)=>{
    try{
        const {email,password,invite_id} = req.body;
        const checkExisting = await isExistingUser({email,invite_id},User)
        if(!checkExisting){
         return res.status(404).json({"error":"User not invited or found"})
        }

        //otp logic
        
        // we need to set the password, 

    const token = generateToken({email,password})
    return res.status(200).json({
        message:"Login success",
        token
    })
    }catch(e){
       console.log(e) 
    }
}

export default invitedSignup