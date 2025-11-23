"use client";

import { useActionState, use, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { createProduct, type ProductActionState } from "../../actions";
import { CheckCircle2, AlertCircle, Package, ArrowLeft, Upload } from "lucide-react";

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
 * Page de création de produit
 *
 * Affiche un formulaire permettant de créer un nouveau produit
 * avec upload d'image vers Supabase Storage.
 */
export default function NewProductPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const router = useRouter();

  // Créer un wrapper pour passer la locale
  const createProductWithLocale = async (
    prevState: ProductActionState | null,
    formData: FormData
  ) => createProduct(prevState, formData, locale);

  // État pour le formulaire avec useActionState (React 19)
  const [state, formAction] = useActionState<ProductActionState | null, FormData>(
    createProductWithLocale,
    null
  );

  // Gestion de la redirection après succès
  useEffect(() => {
    if (state?.redirect) {
      router.push(state.redirect);
    }
  }, [state?.redirect, router]);

  return (
    <main className="min-h-screen bg-muted/40 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* En-tête avec bouton retour */}
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/dashboard`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Nouveau Produit
              </h1>
              <p className="text-muted-foreground">
                Créez un nouveau produit et son passeport numérique
              </p>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <Card>
          <CardHeader>
            <CardTitle>Informations du produit</CardTitle>
            <CardDescription>
              Remplissez les informations ci-dessous pour créer votre produit
            </CardDescription>
          </CardHeader>
          <form action={formAction}>
            <CardContent className="space-y-6">
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

              {/* Champ Nom du produit */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nom du produit <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Ex: T-shirt Coton Bio"
                  required
                  maxLength={255}
                  autoComplete="off"
                  disabled={!!state?.success}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum 255 caractères
                </p>
              </div>

              {/* Champ SKU/Référence */}
              <div className="space-y-2">
                <Label htmlFor="sku">
                  SKU / Référence <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sku"
                  name="sku"
                  type="text"
                  placeholder="Ex: TSH-BIO-001"
                  required
                  maxLength={100}
                  autoComplete="off"
                  disabled={!!state?.success}
                />
                <p className="text-xs text-muted-foreground">
                  Code unique identifiant le produit (maximum 100 caractères)
                </p>
              </div>

              {/* Champ Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Décrivez votre produit en quelques mots..."
                  rows={4}
                  className="resize-none"
                  disabled={!!state?.success}
                />
                <p className="text-xs text-muted-foreground">
                  Description optionnelle du produit
                </p>
              </div>

              {/* Champ Photo du produit */}
              <div className="space-y-2">
                <Label htmlFor="photo">
                  Photo du produit <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="photo"
                    name="photo"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    required
                    disabled={!!state?.success}
                    className="cursor-pointer"
                  />
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Formats acceptés : JPEG, PNG, WebP. Taille maximale : 10MB.
                  La photo est indispensable pour le passeport numérique.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex gap-4">
              <Link href={`/${locale}/dashboard`} className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Annuler
                </Button>
              </Link>
              <div className="flex-1">
                <SubmitButton>Créer le produit</SubmitButton>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}

