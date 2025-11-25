import { Resend } from "resend";
import { WelcomeEmail, ProWelcomeEmail, CertificateRequestEmail } from "@/components/emails/welcome-email";

// Adresse d'envoi par défaut (à changer une fois le domaine vérifié sur Resend)
// Pour les tests sans domaine vérifié, utiliser: onboarding@resend.dev
const SENDER_EMAIL = "TraceLink <onboarding@resend.dev>";

/**
 * Envoie l'email de bienvenue lors de l'inscription
 */
export async function sendWelcomeEmail(email: string, name: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ RESEND_API_KEY manquante. Email non envoyé.");
    return { success: false, error: "No API Key" };
  }

  const resend = new Resend(apiKey);

  console.log(`📧 Envoi de l'email de bienvenue à ${email}...`);

  try {
    const data = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject: "Bienvenue chez TraceLink ! 🚀",
      react: WelcomeEmail({ firstName: name }),
    });

    const emailId = (data as any)?.id || (data as any)?.data?.id;
    console.log("✅ Email de bienvenue envoyé:", emailId);
    return { success: true, id: emailId };
  } catch (error) {
    console.error("❌ Erreur envoi email bienvenue:", error);
    return { success: false, error };
  }
}

/**
 * Envoie l'email de confirmation pour le passage au plan Pro
 */
export async function sendProConfirmationEmail(email: string, name: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ RESEND_API_KEY manquante. Email non envoyé.");
    return { success: false, error: "No API Key" };
  }

  const resend = new Resend(apiKey);

  console.log(`📧 Envoi de l'email Pro à ${email}...`);

  try {
    const data = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject: "Confirmation de votre passage Pro 🌟",
      react: ProWelcomeEmail({ firstName: name }),
    });

    const emailId = (data as any)?.id || (data as any)?.data?.id;
    console.log("✅ Email Pro envoyé:", emailId);
    return { success: true, id: emailId };
  } catch (error) {
    console.error("❌ Erreur envoi email Pro:", error);
    return { success: false, error };
  }
}

/**
 * Envoie un email de demande de certificat à un fournisseur
 */
export async function sendCertificateRequestEmail(
  supplierEmail: string,
  brandName: string,
  productName: string,
  componentType: string,
  customMessage?: string
) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ RESEND_API_KEY manquante. Email non envoyé.");
    return { success: false, error: "No API Key" };
  }

  const resend = new Resend(apiKey);

  console.log(`📧 Envoi de demande de certificat à ${supplierEmail}...`);

  try {
    const data = await resend.emails.send({
      from: SENDER_EMAIL,
      to: supplierEmail,
      replyTo: process.env.SUPPORT_EMAIL || SENDER_EMAIL, // Permet au fournisseur de répondre directement à la marque
      subject: `La marque ${brandName} a besoin d'un document`,
      react: CertificateRequestEmail({ 
        brandName, 
        productName, 
        componentType,
        customMessage 
      }),
    });

    const emailId = (data as any)?.id || (data as any)?.data?.id;
    console.log("✅ Email de demande de certificat envoyé:", emailId);
    return { success: true, id: emailId };
  } catch (error) {
    console.error("❌ Erreur envoi email demande certificat:", error);
    return { success: false, error };
  }
}

/**
 * Envoie une demande de certificat au fournisseur avec copie à l'utilisateur
 * 
 * @param supplierEmail - Email du fournisseur
 * @param userEmail - Email de l'utilisateur (propriétaire de la marque) pour la copie
 * @param brandName - Nom de la marque
 * @param productName - Nom du produit
 * @param componentType - Type de composant
 * @param customMessage - Message personnalisé (optionnel)
 */
export async function sendSupplierRequest(
  supplierEmail: string,
  userEmail: string,
  brandName: string,
  productName: string,
  componentType: string,
  customMessage?: string
) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ RESEND_API_KEY manquante. Email non envoyé.");
    return { success: false, error: "No API Key" };
  }

  const resend = new Resend(apiKey);

  console.log(`📧 Envoi de demande de certificat à ${supplierEmail} avec copie à ${userEmail}...`);

  try {
    // Email au fournisseur
    const supplierData = await resend.emails.send({
      from: SENDER_EMAIL,
      to: supplierEmail,
      cc: userEmail, // Copie à l'utilisateur
      replyTo: userEmail, // Le fournisseur peut répondre directement à la marque
      subject: `La marque ${brandName} a besoin d'un document`,
      react: CertificateRequestEmail({ 
        brandName, 
        productName, 
        componentType,
        customMessage 
      }),
    });

    const emailId = (supplierData as any)?.id || (supplierData as any)?.data?.id;
    console.log("✅ Email de demande de certificat envoyé au fournisseur:", emailId);
    return { success: true, id: emailId };
  } catch (error) {
    console.error("❌ Erreur envoi email demande certificat:", error);
    return { success: false, error };
  }
}

