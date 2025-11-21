"use client";

import { useState } from "react";
import { Eye, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import type {
  DatabaseComponent,
  DatabaseCertificate,
} from "@/types/supabase";
import { UploadCertificateDialog } from "./upload-certificate-dialog";

/**
 * Props pour le composant ComponentTableRow
 */
interface ComponentTableRowProps {
  component: DatabaseComponent;
  formattedDate: string;
  IconComponent: React.ComponentType<{ className?: string }>;
  hasCertificate: boolean;
  certificate: DatabaseCertificate | null;
}

/**
 * Composant pour une ligne du tableau des composants avec gestion des certificats
 */
export function ComponentTableRow({
  component,
  formattedDate,
  IconComponent,
  hasCertificate,
  certificate,
}: ComponentTableRowProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

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
          {hasCertificate && certificate ? (
            <div className="flex items-center gap-2">
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
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUploadDialogOpen(true)}
              className="gap-2 bg-white"
            >
              <Upload className="h-4 w-4" />
              Ajouter une preuve
            </Button>
          )}
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

