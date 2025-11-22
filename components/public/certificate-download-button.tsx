"use client";

import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DatabaseCertificate } from "@/types/supabase";

/**
 * Props pour le composant CertificateDownloadButton
 */
interface CertificateDownloadButtonProps {
  /**
   * Certificat à télécharger
   */
  certificate: DatabaseCertificate;
  /**
   * Nom du composant (pour le nom du fichier)
   */
  componentName: string;
}

/**
 * Composant bouton pour télécharger un certificat
 */
export function CertificateDownloadButton({
  certificate,
  componentName,
}: CertificateDownloadButtonProps) {
  const t = useTranslations("passport");
  
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = certificate.file_url;
    // Génération d'un nom de fichier avec le type de composant et le type de certificat
    const fileName = `${componentName}-${certificate.type}.pdf`;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleDownload}
      className="p-1 rounded hover:bg-muted transition-colors"
      title={t("download_cert")}
      aria-label={t("download_cert")}
    >
      <FileText className="h-4 w-4 text-primary" />
    </button>
  );
}

