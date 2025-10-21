import { create } from "domain";
import { isExistingUser, invitedUserCreate } from "../db_adapter.js";
import User from "../schema/userSchema.js";
import {sendToQueue} from '../rabbitmq/producer.js'


// this will generate unique number
const generateId = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};
// this will return the mail content that should be sent to invited users
const getInviteMessage=(inviteEmail,inviteRole,invite_id)=>{
    const msg = `Hello, you have been invited as ${inviteRole}. Please use below invite Id and link to accept the invite.
    Invite id : ${invite_id}. Link: http://localhost:8000/id=${invite_id}`
    return msg
}
// this will create a unique inviteid
const createInviteId = (inviteEmail) => {
  const num = generateId();
  const parts = inviteEmail.split("@");
  const inviteId = num.slice(0, 3) + parts[0] + num.slice(3);
  return inviteId;
};

//this will invite user
const invite = async (req, res) => {
  const data = req.data;
  const { inviteEmail, inviteRole} = data
  const { email, id } = req.user;
  const {organisation} = req.body
  console.log(data)
  if(inviteRole==="client_admin"){
     console.log(organisation)
     if(!organisation){
      return res.status(400).json({"error":"Organisation required for client admin"})
     }
  }
  try {
    
    // checking if invited user is already exist in our database
    const isExists = await isExistingUser({ email: inviteEmail }, User);
    if (isExists) {
      return res.status(400).json({ error: "User already exits" });
    }
    const invite_id = createInviteId(inviteEmail);
    const splitmail = inviteEmail.split("@");
    const username = splitmail[0];

    //invoking invite user which will create a user with inviteEmail and set status as pending
   await invitedUserCreate(
      { username, inviteEmail, inviteRole, email, id, invite_id ,organisation},
      User
    );

    // send email using RabbitMQ implementation 
    const msg = getInviteMessage(inviteEmail,inviteRole,invite_id)
    try {
      await sendToQueue({ to:inviteEmail, content:msg });
      res.json({ message: "Email request sent to queue" });
    } catch (error) {
      console.error("Error sending to queue:", error);
      res.status(500).json({ error: "Failed to send message to queue" });
    }
    return res.status(200).json({ message: "User saved successfully" });
  } catch (e) {
    console.log(e);
    return res.staus(500).json({ error: "internal server error" });
  }
};

export default invite;
