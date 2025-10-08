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

export const sendOtp = async (email, otp) => {
  await transporter.sendMail({
    from: "SociaLen",
    to: email,
    subject: "SociaLen Verification",
    text: `Welcome to SociaLen, Please use otp: ${otp}. will expire in 5 min`,
  });
};