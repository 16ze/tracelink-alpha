"use client";

import type { AnalyticsStats } from "@/app/[locale]/dashboard/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, Lock, Package, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Props pour le composant AnalyticsSection
 */
interface AnalyticsSectionProps {
  stats: AnalyticsStats;
  isProPlan: boolean;
  locale: string;
}

/**
 * Composant pour afficher la section Analytics du dashboard
 */
export function AnalyticsSection({
  stats,
  isProPlan,
  locale,
}: AnalyticsSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Performances</h2>
        <p className="text-muted-foreground">
          Suivez l&apos;impact de vos passeports numériques
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Produits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Produits
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Produits créés</p>
          </CardContent>
        </Card>

        {/* Total Scans */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalScans}</div>
            <p className="text-xs text-muted-foreground">Vues totales</p>
          </CardContent>
        </Card>

        {/* Top Produit */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Produit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.topProduct ? (
              <>
                <div className="text-2xl font-bold">
                  {stats.topProduct.scans}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {stats.topProduct.name}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Aucun scan pour l&apos;instant
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Graphique */}
      <Card>
        <CardHeader>
          <CardTitle>Scans des 7 derniers jours</CardTitle>
          <CardDescription>
            Évolution des vues de passeports au cours de la semaine
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isProPlan ? (
            <div className="relative">
              {/* Version floutée pour plan gratuit */}
              <div className="blur-sm pointer-events-none">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.scansLast7Days}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Overlay avec message */}
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                <Alert className="w-auto max-w-md">
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">
                        Total:{" "}
                        <span className="text-2xl">{stats.totalScans}</span>{" "}
                        scans
                      </p>
                      <p className="text-sm">
                        <a
                          href={`/${locale}/dashboard`}
                          className="underline font-medium"
                        >
                          Passez Pro
                        </a>{" "}
                        pour voir l&apos;évolution détaillée.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          ) : (
            /* Version complète pour plan Pro */
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.scansLast7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
