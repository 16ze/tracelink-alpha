import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/utils/supabase/server";
import { Building2, Globe, Mail, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserSuppliers } from "./actions";
import { AddSupplierDialog } from "@/components/dashboard/add-supplier-dialog";
import { DeleteSupplierButton } from "@/components/dashboard/delete-supplier-button";

/**
 * Page de gestion des fournisseurs
 *
 * Affiche la liste des fournisseurs de l'utilisateur
 * et permet d'en ajouter de nouveaux via une modale.
 */
export default async function SuppliersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  // Vérification de l'authentification
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Récupération des fournisseurs
  const suppliers = await getUserSuppliers();

  return (
    <main className="min-h-screen bg-muted/40 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête avec bouton retour */}
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/dashboard`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight">
                Fournisseurs
              </h1>
              <p className="text-muted-foreground">
                Gérez vos fournisseurs de matières premières
              </p>
            </div>
            <AddSupplierDialog locale={locale} />
          </div>
        </div>

        {/* Statistique rapide */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Total : <span className="font-semibold text-foreground">{suppliers.length}</span> fournisseur{suppliers.length !== 1 && 's'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Liste des fournisseurs */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des fournisseurs</CardTitle>
            <CardDescription>
              Tous vos fournisseurs de matières premières et composants
            </CardDescription>
          </CardHeader>
          <CardContent>
            {suppliers.length === 0 ? (
              // État vide
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Aucun fournisseur
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Commencez par ajouter votre premier fournisseur pour améliorer
                  la traçabilité de vos produits.
                </p>
                <AddSupplierDialog locale={locale} />
              </div>
            ) : (
              // Table des fournisseurs
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Pays</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Certifications</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => {
                    // Parsing du contact_info
                    const contactInfo = supplier.contact_info as any;
                    const email = contactInfo?.email;
                    const certifications = contactInfo?.certifications;

                    return (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {supplier.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            {supplier.country}
                          </div>
                        </TableCell>
                        <TableCell>
                          {email ? (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <a
                                href={`mailto:${email}`}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {email}
                              </a>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {certifications ? (
                            <Badge variant="secondary" className="font-normal">
                              {certifications}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DeleteSupplierButton
                            supplierId={supplier.id}
                            supplierName={supplier.name}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}




