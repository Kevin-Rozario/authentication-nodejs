import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: process.env.MAILTRAP_USERNAME,
    pass: process.env.MAILTRAP_PASSWORD,
  },
});

const sendEmail = async (user) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SENDER_EMAILID, // sender address
      to: user.email, // list of receivers
      subject: "Verification Email", // Subject line
      text: `${process.env.BASE_URL}/api/v1/users/verify/${user.emailVerificationToken}` // plain text body
    });
    return info;
  } catch (error) {
    console.error(error.message);
    return null;
  }
}

export default sendEmail;