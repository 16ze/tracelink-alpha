"use client";

import React, { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ComponentTableRow } from "./component-table-row";
import {
  addComponent,
  type ComponentActionState,
} from "@/lib/dashboard-actions";
import type { DatabaseComponent, DatabaseCertificate } from "@/types/supabase";
import {
  CheckCircle2,
  AlertCircle,
  Plus,
  Package,
  Scissors,
  CircleDot,
  Link as LinkIcon,
  Box,
  Upload,
  Eye,
  FileText,
} from "lucide-react";

/**
 * Fonction pour obtenir l'icône selon le type de composant
 */
function getComponentIcon(type: string) {
  const typeLower = type.toLowerCase();
  if (typeLower.includes("matière première") || typeLower.includes("fibre")) return Package;
  if (typeLower.includes("filature")) return Scissors;
  if (typeLower.includes("tissage") || typeLower.includes("tricotage")) return Package;
  if (typeLower.includes("teinture") || typeLower.includes("impression")) return Package;
  if (typeLower.includes("confection") || typeLower.includes("assemblage")) return Package;
  if (typeLower.includes("accessoire") || typeLower.includes("bouton") || typeLower.includes("zip") || typeLower.includes("rivet")) return CircleDot;
  if (typeLower.includes("emballage")) return Box;
  if (typeLower.includes("transport") || typeLower.includes("logistique")) return Box;
  if (typeLower.includes("recyclage") || typeLower.includes("fin de vie")) return Package;
  return Package; // Par défaut
}

/**
 * Type pour un composant avec ses certificats
 */
interface ComponentWithCertificates extends DatabaseComponent {
  certificates?: DatabaseCertificate[];
}

/**
 * Props pour le composant ProductCompositionTab
 */
interface ProductCompositionTabProps {
  /**
   * ID du produit
   */
  productId: string;
  /**
   * Liste des composants actuels avec leurs certificats
   */
  components: ComponentWithCertificates[];
  /**
   * Indique si l'utilisateur est en plan Pro
   */
  isProPlan?: boolean;
}

/**
 * Composant pour le bouton de soumission avec état de chargement
 */
function SubmitButton({
  children,
  disabled = false,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      className="bg-white hover:bg-white/90 text-foreground border border-border disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Ajout en cours..." : children}
    </Button>
  );
}

/**
 * Composant pour l'onglet Composition & Traçabilité
 *
 * Affiche la liste des composants du produit et permet d'en ajouter de nouveaux.
 */
