import z from 'zod'


const roleEnum = z.enum(['super_admin', 'site_admin', 'operator', 'client_admin', 'client_user']);

const validator = z.object({
    inviteEmail:z.email("Invalid Email"),
    inviteRole: roleEnum
})
// this will validate the payload, if the role and email is valid 
const validatePayload = async (req,res,next)=>{
    const {inviteEmail,inviteRole} = req.body
    const result = validator.safeParse({inviteEmail,inviteRole})
      if (!result.success) {
        const errors = result.error?.issues || result.error?.errors || [];
        return res.status(422).json({ errors });
    }
    
    req.data = result.data
    next();
}
export default validatePayload