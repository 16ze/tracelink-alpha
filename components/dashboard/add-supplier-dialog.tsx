"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Building2 } from "lucide-react";
import { useActionState, useState } from "react";
import { createSupplier } from "@/app/[locale]/dashboard/suppliers/actions";

interface AddSupplierDialogProps {
  locale: string;
}

/**
 * Modale d'ajout de fournisseur
 *
 * Permet à l'utilisateur d'ajouter un nouveau fournisseur
 * avec nom, pays, email et certifications.
 */
export function AddSupplierDialog({ locale }: AddSupplierDialogProps) {
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState("");
  
  const [state, formAction, isPending] = useActionState(createSupplier, null);

  // Fermeture de la modale après succès
  if (state?.success && open) {
    setTimeout(() => {
      setOpen(false);
      setCountry("");
    }, 1000);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un fournisseur
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Nouveau fournisseur</DialogTitle>
              <DialogDescription>
                Ajoutez un nouveau fournisseur à votre réseau de traçabilité.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form action={formAction} className="space-y-4">
          {/* Alerte de succès */}
          {state?.success && (
            <Alert className="bg-green-50 text-green-900 border-green-200">
              <AlertDescription>{state.success}</AlertDescription>
            </Alert>
          )}

          {/* Alerte d'erreur */}
          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {/* Champ Nom */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nom du fournisseur <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Ex: EcoTextile France"
              required
              disabled={isPending}
              maxLength={255}
            />
          </div>

          {/* Champ Pays */}
          <div className="space-y-2">
            <Label htmlFor="country">
              Pays <span className="text-red-500">*</span>
            </Label>
            <Select
              name="country"
              value={country}
              onValueChange={setCountry}
              required
              disabled={isPending}
            >
              <SelectTrigger id="country">
                <SelectValue placeholder="Sélectionnez un pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="France">France</SelectItem>
                <SelectItem value="Italie">Italie</SelectItem>
                <SelectItem value="Portugal">Portugal</SelectItem>
                <SelectItem value="Espagne">Espagne</SelectItem>
                <SelectItem value="Allemagne">Allemagne</SelectItem>
                <SelectItem value="Belgique">Belgique</SelectItem>
                <SelectItem value="Pays-Bas">Pays-Bas</SelectItem>
                <SelectItem value="Turquie">Turquie</SelectItem>
                <SelectItem value="Inde">Inde</SelectItem>
                <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                <SelectItem value="Chine">Chine</SelectItem>
                <SelectItem value="Vietnam">Vietnam</SelectItem>
                <SelectItem value="Maroc">Maroc</SelectItem>
                <SelectItem value="Tunisie">Tunisie</SelectItem>
                <SelectItem value="Autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Champ Email (optionnel) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email de contact</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="contact@fournisseur.com"
              disabled={isPending}
            />
          </div>

          {/* Champ Certifications (optionnel) */}
          <div className="space-y-2">
            <Label htmlFor="certifications">Certifications</Label>
            <Input
              id="certifications"
              name="certifications"
              placeholder="Ex: GOTS, OEKO-TEX, Fair Trade"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Listez les certifications écologiques ou sociales de ce fournisseur.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer le fournisseur
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}