export function ProductCompositionTab({
  productId,
  components,
  isProPlan = false,
}: ProductCompositionTabProps) {
  // État pour le formulaire avec useActionState (React 19)
  const [state, formAction] = useActionState<ComponentActionState | null, FormData>(
    addComponent,
    null
  );

  // État contrôlé pour le Select
  const [selectedType, setSelectedType] = useState<string>("");
  // État pour le type personnalisé (quand "Autre" est sélectionné)
  const [customType, setCustomType] = useState<string>("");

  // Réinitialiser le champ personnalisé si "Autre" n'est plus sélectionné
  useEffect(() => {
    if (selectedType !== "Autre") {
      setCustomType("");
    }
  }, [selectedType]);

  // Réinitialiser le formulaire après succès
  useEffect(() => {
    if (state?.success) {
      // Réinitialiser le formulaire
      setSelectedType("");
      setCustomType("");
      // Réinitialiser le formulaire en rechargeant la page
      // Le cache sera révalidé par la Server Action
      window.location.reload();
    }
  }, [state?.success]);

  return (
    <div className="space-y-6">
      {/* Liste des composants */}
      <Card>
        <CardHeader>
          <CardTitle>Composants du produit</CardTitle>
          <CardDescription>
            Liste des matières premières et composants de ce produit ({components.length}{" "}
            {components.length === 1 ? "composant" : "composants"})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {components.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>Aucun composant pour le moment.</p>
              <p className="text-sm mt-2">
                Ajoutez votre premier composant ci-dessous.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Pays d&apos;origine</TableHead>
                  <TableHead>Certificat</TableHead>
                  <TableHead className="text-right">Date d&apos;ajout</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {components.map((component) => {
                  const createdDate = new Date(component.created_at);
                  const formattedDate = new Intl.DateTimeFormat("fr-FR", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }).format(createdDate);

                  // Récupération de l'icône selon le type
                  const IconComponent = getComponentIcon(component.type);
                  
                  // Vérification si le composant a un certificat
                  const hasCertificate =
                    component.certificates && component.certificates.length > 0;
                  const certificate = hasCertificate
                    ? component.certificates![0]
                    : null;

                  return (
                    <ComponentTableRow
                      key={component.id}
                      component={component}
                      productId={productId}
                      formattedDate={formattedDate}
                      IconComponent={IconComponent}
                      hasCertificate={!!hasCertificate}
                      certificate={certificate}
                      isProPlan={isProPlan}
                    />
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Formulaire d'ajout de composant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Ajouter un composant
          </CardTitle>
          <CardDescription>
            Ajoutez une nouvelle matière première ou composant à ce produit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <div className="space-y-4">
              {/* Champ caché pour l'ID du produit */}
              <input type="hidden" name="product_id" value={productId} />
              {/* Champ caché pour le type : utilise le type personnalisé si "Autre" est sélectionné, sinon le type sélectionné */}
              <input
                type="hidden"
                name="type"
                value={selectedType === "Autre" ? customType.trim() : selectedType}
                required
              />

              {/* Affichage des erreurs */}
              {state?.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erreur</AlertTitle>
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}

              {/* Affichage des messages de succès */}
              {state?.success && (
                <Alert variant="success">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Succès</AlertTitle>
                  <AlertDescription>{state.success}</AlertDescription>
                </Alert>
              )}

              {/* Champ Type (Select) */}
              <div className="space-y-2">
                <Label htmlFor="type">
                  Type de composant <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger id="type" className="bg-white">
                    <div className="flex items-center gap-2 w-full">
                      {selectedType ? (
                        <>
                          {React.createElement(
                            getComponentIcon(
                              selectedType === "Autre" ? customType : selectedType
                            ),
                            {
                              className: "h-4 w-4",
                            }
                          )}
                          <SelectValue>
                            {selectedType === "Autre" && customType
                              ? customType
                              : selectedType}
                          </SelectValue>
                        </>
                      ) : (
                        <SelectValue placeholder="Sélectionnez un type" />
                      )}
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="Matière Première (Fibre)">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>Matière Première (Fibre)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Filature">
                      <div className="flex items-center gap-2">
                        <Scissors className="h-4 w-4" />
                        <span>Filature</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Tissage / Tricotage">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>Tissage / Tricotage</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Teinture / Impression">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>Teinture / Impression</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Confection (Assemblage)">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>Confection (Assemblage)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Accessoires (Boutons, Zips, Rivets)">
                      <div className="flex items-center gap-2">
                        <CircleDot className="h-4 w-4" />
                        <span>Accessoires (Boutons, Zips, Rivets)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Emballage">
                      <div className="flex items-center gap-2">
                        <Box className="h-4 w-4" />
                        <span>Emballage</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Transport / Logistique">
                      <div className="flex items-center gap-2">
                        <Box className="h-4 w-4" />
                        <span>Transport / Logistique</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Recyclage / Fin de vie">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>Recyclage / Fin de vie</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Autre">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>Autre (Personnalisé)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Champ Type personnalisé (affiché uniquement si "Autre" est sélectionné) */}
              {selectedType === "Autre" && (
                <div className="space-y-2">
                  <Label htmlFor="custom_type">
                    Précisez le type <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="custom_type"
                    name="custom_type"
                    type="text"
                    placeholder="Ex: Coton bio, Polyester recyclé..."
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    required={selectedType === "Autre"}
                    maxLength={100}
                    className="bg-white"
                  />
                  <p className="text-xs text-muted-foreground">
                    Saisissez le type de composant spécifique
                  </p>
                </div>
              )}

              {/* Champ Pays d'origine */}
              <div className="space-y-2">
                <Label htmlFor="origin_country">
                  Pays d&apos;origine <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="origin_country"
                  name="origin_country"
                  type="text"
                  placeholder="Ex: France, Portugal, Espagne..."
                  required
                  maxLength={100}
                  autoComplete="country-name"
                  className="bg-white"
                />
                <p className="text-xs text-muted-foreground">
                  Pays d&apos;origine du composant
                </p>
              </div>

              {/* Bouton de soumission */}
              <div className="flex justify-end">
                <SubmitButton
                  disabled={
                    !selectedType ||
                    (selectedType === "Autre" && !customType.trim())
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </SubmitButton>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

