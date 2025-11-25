"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { updateBrandSettings, type BrandActionState } from "@/app/[locale]/dashboard/actions";
import { CheckCircle2, AlertCircle, Lock } from "lucide-react";
import type { DatabaseBrand } from "@/types/supabase";
import { Switch } from "@/components/ui/switch";

/**
 * Props pour le composant BrandSettingsForm
 */
interface BrandSettingsFormProps {
  brand: DatabaseBrand;
  isProPlan: boolean;
  initialPrimaryColor: string;
  initialRemoveBranding: boolean;
  locale: string;
}

/**
 * Composant pour le bouton de soumission avec état de chargement
 */
function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Sauvegarde en cours..." : children}
    </Button>
  );
}

/**
 * Composant de formulaire pour modifier les paramètres de la marque
 */
export function BrandSettingsForm({
  brand,
  isProPlan,
  initialPrimaryColor,
  initialRemoveBranding,
  locale,
}: BrandSettingsFormProps) {
  // Wrapper pour passer la locale à l'action
  const updateWithLocale = async (
    prevState: BrandActionState | null,
    formData: FormData
  ) => {
    return updateBrandSettings(prevState, formData);
  };

  // État pour le formulaire avec useActionState (React 19)
  const [state, formAction] = useActionState<BrandActionState | null, FormData>(
    updateWithLocale,
    null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personnalisation de la marque</CardTitle>
        <CardDescription>
          Modifiez les informations de votre marque et personnalisez l'apparence
          de vos passeports publics
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-6">
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

          {/* Champ Nom de la marque */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nom de la marque <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              defaultValue={brand.name}
              required
              minLength={2}
              maxLength={255}
              autoComplete="organization"
            />
            <p className="text-xs text-muted-foreground">
              Minimum 2 caractères, maximum 255 caractères
            </p>
          </div>

          {/* Champ Site Web */}
          <div className="space-y-2">
            <Label htmlFor="website_url">Site Web (optionnel)</Label>
            <Input
              id="website_url"
              name="website_url"
              type="url"
              defaultValue={brand.website_url || ""}
              placeholder="https://www.mamarque.com"
              autoComplete="url"
            />
            <p className="text-xs text-muted-foreground">
              Lien vers votre site e-commerce (commence par http:// ou https://)
            </p>
          </div>

          {/* Champ Couleur principale */}
          <div className="space-y-2">
            <Label htmlFor="primary_color">
              Couleur principale <span className="text-muted-foreground">(Pro)</span>
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="primary_color"
                name="primary_color"
                type="color"
                defaultValue={initialPrimaryColor}
                className="w-20 h-10 cursor-pointer"
                onChange={(e) => {
                  const textInput = document.getElementById(
                    "primary_color_text"
                  ) as HTMLInputElement;
                  if (textInput) {
                    textInput.value = e.target.value;
                  }
                }}
              />
              <Input
                id="primary_color_text"
                type="text"
                defaultValue={initialPrimaryColor}
                placeholder="#000000"
                pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                className="flex-1 font-mono"
                onChange={(e) => {
                  const colorInput = document.getElementById(
                    "primary_color"
                  ) as HTMLInputElement;
                  if (colorInput && e.target.value.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)) {
                    colorInput.value = e.target.value;
                  }
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Couleur utilisée pour les boutons et le header du passeport public
            </p>
          </div>

          {/* Switch Masquer le logo TraceLink (Pro uniquement) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="remove_branding" className="flex items-center gap-2">
                  Masquer le logo TraceLink
                  {!isProPlan && (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-muted-foreground text-sm">
                    {isProPlan ? "(Pro)" : "(Pro uniquement)"}
                  </span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Masquer le footer &quot;Propulsé par TraceLink&quot; sur les
                  passeports publics
                </p>
              </div>
              <Switch
                id="remove_branding"
                defaultChecked={initialRemoveBranding}
                disabled={!isProPlan}
                onCheckedChange={(checked) => {
                  const hiddenInput = document.getElementById(
                    "remove_branding_hidden"
                  ) as HTMLInputElement;
                  if (hiddenInput) {
                    hiddenInput.value = checked ? "true" : "false";
                  }
                }}
              />
            </div>
            {/* Champ caché pour envoyer la valeur du switch */}
            <input
              type="hidden"
              id="remove_branding_hidden"
              name="remove_branding"
              defaultValue={initialRemoveBranding ? "true" : "false"}
            />
            {!isProPlan && (
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Cette fonctionnalité est réservée aux membres Pro.{" "}
                  <a
                    href={`/${locale}/dashboard`}
                    className="underline font-medium"
                  >
                    Passez Pro
                  </a>{" "}
                  pour masquer le branding TraceLink.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Bouton de soumission */}
          <div className="pt-4">
            <SubmitButton>Sauvegarder</SubmitButton>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}

