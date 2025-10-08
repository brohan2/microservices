
import { create } from "domain";
import { isExistingUser, invitedUserCreate} from "../db_adapter.js"
import User from '../schema/userSchema.js'

const generateId = ()=>{
    return Math.floor(10000 + Math.random() * 90000).toString();
}

const createInviteId = (inviteEmail)=>{
    const num = generateId()
    const parts = inviteEmail.split('@')
    const inviteId = num.slice(0,3)+parts[0]+num.slice(3)
    return inviteId
}
const invite = async (req,res)=>{
    const {inviteEmail,inviteRole}= req.body 
    const {email,id} = req.user


    try{
        const invite_id = createInviteId(inviteEmail)
        const isExists = await isExistingUser({"email":inviteEmail},User)
        if(isExists){
            return res.status(400).json({"error":"User already exits"})
        }
        const splitmail = inviteEmail.split('@')
        const username = splitmail[0]
        invitedUserCreate({username,inviteEmail,inviteRole,email,id,invite_id},User)
        // send notification implementation here
        

        return res.status(200).json({"message":"User saved successfully"})
    }catch(e){
        console.log(e)
        return res.staus(500).json({"error":"internal server error"})
    }
}

export default invite