"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { requestCertificateFromSupplier, getSupplierEmail } from "@/lib/dashboard-actions";
import { useRouter } from "next/navigation";

interface RequestCertificateDialogProps {
  componentId: string;
  componentType: string;
  productId: string;
  productName?: string;
  supplierId?: string | null;
  trigger?: React.ReactNode;
}

export function RequestCertificateDialog({
  componentId,
  componentType,
  productId,
  productName,
  supplierId,
  trigger,
}: RequestCertificateDialogProps) {
  const [open, setOpen] = useState(false);
  const [supplierEmail, setSupplierEmail] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoadingSupplier, setIsLoadingSupplier] = useState(false);
  const router = useRouter();

  // Récupération de l'email du fournisseur si supplier_id existe
  useEffect(() => {
    if (open && supplierId && !supplierEmail) {
      setIsLoadingSupplier(true);
      getSupplierEmail(supplierId)
        .then((email) => {
          if (email) {
            setSupplierEmail(email);
          }
          setIsLoadingSupplier(false);
        })
        .catch(() => {
          setIsLoadingSupplier(false);
        });
    }
  }, [open, supplierId, supplierEmail]);

  // Pré-remplir le message par défaut
  useEffect(() => {
    if (open && !customMessage && productName) {
      const defaultMessage = `Bonjour,\n\nPourriez-vous nous envoyer le certificat pour ${componentType} utilisé dans ${productName} ?\n\nMerci.`;
      setCustomMessage(defaultMessage);
    }
  }, [open, customMessage, componentType, productName]);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("🖱️ Clic sur le bouton envoyer");
    e.preventDefault();
    console.log("✅ preventDefault() appelé - Formulaire non soumis de manière classique");
    
    setError(null);
    setSuccess(null);

    console.log("📝 Validation des données du formulaire...");
    console.log("📧 Email fournisseur:", supplierEmail);
    console.log("📄 Message:", customMessage);
    console.log("🆔 Product ID:", productId);
    console.log("🔧 Component ID:", componentId);

    if (!supplierEmail.trim()) {
      console.error("❌ Validation échouée: Email fournisseur manquant");
      setError("L'adresse email est requise.");
      return;
    }

    console.log("✅ Validation OK - Démarrage de la transition...");
    
    startTransition(async () => {
      console.log("🔄 Transition démarrée - Appel de l'action serveur requestCertificateFromSupplier...");
      try {
        const result = await requestCertificateFromSupplier(
          supplierEmail.trim(),
          productId,
          componentId,
          customMessage.trim() || undefined
        );

        console.log("📥 Résultat reçu de requestCertificateFromSupplier:", result);

        if (result.error) {
          console.error("❌ Erreur retournée:", result.error);
          setError(result.error);
        } else {
          console.log("✅ Succès! Message:", result.success);
          setSuccess(result.success || "Demande envoyée avec succès !");
          // Fermer la modale après 2 secondes
          setTimeout(() => {
            console.log("🔒 Fermeture de la modale dans 2 secondes...");
            setOpen(false);
            setSupplierEmail("");
            setCustomMessage("");
            setError(null);
            setSuccess(null);
            router.refresh();
          }, 2000);
        }
      } catch (err) {
        console.error("❌ Exception capturée dans handleSubmit:");
        console.error("Type:", err instanceof Error ? err.constructor.name : typeof err);
        console.error("Message:", err instanceof Error ? err.message : String(err));
        console.error("Stack:", err instanceof Error ? err.stack : "N/A");
        setError("Une erreur inattendue est survenue.");
      }
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    console.log(isOpen ? "📂 Dialog ouverte" : "📁 Dialog fermée");
    setOpen(isOpen);
    if (!isOpen) {
      // Reset form when closing
      console.log("🔄 Réinitialisation du formulaire...");
      setSupplierEmail("");
      setCustomMessage("");
      setError(null);
      setSuccess(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2"
            title="Demander au fournisseur"
          >
            <Mail className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Demander un certificat</DialogTitle>
          <DialogDescription>
            Envoyez une demande par email pour obtenir le certificat du composant{" "}
            <strong>{componentType}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email du fournisseur */}
          <div className="space-y-2">
            <Label htmlFor="supplier-email">
              Email du fournisseur <span className="text-destructive">*</span>
            </Label>
            <Input
              id="supplier-email"
              type="email"
              placeholder="fournisseur@example.com"
              value={supplierEmail}
              onChange={(e) => setSupplierEmail(e.target.value)}
              required
              disabled={isPending || isLoadingSupplier}
              className="bg-white"
            />
            {isLoadingSupplier && (
              <p className="text-xs text-muted-foreground">Chargement des informations du fournisseur...</p>
            )}
          </div>

          {/* Message personnalisé */}
          <div className="space-y-2">
            <Label htmlFor="custom-message">Message personnalisé (optionnel)</Label>
            <Textarea
              id="custom-message"
              placeholder="Ajoutez un message personnalisé pour votre fournisseur..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              disabled={isPending}
              rows={4}
              className="bg-white"
            />
            <p className="text-xs text-muted-foreground">
              Ce message sera inclus dans l'email envoyé au fournisseur.
            </p>
          </div>

          {/* Messages d'erreur/succès */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Boutons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isPending} 
              className="gap-2"
              onClick={() => console.log("🖱️ Bouton submit cliqué (avant onSubmit du form)")}
            >
              <Send className="h-4 w-4" />
              {isPending ? "Envoi en cours..." : "Envoyer la demande"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

