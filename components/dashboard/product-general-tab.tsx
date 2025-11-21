"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Package } from "lucide-react";
import type { DatabaseProduct } from "@/types/supabase";

/**
 * Props pour le composant ProductGeneralTab
 */
interface ProductGeneralTabProps {
  /**
   * Produit à afficher et modifier
   */
  product: DatabaseProduct;
}

/**
 * Composant pour l'onglet Général
 *
 * Affiche les informations générales du produit (nom, SKU, description, photo).
 * Pour l'instant, affichage en lecture seule (l'édition sera ajoutée plus tard).
 */
export function ProductGeneralTab({ product }: ProductGeneralTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Colonne principale : Informations */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations du produit</CardTitle>
            <CardDescription>
              Détails et caractéristiques principales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nom du produit */}
            <div className="space-y-2">
              <Label htmlFor="name">Nom du produit</Label>
              <Input
                id="name"
                value={product.name}
                disabled
                className="bg-muted"
              />
            </div>

            {/* SKU */}
            <div className="space-y-2">
              <Label htmlFor="sku">SKU / Référence</Label>
              <Input
                id="sku"
                value={product.sku}
                disabled
                className="bg-muted font-mono"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={product.description || ""}
                disabled
                rows={6}
                className="resize-none bg-muted"
                placeholder="Aucune description"
              />
              {!product.description && (
                <p className="text-xs text-muted-foreground">
                  Aucune description n&apos;a été ajoutée pour ce produit.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Colonne latérale : Photo */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Photo du produit</CardTitle>
            <CardDescription>Image principale</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-border bg-muted">
              {product.photo_url ? (
                <img
                  src={product.photo_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
            {product.photo_url && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Photo principale du produit
              </p>
            )}
          </CardContent>
        </Card>

        {/* Message temporaire */}
        <Card className="border-dashed">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              L&apos;édition des informations sera disponible prochainement.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

