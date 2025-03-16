import transporter from "../config/email.config.js";
import path from "path";
import fs from "fs";

function capitalizeFirstLetter(name) {
  return name
    .split(" ")
    .map(value => value.charAt(0).toUpperCase() + value.slice(1))
    .join(" ");
}

const sendEmail = async (user) => {
  const emailTemplatePath = path.join(process.cwd(), "templates", "email.template.html");
  const verificationLink = `${process.env.BASE_URL}/api/v1/users/verify?token=${user.verificationToken}`;
  let emailTemplate = fs.readFileSync(emailTemplatePath, "utf-8");
  emailTemplate = emailTemplate.replace(/{{name}}/g, capitalizeFirstLetter(user.name)).replace(/{{verification_link}}/g, verificationLink);

  try {
    const info = await transporter.sendMail({
      from: process.env.MAILTRAP_SENDER_EMAIL || "mail.test123@example.com",
      to: user.email, // list of receivers
      subject: "Verification Email",
      html: emailTemplate,
    });
    return info;
  } catch (error) {
    console.error(error.message);
    return null;
  };
};

export default sendEmail;