import jwt from 'jsonwebtoken'
import User from '../schema/userSchema.js'
const generateToken = (info)=>{
   const token =  jwt.sign(
        {
        email: info.email,
        username: info.username
    },
    process.env.JWT_TOKEN,
    {
     expiresIn: "1m"
    }
    )
    return token
}
const auth =(req,res,next)=>{
    try{
        const authHeader = req.header.authorization 
        if(!authHeader){
            return res.status(400).json({"error":"Unauthorized"})
        }
        const decode = jwt.verify(authHeader,process.env.JWT_TOKEN)
        const email = decode.email
        const user = User.findOne({email}).select("-password")
        if(!user){
            res.status(404).json({"error":"User not found"})
        }
        req.user = res.status(401).json({"id":user._id,"email":user.email,"username":user.username})
        next()
    }catch(e){
        return res.status(500).json({"error":"Internal server error"})
    }
}
export {generateToken,auth}