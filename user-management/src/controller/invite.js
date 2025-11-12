import { create } from "domain";
import { isExistingUser, invitedUserCreate } from "../db_adapter.js";
import User from "../schema/userSchema.js";
import {sendToQueue} from '../rabbitmq/producer.js'
import { uuidv7 } from "uuidv7";


// this will return the mail content that should be sent to invited users
const getInviteMessage = (inviteEmail, inviteRole, invite_id) => {
  const baseUrl = process.env.INVITE_BASE_URL || "http://localhost:8000";
  const inviteLink = `${baseUrl}/id=${invite_id}`;
  const msg = `Hello,

You have been invited as ${inviteRole}. Use the invite ID and link below to accept the invite.

Invite ID: ${invite_id}
Invite Link: ${inviteLink}

If you did not expect this email, you can ignore it.`;
  return { text: msg, link: inviteLink };
};

const getInviteMessageHTML = (subject, role, inviteId, inviteLink) => {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f7f7f9;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e6e8eb;border-radius:8px;overflow:hidden;">
      <div style="padding:20px 24px;border-bottom:1px solid #f0f2f5;">
        <h2 style="margin:0;color:#111827;font-size:18px;">${subject}</h2>
      </div>
      <div style="padding:24px;color:#374151;line-height:1.6;">
        <p style="margin:0 0 12px 0;">You have been invited as <strong>${role}</strong>.</p>
        <p style="margin:0 0 12px 0;">Use the invite ID below and click the button to proceed:</p>
        <p style="margin:0 0 16px 0;font-size:20px;font-weight:700;letter-spacing:1px;color:#111827;">${inviteId}</p>
        <p style="margin:0 0 16px 0;">
          <a href="${inviteLink}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;">Accept Invitation</a>
        </p>
        <p style="margin:0;color:#6b7280;">If you did not expect this email, you can ignore it.</p>
      </div>
    </div>
  </div>`;
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
    const invite_id = uuidv7();
    const splitmail = inviteEmail.split("@");
    const username = splitmail[0];

    //invoking invite user which will create a user with inviteEmail and set status as pending
   await invitedUserCreate(
      { username, inviteEmail, inviteRole, email, id, invite_id ,organisation},
      User
    );

    // send email using RabbitMQ implementation 
    const subject = process.env.INVITE_EMAIL_SUBJECT || "SociaLen Invite";
    const { text, link } = getInviteMessage(inviteEmail,inviteRole,invite_id)
    const html = getInviteMessageHTML(subject, inviteRole, invite_id, link);
    try {
      await sendToQueue({ 
        type: "invite",
        to: inviteEmail, 
        subject,
        content: text,
        html 
      });
    } catch (error) {
      console.error("Error sending to queue:", error);
      res.status(500).json({ error: "Failed to send message to queue" });
      return;
    }
    return res.status(200).json({ message: "User saved successfully and email queued" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "internal server error" });
  }
};

export default invite;
