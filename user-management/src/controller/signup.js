import {User,TempUser} from '../schema/userSchema.js'
import bcrypt from 'bcrypt'
import {generateToken} from '../authentication/jwt.js'
import z from 'zod'


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

export default signup