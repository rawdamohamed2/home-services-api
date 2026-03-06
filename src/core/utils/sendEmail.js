import dotenv from "dotenv";
dotenv.config();
import { BrevoClient } from "@getbrevo/brevo";

const brevo = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY,
});

export const sendEmail = async (toEmail, subject, text) => {
    try {
        await brevo.transactionalEmails.sendTransacEmail({
            sender: { email: "rawdamohamed618@gmail.com", name: "ServiGo" },
            to: [{ email: toEmail }],
            subject: subject,
            textContent: text
        });

        console.log("email sent successfully!");

    } catch (err) {
        console.error("Email send error:", err);
    }
};