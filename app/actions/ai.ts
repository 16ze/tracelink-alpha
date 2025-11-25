"use server";

import OpenAI from "openai";

/**
 * Génère une description de produit par IA
 *
 * @param productName - Nom du produit
 * @param features - Caractéristiques clés du produit
 * @param locale - Langue de sortie ('fr' ou 'en')
 * @returns La description générée ou null en cas d'erreur
 */
export async function generateProductDescription(
  productName: string,
  features: string,
  locale: string = "fr"
): Promise<string | null> {
  try {
    // Vérification de la clé API OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY n'est pas définie dans les variables d'environnement");
      return null;
    }

    // Initialisation du client OpenAI
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Prompt système
    const systemPrompt =
      "Tu es un expert en copywriting pour l'industrie textile éco-responsable. Tu rédiges des descriptions produits séduisantes, courtes (3-4 phrases) et optimisées pour la vente. Ton ton est élégant et professionnel.";

    // Prompt utilisateur
    const userPrompt = `Rédige une description pour un produit nommé "${productName}". Voici ses caractéristiques clés : ${features}. La langue de sortie doit être : ${locale}.`;

    // Appel à l'API OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7, // Créativité modérée
      max_tokens: 200, // Limite pour garder la description courte (3-4 phrases)
    });

    // Extraction de la réponse
    const generatedDescription =
      completion.choices[0]?.message?.content?.trim() || null;

    if (!generatedDescription) {
      console.error("Aucune description générée par OpenAI");
      return null;
    }

    return generatedDescription;
  } catch (error) {
    console.error("Erreur lors de la génération de description par IA:", error);
    return null;
  }
}

