// import User from './src/schema/userSchema.js'


export const invitedUserCreate = async (data,db)=>{
    const newUser = new db(
    {  
      username:data.username,
       email: data.inviteEmail,
       role: data.inviteRole,
       invited_by: data.id,
       invite_id : data.invite_id,
    })
    await newUser.save()
}
export const isExistingUser = async (info,db)=>{
    const existingUser = await db.findOne(info)
    if(existingUser){
        return existingUser
    }
    else{
        return false
    }
}
export const invitedUserSignup = async(data,db)=>{
    const update = db.findOneAndUpdate(
        {email:data.email},
        {$set: {username:data.username,password:data.hashed_password,isVerified:true,invite_status:"accepted",inviteAcceptedAt:Date.now(),lastLogin:Date.now()}},
        { new: true, runValidators: true } 
    )
    if(update){
        return update
    }
    else{
        return false;
    }
}
