"use client";

import { createStarterCheckoutSession } from "@/app/actions/stripe";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Props du composant StarterButton
 */
interface StarterButtonProps {
  locale: string;
  label?: string;
  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "link"
    | "destructive"
    | "secondary";
  className?: string;
}

/**
 * Composant bouton interne
 */
function SubmitButton({
  label,
  variant,
  className,
  isPending,
  onClick,
}: {
  label: string;
  variant: StarterButtonProps["variant"];
  className: string;
  isPending: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      disabled={isPending}
      variant={variant || "default"}
      className={className}
      size="lg"
      onClick={onClick}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Redirection...
        </>
      ) : (
        label
      )}
    </Button>
  );
}

/**
 * Composant bouton pour passer au plan Starter
 *
 * Affiche un bouton qui redirige vers Stripe Checkout pour souscrire au plan Starter.
 * La redirection est gérée côté client pour éviter les problèmes avec redirect().
 *
 * @param locale - La locale de l'application
 * @param label - Le texte du bouton (par défaut: "Choisir Starter")
 * @param variant - La variante du bouton (par défaut: "default")
 * @param className - Classes CSS additionnelles
 */
export function StarterButton({
  locale,
  label = "Choisir Starter",
  variant = "default",
  className = "",
}: StarterButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  /**
   * Gère le clic sur le bouton pour créer la session de checkout
   */
  const handleCheckout = async () => {
    setIsPending(true);

    try {
      const result = await createStarterCheckoutSession(locale);

      // Si on a une URL, on redirige vers Stripe Checkout
      if ("url" in result && result.url) {
        window.location.href = result.url;
        return;
      }

      // Gestion des erreurs
      if ("error" in result) {
        // Si l'utilisateur n'est pas authentifié, on redirige vers login
        if (result.error === "not_authenticated") {
          router.push(`/${locale}/login`);
          return;
        }

        // Pour les autres erreurs, on affiche une alerte
        alert(
          `Erreur lors de la création de la session de checkout:\n\n${result.error}`
        );
      }
    } catch (error) {
      console.error("Erreur lors de la création de la session:", error);
      alert(
        `Une erreur inattendue s'est produite. Veuillez réessayer plus tard.`
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <SubmitButton
      label={label}
      variant={variant}
      className={className}
      isPending={isPending}
      onClick={handleCheckout}
    />
  );
}

