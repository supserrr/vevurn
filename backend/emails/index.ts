import nodemailer from "nodemailer";
import { buildSendMail } from "mailing-core";
import { env } from "../src/config/env";

const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT || 587,
  secure: env.SMTP_SECURE || false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

const sendMail = buildSendMail({
  transport,
  defaultFrom: env.SMTP_FROM || "noreply@vevurn.com",
  configPath: "./mailing.config.json",
});

export default sendMail;
