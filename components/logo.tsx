import Image from "next/image";
import Link from "next/link";

/**
 * Props pour le composant Logo
 */
interface LogoProps {
  /**
   * Taille du logo
   */
  size?: "sm" | "md" | "lg";
  /**
   * Lien optionnel (si fourni, le logo devient cliquable)
   */
  href?: string;
  /**
   * Classe CSS additionnelle
   */
  className?: string;
}

/**
 * Composant Logo TraceLink
 *
 * Affiche le logo TraceLink avec le texte "TRACELINK" et "PASSEPORT NUMÉRIQUE PRODUIT"
 */
export function Logo({ size = "md", href, className = "" }: LogoProps) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16",
  };

  const logoContent = (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/images/Tracelink.jpg"
        alt="TraceLink - Passeport Numérique Produit"
        width={size === "sm" ? 200 : size === "md" ? 280 : 360}
        height={size === "sm" ? 60 : size === "md" ? 80 : 100}
        className={`${sizeClasses[size]} w-auto object-contain`}
        priority
        unoptimized
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}

