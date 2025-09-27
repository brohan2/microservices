import User from '../schema/userSchema.js'
import bcrypt from 'bcrypt'
import {generateToken} from '../authentication/jwt.js'


const signup = async (req,res)=>{
    const {email,password,username} = req.body 
    try{
        const existing = await User.findone({email})
        if(existing){
            return res.status(400).json({"error":"User already registered"})
        }
        const hashed_password = await bcrypt.hash(password,10)

        const newUser = new User({
            username,
            email,
            password:hashed_password
        })
        await newUser.save()
        const token = generateToken(newUser)
        res.status(200).json({"message":"User registered successfully","token":token})
    }catch(e){
        res.status(500).json({"error":`Internal server error ${e}`})
    }
}

export {signup}