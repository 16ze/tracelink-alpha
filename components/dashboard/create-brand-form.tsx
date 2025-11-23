"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { createBrand, type BrandActionState } from "@/lib/dashboard-actions";
import { CheckCircle2, AlertCircle, Building2 } from "lucide-react";

/**
 * Composant pour le bouton de soumission avec état de chargement
 */
function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Création en cours..." : children}
    </Button>
  );
}

/**
 * Composant de formulaire pour créer une marque
 *
 * Affiche un formulaire permettant à l'utilisateur de créer sa marque.
 * Une fois créée, la page est rafraîchie automatiquement.
 */
export function CreateBrandForm() {
  const router = useRouter();

  // État pour le formulaire avec useActionState (React 19)
  const [state, formAction] = useActionState<BrandActionState | null, FormData>(
    createBrand,
    null
  );

  // Gestion de la redirection après succès
  useEffect(() => {
    if (state?.redirect) {
      // Rafraîchir la page pour afficher la marque créée
      router.refresh();
    }
  }, [state?.redirect, router]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">Créer votre marque</CardTitle>
        <CardDescription>
          Pour commencer à utiliser TraceLink, vous devez créer votre marque.
          C&apos;est rapide et gratuit !
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {/* Affichage des erreurs */}
          {state?.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {/* Affichage des messages de succès */}
          {state?.success && (
            <Alert variant="success">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Succès</AlertTitle>
              <AlertDescription>{state.success}</AlertDescription>
            </Alert>
          )}

          {/* Champ Nom de la marque */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nom de la marque <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Ex: Ma Marque Fashion"
              required
              minLength={2}
              maxLength={255}
              autoComplete="organization"
              disabled={!!state?.success}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 2 caractères, maximum 255 caractères
            </p>
          </div>

          {/* Champ Site Web (optionnel) */}
          <div className="space-y-2">
            <Label htmlFor="website_url">Site Web (optionnel)</Label>
            <Input
              id="website_url"
              name="website_url"
              type="url"
              placeholder="https://www.mamarque.com"
              autoComplete="url"
              disabled={!!state?.success}
            />
            <p className="text-xs text-muted-foreground">
              Commencez par http:// ou https://
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton>Créer ma marque</SubmitButton>
        </CardFooter>
      </form>
    </Card>
  );
}

