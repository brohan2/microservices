import nodemailer from 'nodemailer'


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : true,
  auth: {
    user: process.env.SMTP_USER || "campusconnectofficial9@gmail.com",
    pass: process.env.SMTP_PASS || "slyiukvhoubxerpx",
  },
});

export const sendOtp = async (email, otp) => {
  const fromName = process.env.EMAIL_FROM_NAME || "SociaLen";
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER || "no-reply@example.com";
  const subject = process.env.OTP_EMAIL_SUBJECT || "SociaLen Verification";
  const text = `Welcome to SociaLen. Please use OTP: ${otp}. It will expire in 10 minutes.`;
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f7f7f9;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e6e8eb;border-radius:8px;overflow:hidden;">
      <div style="padding:20px 24px;border-bottom:1px solid #f0f2f5;">
        <h2 style="margin:0;color:#111827;font-size:18px;">${subject}</h2>
      </div>
      <div style="padding:24px;color:#374151;line-height:1.6;">
        <p style="margin:0 0 12px 0;">Welcome to SociaLen.</p>
        <p style="margin:0 0 12px 0;">Use the following One-Time Password to continue:</p>
        <p style="margin:0 0 12px 0;font-size:24px;font-weight:700;letter-spacing:2px;color:#111827;">${otp}</p>
        <p style="margin:0;color:#6b7280;">This code expires in 10 minutes.</p>
      </div>
      <div style="padding:16px 24px;color:#6b7280;font-size:12px;border-top:1px solid #f0f2f5;">
        Sent by ${fromName}
      </div>
    </div>
  </div>`;
  await transporter.sendMail({
    from: `${fromName} <${fromAddress}>`,
    to: email,
    subject,
    text,
    html
  });
};