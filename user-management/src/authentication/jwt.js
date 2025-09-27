import jsonwebtoken from 'jsonwebtoken'
import User from '../schema/userSchema'
const generateToken = (info)=>{
    jwt.sign(
        {
        id: info._id,
        email: info.email,
        username: info.username
    },
    process.env.JWT_TOKEN,
    {
     expiresIn: "1m"
    }
    )
}
const auth =(req,res,next)=>{
    try{
        const authHeader = req.header.authorization 
        if(!authHeader){
            return res.status(400).json({"error":"Unauthorized"})
        }
        const decode = jwt.verify(authHeader,process.env.JWT_TOKEN)
        const user = User.findById(decode.id).select("-password")
        if(!user){
            res.status(404).json({"error":"User not found"})
        }
        req.user = res.status(401).json({"id":user._id,"email":user.email,"username":user.username})
        next()
    }catch(e){
        return res.status(500).json({"error":"Internal server error"})
    }
}
export {generateToken}