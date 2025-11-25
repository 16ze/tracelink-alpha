"use client";

import { useState } from "react";
import { Eye, Upload, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import type {
  DatabaseComponent,
  DatabaseCertificate,
} from "@/types/supabase";
import { UploadCertificateDialog } from "./upload-certificate-dialog";
import { RequestCertificateDialog } from "./request-certificate-dialog";

/**
 * Props pour le composant ComponentTableRow
 */
interface ComponentTableRowProps {
  component: DatabaseComponent;
  productId: string;
  productName?: string;
  formattedDate: string;
  IconComponent: React.ComponentType<{ className?: string }>;
  hasCertificate: boolean;
  certificate: DatabaseCertificate | null;
  /**
   * Indique si l'utilisateur est en plan Pro (autorise l'upload de certificats)
   */
  isProPlan?: boolean;
}

/**
 * Composant pour une ligne du tableau des composants avec gestion des certificats
 */
export function ComponentTableRow({
  component,
  productId,
  productName,
  formattedDate,
  IconComponent,
  hasCertificate,
  certificate,
  isProPlan = false,
}: ComponentTableRowProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  /**
   * Gère le clic sur le bouton d'upload pour les utilisateurs gratuits
   */
  const handleLockedUpload = () => {
    alert(
      "L'ajout de certificats PDF est réservé aux membres Pro.\n\nPassez Pro pour débloquer cette fonctionnalité."
    );
  };

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-2">
            <IconComponent className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{component.type}</span>
          </div>
        </TableCell>
        <TableCell>{component.origin_country}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2 flex-wrap">
            {hasCertificate && certificate ? (
              <>
                <Badge variant="default" className="bg-green-600">
                  Vérifié
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(certificate.file_url, "_blank")}
                  className="h-7 px-2"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </>
            ) : isProPlan ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsUploadDialogOpen(true)}
                className="gap-2 bg-white"
              >
                <Upload className="h-4 w-4" />
                Ajouter une preuve
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLockedUpload}
                className="gap-2 bg-white text-muted-foreground"
              >
                <Lock className="h-4 w-4" />
                Pro uniquement
              </Button>
            )}
            {/* Bouton pour demander la preuve au fournisseur */}
            <RequestCertificateDialog
              componentId={component.id}
              componentType={component.type}
              productId={productId}
              productName={productName}
              supplierId={component.supplier_id}
            />
          </div>
        </TableCell>
        <TableCell className="text-right text-muted-foreground text-sm">
          {formattedDate}
        </TableCell>
      </TableRow>

      {/* Modale d'upload de certificat */}
      <UploadCertificateDialog
        componentId={component.id}
        componentName={component.type}
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
      />
    </>
  );
}

