"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

// Import dynamique de QRCode pour éviter les erreurs SSR
// react-qr-code utilise QRCode comme export par défaut (qui génère un SVG)
const QRCodeSVG = dynamic(
  () => import("react-qr-code"),
  { ssr: false }
);
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

/**
 * Props pour le composant QRCodeDialog
 */
interface QRCodeDialogProps {
  /**
   * ID du produit pour générer l'URL du passeport
   */
  productId: string;
  /**
   * Nom du produit (pour le nom du fichier téléchargé)
   */
  productName: string;
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
 * Composant Dialog pour afficher et télécharger le QR Code d'un produit
 *
 * Affiche un QR Code pointant vers la page publique du passeport numérique.
 * Permet de télécharger le QR Code en PNG.
 */
export function QRCodeDialog({
  productId,
  productName,
  open,
  onOpenChange,
}: QRCodeDialogProps) {
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [passportUrl, setPassportUrl] = useState<string>("");

  // Génération de l'URL du passeport (côté client uniquement)
  // Utilise la locale par défaut (fr) - le middleware redirigera si nécessaire
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Détecter la locale depuis l'URL actuelle ou utiliser 'fr' par défaut
      const pathname = window.location.pathname;
      const localeMatch = pathname.match(/^\/([a-z]{2})\//);
      const locale = localeMatch ? localeMatch[1] : "fr";
      setPassportUrl(`${window.location.origin}/${locale}/p/${productId}`);
    }
  }, [productId]);

  /**
   * Fonction pour télécharger le QR Code en PNG
   */
  const handleDownload = async () => {
    if (!qrCodeRef.current) return;

    setIsDownloading(true);

    try {
      // Récupération du SVG du QR Code
      const svgElement = qrCodeRef.current.querySelector("svg");
      if (!svgElement) {
        console.error("SVG non trouvé");
        setIsDownloading(false);
        return;
      }

      // Conversion du SVG en canvas puis en PNG
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      // Configuration de la taille du canvas (plus grand pour une meilleure qualité)
      const size = 512;
      canvas.width = size;
      canvas.height = size;

      img.onload = () => {
        if (!ctx) {
          setIsDownloading(false);
          return;
        }

        // Dessin de l'image sur le canvas
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);

        // Conversion en blob puis téléchargement
        canvas.toBlob((blob) => {
          if (!blob) {
            setIsDownloading(false);
            return;
          }

          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `qr-code-${productName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${productId.slice(0, 8)}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          setIsDownloading(false);
        }, "image/png");
      };

      // Chargement du SVG
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      img.src = url;

      img.onerror = () => {
        console.error("Erreur lors du chargement de l'image SVG");
        setIsDownloading(false);
        URL.revokeObjectURL(url);
      };
    } catch (error) {
      console.error("Erreur lors du téléchargement du QR Code:", error);
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>QR Code du Passeport</DialogTitle>
          <DialogDescription>
            Scannez ce QR Code pour accéder au passeport numérique du produit{" "}
            <strong>{productName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-4">
          {/* QR Code */}
          {passportUrl && (
            <div
              ref={qrCodeRef}
              className="bg-white p-4 rounded-lg border-2 border-border"
            >
              <QRCodeSVG
                value={passportUrl}
                size={256}
                level="H"
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>
          )}

          {/* URL du passeport */}
          <div className="w-full space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              URL du passeport :
            </p>
            <code className="block text-xs bg-muted p-2 rounded break-all text-center">
              {passportUrl}
            </code>
          </div>

          {/* Bouton de téléchargement */}
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full gap-2"
            variant="outline"
          >
            <Download className="h-4 w-4" />
            {isDownloading ? "Téléchargement..." : "Télécharger le PNG"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

