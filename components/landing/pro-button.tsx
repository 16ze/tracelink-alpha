"use client";

import { Button } from "@/components/ui/button";
import { redirectToCheckout } from "@/app/actions/stripe";
import { useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * Props du composant ProButton
 */
interface ProButtonProps {
  locale: string;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  className?: string;
}

/**
 * Composant bouton pour passer au plan Pro
 * 
 * Affiche un bouton qui redirige vers Stripe Checkout pour souscrire au plan Pro.
 * Gère l'état de chargement pendant la création de la session.
 * 
 * @param locale - La locale de l'application
 * @param label - Le texte du bouton (par défaut: "Passer Pro")
 * @param variant - La variante du bouton (par défaut: "default")
 * @param className - Classes CSS additionnelles
 */
export function ProButton({
  locale,
  label = "Passer Pro",
  variant = "default",
  className = "",
}: ProButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("locale", locale);
      await redirectToCheckout(formData);
    } catch (error) {
      console.error("Erreur lors de la redirection vers Stripe:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant={variant}
      className={className}
      size="lg"
    >
      {isLoading ? (
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
