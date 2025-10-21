// import User from './src/schema/userSchema.js'

export const invitedUserCreate = async (data, db) => {
  const newUser = new db({
    username: data.username,
    email: data.inviteEmail,
    role: data.inviteRole,
    invited_by: data.id,
    invite_id: data.invite_id,
    organisation:data.organisation
  });
  await newUser.save();
};


export const isExistingUser = async (info, db) => {
  const existingUser = await db.findOne(info);
  if (existingUser) {
    return existingUser;
  } else {
    return false;
  }
};
export const invitedUserSignup = async (data, db) => {
  const update = db.findOneAndUpdate(
    { email: data.email },
    {
      $set: {
        username: data.username,
        password: data.hashed_password,
        isVerified: true,
        invite_status: "accepted",
        inviteAcceptedAt: Date.now(),
        lastLogin: Date.now(),
        twofactor:data.twofactor,
      },
    },
    { new: true, runValidators: true }
  );
  if (update) {
    return update;
  } else {
    return false;
  }
};
export const getAllInvites = async (data, db) => {
  const {id,irole}= data
  const users = await db.find({
    $and: [{ invited_by: id }, { role: irole }],
  }).select('username email invite_status');
  console.log(users);
  return users;
};

export const secretSetup = async (data, db) => {
  const { secret } = data;
  const user = await db.findOneAndUpdate(
    { email: data.email },
    {
      $set: {
        totpSecret: secret,
      },
    },
    { new: true, runValidators: true }
  );
  return user
};

export const EnableTotp = async (data,db)=>{
    const {email}=data;
    const user = await db.findOneAndUpdate(
        {email:email},
        {
            $set:{
                totpEnabled:true
            }
        },
        { new: true, runValidators: true }
    );
    return user
}