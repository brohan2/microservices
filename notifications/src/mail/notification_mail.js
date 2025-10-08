import nodemailer from 'nodemailer'


const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "campusconnectofficial9@gmail.com",
    pass: "slyiukvhoubxerpx",
  },
});

export const sendOtp = async (email, content) => {
  await transporter.sendMail({
    from: "SocialLen",
    to: email,
    subject: "Invite User",
    text: `${content}`,
  });
};