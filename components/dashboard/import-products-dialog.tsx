"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, Download, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { bulkImportProducts } from "@/app/[locale]/dashboard/actions";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportProductsDialogProps {
  locale: string;
  isFreePlan?: boolean; // Feature gate : true si plan gratuit (masque le bouton)
}

interface ParsedProduct {
  name: string;
  sku: string;
  description?: string;
  origin_country?: string;
}

export function ImportProductsDialog({ locale, isFreePlan = false }: ImportProductsDialogProps) {
  // Feature gate : Masquer le bouton pour les comptes gratuits
  if (isFreePlan) {
    return null;
  }
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedProduct[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv")) {
      setError("Le fichier doit être au format CSV (.csv)");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(null);

    // Parse du CSV avec PapaParse
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`Erreur de parsing : ${results.errors[0].message}`);
          return;
        }

        const parsed = results.data as ParsedProduct[];
        
        // Validation basique
        if (parsed.length === 0) {
          setError("Le fichier CSV est vide ou ne contient pas de données valides.");
          return;
        }

        // Stocker le total et afficher les 5 premières lignes en prévisualisation
        setTotalRows(parsed.length);
        setPreview(parsed.slice(0, 5));
      },
      error: (error) => {
        setError(`Erreur lors de la lecture du fichier : ${error.message}`);
      },
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFileSelect(selectedFile);
      }
    },
    [handleFileSelect]
  );

  const handleConfirmImport = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Re-parse le fichier complet (pas seulement les 5 premières lignes)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (results.errors.length > 0) {
          setError(`Erreur de parsing : ${results.errors[0].message}`);
          setIsLoading(false);
          return;
        }

        const allProducts = results.data as ParsedProduct[];

        // Validation des colonnes requises
        const requiredColumns = ['name', 'sku'];
        const firstRow = allProducts[0];
        if (!firstRow) {
          setError("Le fichier CSV est vide.");
          setIsLoading(false);
          return;
        }

        const missingColumns = requiredColumns.filter(col => !(col in firstRow));
        if (missingColumns.length > 0) {
          setError(`Colonnes manquantes : ${missingColumns.join(', ')}. Le CSV doit contenir au moins : name, sku`);
          setIsLoading(false);
          return;
        }

        try {
          const result = await bulkImportProducts(allProducts, locale);

          if (result.error) {
            setError(result.error);
          } else {
            setSuccess(result.success || "Import réussi !");
            // Fermer la modale et rafraîchir après 2 secondes
            setTimeout(() => {
              setOpen(false);
              router.refresh();
            }, 2000);
          }
        } catch (err) {
          setError("Une erreur inattendue est survenue.");
        } finally {
          setIsLoading(false);
        }
      },
      error: (error) => {
        setError(`Erreur lors de la lecture du fichier : ${error.message}`);
        setIsLoading(false);
      },
    });
  };

  const handleDownloadTemplate = () => {
    // Créer un lien de téléchargement vers le template
    const link = document.createElement("a");
    link.href = "/template_products.csv";
    link.download = "template_products.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetDialog = () => {
    setFile(null);
    setPreview([]);
    setTotalRows(0);
    setError(null);
    setSuccess(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetDialog();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importer CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importer des produits en masse</DialogTitle>
          <DialogDescription>
            Téléchargez le modèle CSV, remplissez-le avec vos produits, puis importez-le ici.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lien de téléchargement du template */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Modèle CSV</p>
                <p className="text-sm text-muted-foreground">
                  Téléchargez le modèle pour voir le format attendu
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-2">
              <Download className="h-4 w-4" />
              Télécharger le modèle
            </Button>
          </div>

          {/* Zone de drag & drop */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                Glissez-déposez votre fichier CSV ici
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                ou cliquez pour sélectionner un fichier
              </p>
              {file && (
                <p className="text-sm font-medium text-primary">
                  Fichier sélectionné : {file.name}
                </p>
              )}
            </label>
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

          {/* Prévisualisation */}
          {preview.length > 0 && (
              <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Aperçu (5 premières lignes)</h3>
                <p className="text-sm text-muted-foreground">
                  {file && `Total: ${preview.length} ligne(s) affichée(s) sur ${totalRows} détectée(s)`}
                </p>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Pays d'origine</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{product.name || "-"}</TableCell>
                        <TableCell>{product.sku || "-"}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {product.description || "-"}
                        </TableCell>
                        <TableCell>{product.origin_country || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Bouton de confirmation */}
          {preview.length > 0 && !success && (
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  resetDialog();
                }}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button onClick={handleConfirmImport} disabled={isLoading}>
                {isLoading ? "Import en cours..." : `Confirmer l'import (${totalRows} produits)`}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

