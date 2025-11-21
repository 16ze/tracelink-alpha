"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  uploadCertificate,
  type CertificateActionState,
} from "@/app/dashboard/actions";
import { CheckCircle2, AlertCircle, Upload as UploadIcon } from "lucide-react";

/**
 * Props pour le composant UploadCertificateDialog
 */
interface UploadCertificateDialogProps {
  /**
   * ID du composant
   */
  componentId: string;
  /**
   * Nom du composant (pour l'affichage)
   */
  componentName: string;
  /**
   * État d'ouverture de la modale
   */
  open: boolean;
  /**
   * Fonction appelée lors de la fermeture de la modale
   */
  onOpenChange: (open: boolean) => void;
}

/**
 * Composant pour le bouton de soumission avec état de chargement
 */
function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-white hover:bg-white/90 text-foreground border border-border disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Upload en cours..." : children}
    </Button>
  );
}

/**
 * Composant Dialog pour uploader un certificat
 */
export function UploadCertificateDialog({
  componentId,
  componentName,
  open,
  onOpenChange,
}: UploadCertificateDialogProps) {
  // État pour le formulaire avec useActionState (React 19)
  const [state, formAction] = useActionState<
    CertificateActionState | null,
    FormData
  >(uploadCertificate, null);

  // État contrôlé pour le Select
  const [selectedType, setSelectedType] = useState<string>("");
  // État pour le fichier sélectionné
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Réinitialiser le formulaire après succès
  useEffect(() => {
    if (state?.success) {
      // Réinitialiser le formulaire
      setSelectedType("");
      setSelectedFile(null);
      // Fermer la modale et recharger la page
      onOpenChange(false);
      window.location.reload();
    }
  }, [state?.success, onOpenChange]);

  // Réinitialiser le formulaire quand la modale se ferme
  useEffect(() => {
    if (!open) {
      setSelectedType("");
      setSelectedFile(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Ajouter un certificat</DialogTitle>
          <DialogDescription>
            Ajouter un certificat pour <strong>{componentName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form action={formAction}>
          <div className="space-y-4 py-4">
            {/* Champ caché pour l'ID du composant */}
            <input type="hidden" name="component_id" value={componentId} />

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

            {/* Champ Type de certificat (Select) */}
            <div className="space-y-2">
              <Label htmlFor="certificate_type">
                Type de certificat <span className="text-destructive">*</span>
              </Label>
              {/* Input caché pour passer la valeur au formulaire */}
              <input
                type="hidden"
                name="type"
                value={selectedType}
                required
              />
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger id="certificate_type" className="bg-white">
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="GOTS">GOTS</SelectItem>
                  <SelectItem value="Oeko-Tex">Oeko-Tex</SelectItem>
                  <SelectItem value="Facture">Facture</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Champ Fichier */}
            <div className="space-y-2">
              <Label htmlFor="file">
                Fichier <span className="text-destructive">*</span>
              </Label>
              <Input
                id="file"
                name="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setSelectedFile(file);
                }}
                required
                className="bg-white cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Formats acceptés : PDF, JPEG, PNG, WebP (max 10MB)
              </p>
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  Fichier sélectionné : {selectedFile.name} (
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <SubmitButton disabled={!selectedType || !selectedFile}>
                <UploadIcon className="h-4 w-4 mr-2" />
                Uploader
              </SubmitButton>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

