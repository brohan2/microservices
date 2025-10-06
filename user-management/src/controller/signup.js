import User from '../schema/userSchema.js'
import bcrypt from 'bcrypt'
import {generateToken} from '../authentication/jwt.js'
import z from 'zod'
// import Redis from 'ioredis'
import nodemailer from 'nodemailer'

// const redis = new Redis()
const generateOTP = ()=>{
    return Math.floor(100000 + Math.random() * 900000).toString();
}

const transporter = nodemailer.createTransport({
    host:'smtp.gmail.com',
    port:465,
    secure:true,
    auth:{
        user:'campusconnectofficial9@gmail.com',
        pass:'slyiukvhoubxerpx'
    }
})
const sendOtp = async (email,otp)=>{
    await transporter.sendMail({
        from:'SociaLen',
        to:email,
        subject:"SociaLen Verification",
        text:`Welcome to SociaLen, Please use otp: ${otp}. will expire in 5 min`
    })
}

const signupValidation = z.object({
    username : z.string().min(3,"Minimum three character"),
    email : z.email("email not in correct format"),
    password: z.string().min(6,"Mainimum 6 characters"),
    confirmpassword:z.string().min(6,"Minimum 6 characters")
}).refine((data)=>data.password==data.confirmpassword,{
    path:["confirmpassword"],
    error:"Password not matched"
})

const signup = async (req,res)=>{
    const {email,password,username,confirmpassword} = req.body 
    const verifydetails = signupValidation.safeParse({email,password,username,confirmpassword})
    
    if (!verifydetails.success) {
      console.log(verifydetails.error())
      return res.status(403).json({
        message: verifydetails.error(),
        errors: verifydetails.error()
      });
    }

    try{
        const existing = await User.findOne({email})
        if(existing){
            return res.status(400).json({"error":"User already registered"})
        }
        const user_otp = generateOTP()

        const stagingData = Json.stringify({username,email,password,user_otp,otp_Expiry:Date.now()+60*1000})
        // await redis.set(`Pending_user ${email}`,stagingData,'EX',600)

        await sendOtp(email,user_otp)

         res.status(200).json({"message":"Otp sent to email, please verify"})
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
        return res.status(500).json({"error":`Internal server error ${e}`})
    }
}

const validateOTP = async (req,res)=>{
    const {otp_received,email}=req.body
    try{
        // const strdata = await redis.get(`Pending_user':${email}`)
        if (!strdata){
             return res.status(400).json({ error: 'No signup request found or OTP expired' });
        }
        const data = JSON.parse(strdata)

    if (data.otp !== otp_received) return res.status(400).json({ error: 'Invalid OTP' });
    if (Date.now() > data.otp_Expiry) return res.status(400).json({ error: 'OTP expired' });
    
    const hashed_password = await bcrypt.hash(password,10)
        const newUser = new User({
            username,
            email,
            password:hashed_password
        })
        await newUser.save()
        const token = generateToken(newUser)
        // await redis.del(`pendingUser:${email}`);

        res.status(200).json({"message":"User registered successfully","token":token})

    }catch(e){
        console.log(e)
    }
}

export {signup,validateOTP}