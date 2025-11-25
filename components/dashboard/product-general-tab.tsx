"use client";

import { useState, useRef, useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Package,
  Upload,
  Save,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { DatabaseProduct } from "@/types/supabase";
import {
  updateProduct,
  deleteProduct,
  type ProductActionState,
} from "@/app/[locale]/dashboard/actions";
import Image from "next/image";

/**
 * Props pour le composant ProductGeneralTab
 */
interface ProductGeneralTabProps {
  /**
   * Produit à afficher et modifier
   */
  product: DatabaseProduct;
  /**
   * Locale pour les redirections
   */
  locale: string;
}

/**
 * Composant pour le bouton de soumission avec état de chargement
 */
function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Enregistrement...
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" />
          {children}
        </>
      )}
    </Button>
  );
}

/**
 * Composant pour l'onglet Général
 *
 * Affiche et permet de modifier les informations générales du produit
 * (nom, SKU, description, photo).
 */
export function ProductGeneralTab({ product, locale }: ProductGeneralTabProps) {
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    product.photo_url
  );

  // États pour les champs du formulaire
  const [name, setName] = useState(product.name);
  const [sku, setSku] = useState(product.sku);
  const [description, setDescription] = useState(product.description || "");

  // État pour la suppression
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Wrapper pour passer la locale à l'action updateProduct
  const updateProductWithLocale = async (
    prevState: ProductActionState | null,
    formData: FormData
  ) => updateProduct(prevState, formData, locale);

  // État pour l'action de mise à jour
  const [updateState, updateAction] = useActionState<ProductActionState | null, FormData>(
    updateProductWithLocale,
    null
  );

  // Gestion de la prévisualisation de la photo
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Créer une URL temporaire pour la prévisualisation
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Gestion de la soumission du formulaire
  const handleSubmit = (formData: FormData) => {
    // Ajouter l'ID du produit et les valeurs actuelles
    formData.append("productId", product.id);
    formData.append("name", name);
    formData.append("sku", sku);
    formData.append("description", description);
    
    // Ajouter la photo si une nouvelle a été sélectionnée
    const photoFile = photoInputRef.current?.files?.[0];
    if (photoFile) {
      formData.append("photo", photoFile);
    }

    updateAction(formData);
  };

  // Gestion de la suppression
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteProduct(product.id, locale);
      if (result.error) {
        alert(result.error);
      } else if (result.redirect) {
        router.push(result.redirect);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Une erreur est survenue lors de la suppression.");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Réinitialiser la prévisualisation si la photo du produit change
  useEffect(() => {
    setPhotoPreview(product.photo_url);
  }, [product.photo_url]);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale : Informations */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations du produit</CardTitle>
              <CardDescription>
                Modifiez les détails et caractéristiques principales
              </CardDescription>
            </CardHeader>
            <form action={handleSubmit}>
              <CardContent className="space-y-6">
                {/* Affichage des erreurs */}
                {updateState?.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>{updateState.error}</AlertDescription>
                  </Alert>
                )}

                {/* Affichage des messages de succès */}
                {updateState?.success && (
                  <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800 dark:text-green-200">
                      Succès
                    </AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      {updateState.success}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Nom du produit */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nom du produit <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={255}
                    placeholder="Ex: T-shirt Coton Bio"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum 255 caractères
                  </p>
                </div>

                {/* SKU */}
                <div className="space-y-2">
                  <Label htmlFor="sku">
                    SKU / Référence <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                    maxLength={100}
                    className="font-mono"
                    placeholder="Ex: TSH-BIO-001"
                  />
                  <p className="text-xs text-muted-foreground">
                    Code unique identifiant le produit (maximum 100 caractères)
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    className="resize-none"
                    placeholder="Décrivez votre produit en quelques mots..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Description optionnelle du produit
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex gap-4">
                <div className="flex-1">
                  <SubmitButton>Enregistrer les modifications</SubmitButton>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Colonne latérale : Photo */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Photo du produit</CardTitle>
              <CardDescription>Image principale</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-border bg-muted">
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo">Changer la photo</Label>
                <div className="flex items-center gap-4">
                  <Input
                    ref={photoInputRef}
                    id="photo"
                    name="photo"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    className="cursor-pointer"
                  />
                  <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Formats acceptés : JPEG, PNG, WebP. Taille maximale : 10MB.
                  Laisser vide pour conserver l&apos;image actuelle.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Bouton de suppression */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Zone de danger</CardTitle>
              <CardDescription>
                Actions irréversibles sur ce produit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer ce produit
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Cette action est définitive. Les composants et certificats
                associés seront également supprimés.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le produit &quot;
              {product.name}&quot; ? Cette action est irréversible et supprimera
              également tous les composants et certificats associés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
