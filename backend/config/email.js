const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.log('EMAIL ERROR:', error);
    } else {
        console.log('Email server ready');
    }
});

const sendVerificationEmail = async(email, name, otp) => {
    await transporter.sendMail({
        from: `"CampusVerse" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your CampusVerse verification code',
        html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#fff;padding:40px;border-radius:12px;">
        <h1 style="color:#7c3aed;text-align:center;">CampusVerse</h1>
        <h2>Hi ${name}, here is your verification code</h2>
        <p>Enter this OTP to verify your email address:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:12px;text-align:center;background:#1a1a2e;padding:20px;border-radius:8px;margin:20px 0;">${otp}</div>
        <p style="color:#888;">This code expires in 10 minutes. Do not share it with anyone.</p>
      </div>`
    });
};

const sendApprovalEmail = async(email, name) => {
    await transporter.sendMail({
        from: `"CampusVerse" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🎉 Your CampusVerse account is approved!',
        html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#fff;padding:40px;border-radius:12px;">
        <h1 style="color:#7c3aed;text-align:center;">CampusVerse</h1>
        <h2>Welcome aboard, ${name}! 🎉</h2>
        <p>Your account has been approved by the admin. You can now login and explore CampusVerse.</p>
        <a href="${process.env.CLIENT_URL}/login" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Login Now</a>
      </div>`
    });
};

const sendRejectionEmail = async(email, name, reason) => {
    await transporter.sendMail({
        from: `"CampusVerse" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'CampusVerse account application update',
        html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#fff;padding:40px;border-radius:12px;">
        <h1 style="color:#7c3aed;text-align:center;">CampusVerse</h1>
        <h2>Hi ${name},</h2>
        <p>Unfortunately your account application was not approved.</p>
        <p><strong>Reason:</strong> ${reason || 'Invalid or unclear college ID card.'}</p>
        <p>You may re-register with a clearer ID card image.</p>
      </div>`
    });
};

const sendPasswordResetEmail = async(email, name, token) => {
    const url = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await transporter.sendMail({
        from: `"CampusVerse" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Reset your CampusVerse password',
        html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#fff;padding:40px;border-radius:12px;">
        <h1 style="color:#7c3aed;text-align:center;">CampusVerse</h1>
        <h2>Hi ${name}, reset your password</h2>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Reset Password</a>
      </div>`
    });
};

module.exports = { sendVerificationEmail, sendApprovalEmail, sendRejectionEmail, sendPasswordResetEmail };