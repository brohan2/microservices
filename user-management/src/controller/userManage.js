import User from "../schema/userSchema.js";

const canDeleteUsers = (role) => {
  return role === "super_admin" || role === "site_admin";
};

export const deleteUser = async (req, res) => {
  try {
    const actor = req.user;
    if (!actor || !canDeleteUsers(actor.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "User id required" });
    if (String(actor.id) === String(id)) {
      return res.status(400).json({ error: "Cannot delete self" });
    }
    const target = await User.findById(id);
    if (!target) return res.status(404).json({ error: "User not found" });
    // role hierarchy: cannot delete higher or equal role if not super_admin
    const rank = { super_admin: 5, site_admin: 4, operator: 3, client_admin: 2, client_user: 1 };
    const actorRank = rank[actor.role] || 0;
    const targetRank = rank[target.role] || 0;
    if (actorRank <= targetRank && actor.role !== "super_admin") {
      return res.status(403).json({ error: "Insufficient privileges to delete this user" });
    }
    await User.deleteOne({ _id: id });
    return res.status(200).json({ message: "User deleted" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};


