import User from '../schema/userSchema.js'
import {getAllInvites} from '../db_adapter.js'
import z from 'zod'

const inviteListValidation = z.object({
  irole: z.string().min(1, "irole is required")
});

const showinvites =async (req,res)=>{
    try{
    const {id,email,role} = req.user
    
    // Validate request body
    const validation = inviteListValidation.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validation.error?.issues || []
      });
    }
    
    const {irole} = validation.data
    console.log(id,email,irole,role)
    const invites = await getAllInvites({irole,id,email},User)
    return res.status(200).json({invite:invites})
    }catch(error){
        console.log(error)
        return res.status(500).json({error:"Internal server error"})
    }
}
export default showinvites