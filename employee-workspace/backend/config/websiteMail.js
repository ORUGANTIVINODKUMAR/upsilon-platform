import transporter, { verifyMailer } from "./mail.js";

/*
  The website and employee workspace now use the same Brevo transporter.
  This wrapper is retained so existing imports do not break.
*/

export const verifyWebsiteMailer = verifyMailer;

export default transporter;