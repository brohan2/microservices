import z from "zod";
import User from "../schema/userSchema.js";

const revokeSchema = z.object({
  invite_id: z.string().min(10)
});

const canManageInvites = (role) => {
  return role === "super_admin" || role === "site_admin";
};

export const revokeInvite = async (req, res) => {
  try {
    const actor = req.user;
    if (!actor || !canManageInvites(actor.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const parsed = revokeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });
    const { invite_id } = parsed.data;
    const invited = await User.findOne({ _id:invite_id, invite_status: "pending" });
    if (!invited) return res.status(404).json({ error: "Invite not found or already processed" });
    await User.updateOne(
      { _id: invited._id },
      { $set: { invite_status: "expired", invite_expiry: new Date(), inviteRevokedAt: new Date() } }
    );
    return res.status(200).json({ message: "Invite revoked" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};


