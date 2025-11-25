"use client";

import { useEffect } from "react";
import { trackScan } from "@/app/actions/analytics";

/**
 * Props pour le composant PassportTracker
 */
interface PassportTrackerProps {
  productId: string;
}

/**
 * Composant pour tracker les scans (vues) de passeports
 * 
 * Appelle l'action trackScan en arrière-plan via useEffect
 * pour ne pas bloquer le rendu de la page.
 */
export function PassportTracker({ productId }: PassportTrackerProps) {
  useEffect(() => {
    // Détection du type d'appareil
    const getDeviceType = (): "mobile" | "desktop" | "tablet" | undefined => {
      if (typeof window === "undefined") return undefined;
      
      const width = window.innerWidth;
      if (width < 768) return "mobile";
      if (width < 1024) return "tablet";
      return "desktop";
    };

    // Détection du pays (via headers ou géolocalisation IP)
    // Pour l'instant, on ne peut pas récupérer le pays côté client sans API
    // On laisse le serveur le faire si possible
    const country = undefined; // Pourra être enrichi plus tard

    // Appel non-bloquant de l'action serveur
    // On ne wait pas la promesse pour ne pas bloquer le rendu
    trackScan({
      productId,
      deviceType: getDeviceType(),
      country,
    }).catch((error) => {
      // Silently fail - ne pas affecter l'expérience utilisateur
      console.error("Erreur lors du tracking (non bloquant):", error);
    });
  }, [productId]);

  // Ce composant ne rend rien visuellement
  return null;
}

