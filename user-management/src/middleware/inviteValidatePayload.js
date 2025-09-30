import z from 'zod'


const roleEnum = z.enum(['super_admin', 'site_admin', 'operator', 'client_admin', 'client_user']);

const validator = z.object({
    inviteEmail:z.email("Invalid Email"),
    inviteRole: roleEnum
})

const validatePayload = async (req,res,next)=>{
    const {inviteEmail,inviteRole} = req.body
    const result = validator.safeParse({inviteEmail,inviteRole})
      if (!result.success) {
        return res.status(422).json({ errors: result.error.errors });
    }
    req.body = result.data
    next();
}
export default validatePayload