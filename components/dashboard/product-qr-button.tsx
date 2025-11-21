"use client";

import { useState } from "react";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QRCodeDialog } from "./qr-code-dialog";

/**
 * Props pour le composant ProductQRButton
 */
interface ProductQRButtonProps {
  /**
   * ID du produit
   */
  productId: string;
  /**
   * Nom du produit
   */
  productName: string;
}

/**
 * Composant bouton pour afficher le QR Code d'un produit
 *
 * Affiche un bouton qui ouvre une modale avec le QR Code du passeport.
 */
export function ProductQRButton({
  productId,
  productName,
}: ProductQRButtonProps) {
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => setIsQrDialogOpen(true)}
      >
        <QrCode className="h-4 w-4" />
        QR Code
      </Button>

      {/* Modale QR Code */}
      <QRCodeDialog
        productId={productId}
        productName={productName}
        open={isQrDialogOpen}
        onOpenChange={setIsQrDialogOpen}
      />
    </>
  );
}

