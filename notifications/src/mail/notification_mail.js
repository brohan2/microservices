import nodemailer from 'nodemailer'


const fallbackUser = "campusconnectofficial9@gmail.com";
const fallbackPass = "slyiukvhoubxerpx";
const smtpUser = process.env.SMTP_USER || fallbackUser;
const smtpPass = process.env.SMTP_PASS || fallbackPass;
if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.warn("SMTP_USER/SMTP_PASS not set. Falling back to legacy defaults (not recommended).");
}
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : true,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export const sendEmail = async (email, content, htmlOverride, subjectOverride) => {
  const fromName = process.env.EMAIL_FROM_NAME || "SociaLen";
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || smtpUser || "no-reply@example.com";
  const subject = subjectOverride || process.env.INVITE_EMAIL_SUBJECT || "Invite User";
  const defaultHtml = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f7f7f9;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e6e8eb;border-radius:8px;overflow:hidden;">
      <div style="padding:20px 24px;border-bottom:1px solid #f0f2f5;">
        <h2 style="margin:0;color:#111827;font-size:18px;">${subject}</h2>
      </div>
      <div style="padding:24px;color:#374151;white-space:pre-line;line-height:1.5;">
        ${String(content || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
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
    text: `${content}`,
    html: htmlOverride || defaultHtml
  });
};