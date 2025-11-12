import { generateToken, verifyRefreshToken } from "../authentication/jwt.js";
import User from "../schema/userSchema.js";

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return res.status(400).json({ error: "refreshToken required" });
    }
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (e) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }
    const email = payload?.email;
    if (!email) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }
    const user = await User.findOne({ email }).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const token = generateToken({ email: user.email, username: user.username });
    return res.status(200).json({ token });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};


