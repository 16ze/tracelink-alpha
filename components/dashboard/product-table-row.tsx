"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, QrCode, Eye } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { QRCodeDialog } from "./qr-code-dialog";
import type { DatabaseProduct } from "@/types/supabase";

/**
 * Props pour le composant ProductTableRow
 */
interface ProductTableRowProps {
  /**
   * Produit à afficher dans la ligne
   */
  product: DatabaseProduct;
}

/**
 * Composant pour une ligne du tableau des produits
 *
 * Affiche les informations du produit et un bouton pour générer le QR Code.
 * Gère l'ouverture/fermeture de la modale QR Code.
 */
export function ProductTableRow({ product }: ProductTableRowProps) {
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);

  // Formatage de la date
  const createdDate = new Date(product.created_at);
  const formattedDate = new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(createdDate);

  return (
    <>
      <TableRow>
        <TableCell>
          {product.photo_url ? (
            <div className="relative h-12 w-12 rounded-md overflow-hidden border">
              <img
                src={product.photo_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </TableCell>
        <TableCell className="font-medium">{product.name}</TableCell>
        <TableCell>
          <code className="text-sm bg-muted px-2 py-1 rounded">
            {product.sku}
          </code>
        </TableCell>
        <TableCell className="text-right text-muted-foreground">
          {formattedDate}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2 justify-end">
            <Link href={`/dashboard/products/${product.id}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" />
                Détails
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsQrDialogOpen(true)}
              className="gap-2"
            >
              <QrCode className="h-4 w-4" />
              QR Code
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Modale QR Code */}
      <QRCodeDialog
        productId={product.id}
        productName={product.name}
        open={isQrDialogOpen}
        onOpenChange={setIsQrDialogOpen}
      />
    </>
  );
}

