import { Resend } from "resend";
import { WelcomeEmail, ProWelcomeEmail } from "@/components/emails/welcome-email";

// Initialisation du client Resend
// Si la clé n'est pas présente, on loggue un avertissement mais on ne plante pas l'appli
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn("⚠️ RESEND_API_KEY manquante. Les emails ne seront pas envoyés.");
}

const resend = new Resend(resendApiKey);

// Adresse d'envoi par défaut (à changer une fois le domaine vérifié sur Resend)
// Pour les tests sans domaine vérifié, utiliser: onboarding@resend.dev
const SENDER_EMAIL = "TraceLink <onboarding@resend.dev>";

/**
 * Envoie l'email de bienvenue lors de l'inscription
 */
export async function sendWelcomeEmail(email: string, name: string) {
  if (!resendApiKey) return { success: false, error: "No API Key" };

  console.log(`📧 Envoi de l'email de bienvenue à ${email}...`);

  try {
    const data = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject: "Bienvenue chez TraceLink ! 🚀",
      react: WelcomeEmail({ firstName: name }),
    });

    console.log("✅ Email de bienvenue envoyé:", data.id);
    return { success: true, id: data.id };
  } catch (error) {
    console.error("❌ Erreur envoi email bienvenue:", error);
    return { success: false, error };
  }
}

/**
 * Envoie l'email de confirmation pour le passage au plan Pro
 */
export async function sendProConfirmationEmail(email: string, name: string) {
  if (!resendApiKey) return { success: false, error: "No API Key" };

  console.log(`📧 Envoi de l'email Pro à ${email}...`);

  try {
    const data = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject: "Confirmation de votre passage Pro 🌟",
      react: ProWelcomeEmail({ firstName: name }),
    });

    console.log("✅ Email Pro envoyé:", data.id);
    return { success: true, id: data.id };
  } catch (error) {
    console.error("❌ Erreur envoi email Pro:", error);
    return { success: false, error };
  }
}

