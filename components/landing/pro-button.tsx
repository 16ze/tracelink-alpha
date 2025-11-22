"use client";

import { createCheckoutSession } from "@/app/actions/stripe";
import { Button } from "@/components/ui/button";
import { useState } from "react";

/**
 * Composant client pour le bouton "Passer Pro"
 *
 * Ce composant gère l'interaction avec la Server Action createCheckoutSession
 * pour rediriger l'utilisateur vers Stripe Checkout.
 *
 * @param locale - La locale actuelle pour la redirection
 * @param label - Le texte du bouton (traduit)
 */
export function ProButton({
  locale,
  label,
}: {
  locale: string;
  label: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Gestionnaire de clic pour créer la session Stripe Checkout
   */
  const handleClick = async () => {
    try {
      setIsLoading(true);
      // Price ID de test - À remplacer par votre vrai Price ID depuis Stripe Dashboard
      const priceId = "price_1SWFJPRV6sSMPgcXsPwANc51"; // Placeholder à remplacer
      // Appel de la Server Action qui va rediriger vers Stripe
      const result = await createCheckoutSession(priceId, locale);

      // Si la Server Action retourne une erreur (au lieu de rediriger)
      // Vérifier que ce n'est pas une redirection Next.js
      if (result?.error) {
        // Si c'est une redirection Next.js, ne pas traiter comme une erreur
        if (
          result.error === "NEXT_REDIRECT" ||
          result.error.includes("NEXT_REDIRECT")
        ) {
          // C'est une redirection, c'est normal, on ne fait rien
          return;
        }
        // Sinon, c'est une vraie erreur
        console.error("❌ Erreur depuis la Server Action:", result.error);
        alert(`Erreur: ${result.error}`);
        setIsLoading(false);
      }
      // Si pas d'erreur retournée, c'est qu'une redirection a été effectuée
      // (redirect() lance une exception que Next.js intercepte, donc on n'arrive jamais ici)
    } catch (error) {
      // Next.js redirect() lance une exception spéciale avec un digest
      // C'est normal et attendu, on ne doit pas afficher d'erreur dans ce cas
      if (
        error &&
        typeof error === "object" &&
        ("digest" in error || "message" in error)
      ) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        // Les redirections Next.js ont généralement un message spécifique
        if (
          errorMessage.includes("NEXT_REDIRECT") ||
          (error as any).digest?.includes("NEXT_REDIRECT")
        ) {
          // C'est une redirection Next.js, c'est normal, on ne fait rien
          return;
        }
      }
      // Sinon, c'est une vraie erreur qu'on doit afficher
      console.error("❌ Erreur lors de la création de la session:", error);
      alert(
        `Erreur: ${
          error instanceof Error ? error.message : "Une erreur est survenue"
        }`
      );
      setIsLoading(false);
    }
  };

  return (
    <Button className="w-full mt-8" onClick={handleClick} disabled={isLoading}>
      {isLoading ? "Redirection..." : label}
    </Button>
  );
}
