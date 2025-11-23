"use client";

import { redirectToCheckout } from "@/app/actions/stripe";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { useRef } from "react";

/**
 * Props du composant ProButton
 */
interface ProButtonProps {
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
 * Composant bouton interne qui utilise useFormStatus
 * Doit être à l'intérieur d'un <form> pour fonctionner
 */
function SubmitButton({
  label,
  variant,
  className,
}: {
  label: string;
  variant: ProButtonProps["variant"];
  className: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      variant={variant}
      className={className}
      size="lg"
    >
      {pending ? (
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
 * Composant bouton pour passer au plan Pro
 *
 * Affiche un bouton qui redirige vers Stripe Checkout pour souscrire au plan Pro.
 * Utilise useFormStatus pour gérer correctement l'état pending de la Server Action.
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
  return (
    <form 
      action={redirectToCheckout}
      onSubmit={(e) => {
        console.log("🔍 [ProButton CLIENT] Formulaire soumis!");
        console.log("🔍 [ProButton CLIENT] Locale:", locale);
        const formData = new FormData(e.currentTarget);
        console.log("🔍 [ProButton CLIENT] FormData locale:", formData.get("locale"));
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <SubmitButton label={label} variant={variant} className={className} />
    </form>
  );
}
