"use client";

import { useActionState, use, useEffect, useState, useRef } from "react";
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
import { generateProductDescription } from "@/app/actions/ai";
import { CheckCircle2, AlertCircle, Package, ArrowLeft, Upload, Sparkles, Loader2 } from "lucide-react";

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

  // Référence pour le champ description
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // État pour la génération par IA
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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

  // Fonction pour générer la description par IA
  const handleGenerateDescription = async () => {
    // Réinitialiser l'erreur
    setAiError(null);

    // Récupérer le nom du produit
    const productName = nameInputRef.current?.value?.trim() || "";

    // Vérifier que le nom est rempli
    if (!productName) {
      setAiError("Veuillez d'abord entrer un nom de produit");
      return;
    }

    // Démarrer la génération
    setIsGenerating(true);

    try {
      // Préparer les caractéristiques (on peut utiliser le SKU ou demander des mots-clés)
      // Pour l'instant, on utilise juste le nom du produit
      const features = `Produit textile éco-responsable : ${productName}`;

      // Appeler l'action serveur
      const generatedDescription = await generateProductDescription(
        productName,
        features,
        locale
      );

      if (generatedDescription && descriptionRef.current) {
        // Remplir le champ description
        descriptionRef.current.value = generatedDescription;
        // Déclencher un événement pour que React détecte le changement
        const event = new Event("input", { bubbles: true });
        descriptionRef.current.dispatchEvent(event);
      } else {
        setAiError("Impossible de générer la description. Veuillez réessayer.");
      }
    } catch (error) {
      console.error("Erreur lors de la génération:", error);
      setAiError("Une erreur est survenue lors de la génération. Veuillez réessayer.");
    } finally {
      setIsGenerating(false);
    }
  };

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
                  ref={nameInputRef}
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating || !!state?.success}
                    className="gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Générer avec l&apos;IA
                      </>
                    )}
                  </Button>
                </div>
                {aiError && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {aiError}
                    </AlertDescription>
                  </Alert>
                )}
                <Textarea
                  ref={descriptionRef}
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

