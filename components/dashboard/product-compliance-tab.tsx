"use client";

import {
  updateProductCompliance,
  type ComplianceActionState,
} from "@/app/[locale]/dashboard/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { DatabaseProduct } from "@/types/supabase";
import { AlertCircle, CheckCircle2, Lock } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

/**
 * Props pour le composant ProductComplianceTab
 */
interface ProductComplianceTabProps {
  /**
   * Produit à éditer
   */
  product: DatabaseProduct;
  /**
   * Indique si l'utilisateur est en plan Pro
   */
  isProPlan: boolean;
  /**
   * Locale pour les liens
   */
  locale: string;
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
    <Button type="submit" disabled={pending || disabled} className="w-full">
      {pending ? "Sauvegarde en cours..." : children}
    </Button>
  );
}

/**
 * Composant pour l'onglet Entretien & Loi AGEC
 *
 * Affiche un formulaire pour gérer les informations de compliance et d'entretien.
 * Réservé aux membres Pro.
 */
export function ProductComplianceTab({
  product,
  isProPlan,
  locale,
}: ProductComplianceTabProps) {
  // État pour le formulaire avec useActionState (React 19)
  const [state, formAction] = useActionState<
    ComplianceActionState | null,
    FormData
  >(updateProductCompliance, null);

  // Réinitialiser le formulaire après succès
  useEffect(() => {
    if (state?.success) {
      // Réinitialiser le formulaire en rechargeant la page
      // Le cache sera révalidé par la Server Action
      window.location.reload();
    }
  }, [state?.success]);

  // Récupération des valeurs actuelles
  // @ts-ignore - Les types Supabase ne reconnaissent pas encore les colonnes compliance
  const compositionText = (product as any)?.composition_text || "";
  // @ts-ignore
  const careWash = (product as any)?.care_wash || "";
  // @ts-ignore
  const careBleach = (product as any)?.care_bleach || false;
  // @ts-ignore
  const careDry = (product as any)?.care_dry || "";
  // @ts-ignore
  const careIron = (product as any)?.care_iron || "";
  // @ts-ignore
  const recyclability = (product as any)?.recyclability || false;
  // @ts-ignore
  const releasedMicroplastics =
    (product as any)?.released_microplastics || false;

  return (
    <div className="space-y-6">
      {/* Message d'information Pro */}
      {!isProPlan && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>Fonctionnalité Pro</AlertTitle>
          <AlertDescription>
            La gestion des données de compliance (Entretien & Loi AGEC) est
            réservée aux membres Pro.{" "}
            <Link
              href={`/${locale}/dashboard`}
              className="underline font-medium"
            >
              Passez Pro
            </Link>{" "}
            pour accéder à cette fonctionnalité.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Entretien & Loi AGEC</CardTitle>
          <CardDescription>
            Informations réglementaires et instructions d&apos;entretien du
            produit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <div className="space-y-6">
              {/* Champ caché pour l'ID du produit */}
              <input type="hidden" name="product_id" value={product.id} />

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

              {/* Composition Text */}
              <div className="space-y-2">
                <Label
                  htmlFor="composition_text"
                  className={!isProPlan ? "text-muted-foreground" : ""}
                >
                  Composition{" "}
                  <span className="text-muted-foreground">
                    (Ex: 100% Coton Bio)
                  </span>
                </Label>
                <Textarea
                  id="composition_text"
                  name="composition_text"
                  defaultValue={compositionText}
                  disabled={!isProPlan}
                  rows={3}
                  placeholder="Ex: 100% Coton Bio, 50% Polyester 50% Coton..."
                  className={!isProPlan ? "bg-muted" : ""}
                />
              </div>

              {/* Instructions d'entretien */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Instructions d&apos;entretien
                </h3>

                {/* Lavage */}
                <div className="space-y-2">
                  <Label
                    htmlFor="care_wash"
                    className={
                      !isProPlan
                        ? "text-muted-foreground flex items-center gap-2"
                        : ""
                    }
                  >
                    Température de lavage
                    {!isProPlan && <Lock className="h-4 w-4" />}
                  </Label>
                  <Select
                    name="care_wash"
                    defaultValue={careWash}
                    disabled={!isProPlan}
                  >
                    <SelectTrigger className={!isProPlan ? "bg-muted" : ""}>
                      <SelectValue placeholder="Sélectionnez la température" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="30_deg">Lavage à 30°C</SelectItem>
                      <SelectItem value="40_deg">Lavage à 40°C</SelectItem>
                      <SelectItem value="60_deg">Lavage à 60°C</SelectItem>
                      <SelectItem value="hand_wash">
                        Lavage à la main
                      </SelectItem>
                      <SelectItem value="no_wash">Ne pas laver</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Javel */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="care_bleach"
                      className={
                        !isProPlan
                          ? "text-muted-foreground flex items-center gap-2"
                          : ""
                      }
                    >
                      Javel autorisée
                      {!isProPlan && <Lock className="h-4 w-4" />}
                    </Label>
                    <Switch
                      id="care_bleach"
                      name="care_bleach"
                      defaultChecked={careBleach}
                      disabled={!isProPlan}
                      value={careBleach ? "true" : "false"}
                      onCheckedChange={(checked) => {
                        const hiddenInput = document.getElementById(
                          "care_bleach_hidden"
                        ) as HTMLInputElement;
                        if (hiddenInput) {
                          hiddenInput.value = checked ? "true" : "false";
                        }
                      }}
                    />
                  </div>
                  <input
                    type="hidden"
                    id="care_bleach_hidden"
                    name="care_bleach"
                    defaultValue={careBleach ? "true" : "false"}
                  />
                </div>

                {/* Séchage */}
                <div className="space-y-2">
                  <Label
                    htmlFor="care_dry"
                    className={
                      !isProPlan
                        ? "text-muted-foreground flex items-center gap-2"
                        : ""
                    }
                  >
                    Séchage
                    {!isProPlan && <Lock className="h-4 w-4" />}
                  </Label>
                  <Select
                    name="care_dry"
                    defaultValue={careDry}
                    disabled={!isProPlan}
                  >
                    <SelectTrigger className={!isProPlan ? "bg-muted" : ""}>
                      <SelectValue placeholder="Sélectionnez le mode de séchage" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="no_dryer">
                        Séchage interdit au sèche-linge
                      </SelectItem>
                      <SelectItem value="tumble_low">
                        Sèche-linge à basse température
                      </SelectItem>
                      <SelectItem value="tumble_medium">
                        Sèche-linge à température moyenne
                      </SelectItem>
                      <SelectItem value="tumble_high">
                        Sèche-linge à haute température
                      </SelectItem>
                      <SelectItem value="line_dry">
                        Séchage à l&apos;air libre
                      </SelectItem>
                      <SelectItem value="flat_dry">Séchage à plat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Repassage */}
                <div className="space-y-2">
                  <Label
                    htmlFor="care_iron"
                    className={
                      !isProPlan
                        ? "text-muted-foreground flex items-center gap-2"
                        : ""
                    }
                  >
                    Repassage
                    {!isProPlan && <Lock className="h-4 w-4" />}
                  </Label>
                  <Select
                    name="care_iron"
                    defaultValue={careIron}
                    disabled={!isProPlan}
                  >
                    <SelectTrigger className={!isProPlan ? "bg-muted" : ""}>
                      <SelectValue placeholder="Sélectionnez la température de repassage" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="no_iron">
                        Repassage interdit
                      </SelectItem>
                      <SelectItem value="low">
                        Repassage à basse température (max 110°C)
                      </SelectItem>
                      <SelectItem value="medium">
                        Repassage à température moyenne (max 150°C)
                      </SelectItem>
                      <SelectItem value="high">
                        Repassage à haute température (max 200°C)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Loi AGEC */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold">Conformité Loi AGEC</h3>

                {/* Recyclabilité */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="recyclability"
                      className={
                        !isProPlan
                          ? "text-muted-foreground flex items-center gap-2"
                          : ""
                      }
                    >
                      ♻️ Produit recyclable
                      {!isProPlan && <Lock className="h-4 w-4" />}
                    </Label>
                    <Switch
                      id="recyclability"
                      name="recyclability"
                      defaultChecked={recyclability}
                      disabled={!isProPlan}
                      value={recyclability ? "true" : "false"}
                      onCheckedChange={(checked) => {
                        const hiddenInput = document.getElementById(
                          "recyclability_hidden"
                        ) as HTMLInputElement;
                        if (hiddenInput) {
                          hiddenInput.value = checked ? "true" : "false";
                        }
                      }}
                    />
                  </div>
                  <input
                    type="hidden"
                    id="recyclability_hidden"
                    name="recyclability"
                    defaultValue={recyclability ? "true" : "false"}
                  />
                </div>

                {/* Microplastiques */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="released_microplastics"
                      className={
                        !isProPlan
                          ? "text-muted-foreground flex items-center gap-2"
                          : ""
                      }
                    >
                      Rejette des microplastiques lors du lavage
                      {!isProPlan && <Lock className="h-4 w-4" />}
                    </Label>
                    <Switch
                      id="released_microplastics"
                      name="released_microplastics"
                      defaultChecked={releasedMicroplastics}
                      disabled={!isProPlan}
                      value={releasedMicroplastics ? "true" : "false"}
                      onCheckedChange={(checked) => {
                        const hiddenInput = document.getElementById(
                          "released_microplastics_hidden"
                        ) as HTMLInputElement;
                        if (hiddenInput) {
                          hiddenInput.value = checked ? "true" : "false";
                        }
                      }}
                    />
                  </div>
                  <input
                    type="hidden"
                    id="released_microplastics_hidden"
                    name="released_microplastics"
                    defaultValue={releasedMicroplastics ? "true" : "false"}
                  />
                </div>
              </div>

              {/* Bouton de soumission */}
              <div className="pt-4">
                <SubmitButton disabled={!isProPlan}>
                  {isProPlan ? "Sauvegarder" : "Disponible avec le plan Pro"}
                </SubmitButton>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
