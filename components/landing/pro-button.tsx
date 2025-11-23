"use client";

import { redirectToCheckout, type CheckoutActionState } from "@/app/actions/stripe";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { useActionState, useEffect } from "react";

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
 * Composant bouton interne
 */
function SubmitButton({
  label,
  variant,
  className,
  isPending,
}: {
  label: string;
  variant: ProButtonProps["variant"];
  className: string;
  isPending: boolean;
}) {
  return (
    <Button
      type="submit"
      disabled={isPending}
      variant={variant}
      className={className}
      size="lg"
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
  // Wrapper pour passer la locale à l'action
  const checkoutWithLocale = async (
    prevState: CheckoutActionState | null,
    formData: FormData
  ) => {
    console.log("🔍 [ProButton CLIENT] Appel de redirectToCheckout");
    formData.set("locale", locale);
    return redirectToCheckout(prevState, formData);
  };

  // Utilisation de useActionState pour gérer l'état de l'action
  const [state, formAction, isPending] = useActionState<CheckoutActionState | null, FormData>(
    checkoutWithLocale,
    null
  );

  // Gestion de la redirection côté client quand l'URL est disponible
  useEffect(() => {
    if (state?.checkoutUrl) {
      console.log("🔍 [ProButton CLIENT] Redirection vers:", state.checkoutUrl);
      window.location.href = state.checkoutUrl;
    } else if (state?.error) {
      console.error("❌ [ProButton CLIENT] Erreur:", state.error);
    }
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="locale" value={locale} />
      <SubmitButton 
        label={label} 
        variant={variant} 
        className={className} 
        isPending={isPending}
      />
    </form>
  );
}
