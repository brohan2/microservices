import User from '../schema/userSchema.js'
import {getAllInvites} from '../db_adapter.js'

const showinvites =async (req,res)=>{
    const {id,email,role} = req.user
    const {irole} = req.body 
    console.log(id,email,irole,role)
    const invites = await getAllInvites({irole,id,email},User)
    return res.status(200).json({invite:invites})
}
export default showinvites