"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { login, signup, type AuthActionState } from "./actions";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * Composant pour le bouton de soumission avec état de chargement
 */
function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Chargement..." : children}
    </Button>
  );
}

/**
 * Page de connexion/inscription
 *
 * Gère l'authentification des utilisateurs avec :
 * - Connexion par email/mot de passe
 * - Inscription avec confirmation email
 * - Affichage des erreurs et messages de succès
 */
export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const errorFromCallback = searchParams.get("error");

  // États pour les formulaires avec useActionState (React 19)
  const [loginState, loginAction] = useActionState<AuthActionState | null, FormData>(
    login,
    null
  );
  const [signupState, signupAction] = useActionState<AuthActionState | null, FormData>(
    signup,
    null
  );

  // Gestion de la redirection après succès de connexion
  useEffect(() => {
    if (loginState?.redirect) {
      router.push(loginState.redirect);
    }
  }, [loginState?.redirect, router]);

  // Gestion de la redirection après succès d'inscription (si pas de confirmation email)
  useEffect(() => {
    if (signupState?.redirect) {
      router.push(signupState.redirect);
    }
  }, [signupState?.redirect, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <Tabs defaultValue="login" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Connexion</TabsTrigger>
          <TabsTrigger value="signup">Inscription</TabsTrigger>
        </TabsList>

        {/* Onglet Connexion */}
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Se connecter</CardTitle>
              <CardDescription>
                Entrez vos identifiants pour accéder à TraceLink.
              </CardDescription>
            </CardHeader>
            <form action={loginAction}>
              <CardContent className="space-y-4">
                {/* Affichage des erreurs du callback */}
                {errorFromCallback && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur d&apos;authentification</AlertTitle>
                    <AlertDescription>
                      Une erreur est survenue lors de l&apos;authentification.
                      Veuillez réessayer.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Affichage des erreurs de connexion */}
                {loginState?.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>{loginState.error}</AlertDescription>
                  </Alert>
                )}

                {/* Affichage des messages de succès */}
                {loginState?.success && (
                  <Alert variant="success">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Succès</AlertTitle>
                    <AlertDescription>{loginState.success}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nom@exemple.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <SubmitButton>Se connecter</SubmitButton>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Onglet Inscription */}
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>Créer un compte</CardTitle>
              <CardDescription>
                Créez votre compte pour commencer à gérer vos passeports produits.
              </CardDescription>
            </CardHeader>
            <form action={signupAction}>
              <CardContent className="space-y-4">
                {/* Affichage des erreurs d'inscription */}
                {signupState?.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>{signupState.error}</AlertDescription>
                  </Alert>
                )}

                {/* Affichage des messages de succès (confirmation email) */}
                {signupState?.success && (
                  <Alert variant="success">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Inscription réussie</AlertTitle>
                    <AlertDescription>{signupState.success}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="nom@exemple.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 6 caractères
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                    minLength={6}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <SubmitButton>S&apos;inscrire</SubmitButton>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

