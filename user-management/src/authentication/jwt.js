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
     expiresIn: "1h"
    }
    )
    return token
}

const generateResetToken = (info) => {
  const token = jwt.sign(
    {
      email: info.email
    },
    process.env.JWT_RESET_TOKEN || process.env.JWT_TOKEN,
    {
      expiresIn: process.env.RESET_EXPIRES_IN || "15m"
    }
  )
  return token
}

const verifyResetToken = (token) => {
  return jwt.verify(token, process.env.JWT_RESET_TOKEN || process.env.JWT_TOKEN)
}
const generateRefreshToken = (info) => {
  const token = jwt.sign(
    {
      email: info.email,
      username: info.username
    },
    process.env.JWT_REFRESH_TOKEN || process.env.JWT_TOKEN,
    {
      expiresIn: process.env.REFRESH_EXPIRES_IN || "7d"
    }
  )
  return token
}

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_TOKEN || process.env.JWT_TOKEN)
}

// this will validate jwt token and verify user, then it iwill forward details of user to next endpoint
// details that are forwarded : id, email, username, role
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization; // fixed from req.header.authorization
    console.log(`auth header ${authHeader}`)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(' ')[1]; // Extract token from "Bearer <token>"
    const decoded = jwt.verify(token, process.env.JWT_TOKEN);
    
    const email = decoded.email;
    const user = await User.findOne({email}).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    req.user = {
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role
    };

    next();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
export {generateToken, generateRefreshToken, verifyRefreshToken, generateResetToken, verifyResetToken, auth}