"use client";

import { useEffect, useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line
} from "recharts";
import { Activity, Users, FileText, Loader2, CircleCheck } from "lucide-react";

import { analyticsService, AuditLog } from "@/services/analytics.service";
import { useAuthStore } from "@/stores/authStore";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Fausses données pour illustrer les graphiques si l'API est vide/non formatée
const MOCK_CHART_DATA = [
  { name: "Jan", memoires: 12 },
  { name: "Fév", memoires: 19 },
  { name: "Mar", memoires: 15 },
  { name: "Avr", memoires: 22 },
  { name: "Mai", memoires: 30 },
  { name: "Juin", memoires: 28 },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  
  const [chartData] = useState<any[]>(MOCK_CHART_DATA);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Appels réels commentés en attendant le vrai format du Backend
        // const kpiData = await analyticsService.getKpis();
        // const chartData = await analyticsService.getChartsData();
        
        if (user?.role === 'ADMIN') {
          const auditData = await analyticsService.getAuditLogs(1);
          setAuditLogs(auditData.data || []);
        }
      } catch (error) {
        console.error("Erreur chargement analytics", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadDashboardData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">Vue d'ensemble de l'activité sur Valiha.</p>
      </div>

      {/* KPIs Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mémoires Validés</CardTitle>
            <FileText className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>          
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mémoires en attente</CardTitle>
            <Activity className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>          
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recherches (IA)</CardTitle>
            <CircleCheck className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,204</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">573</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-muted">
          <CardHeader>
            <CardTitle>Évolution des Dépôts</CardTitle>
            <CardDescription>Nombre de mémoires soumis sur les 6 derniers mois.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-75 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: '1px solid #eee' }} />
                  <Bar dataKey="memoires" fill="var(--color-primary)" radius={[4, 4, 0, 0]} className="fill-primary" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 sm:col-span-4 md:col-span-3 border-muted">
          <CardHeader>
            <CardTitle>Consultations</CardTitle>
            <CardDescription>Trafic sur la plateforme.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-75 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #eee' }} />
                  <Line type="monotone" dataKey="memoires" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4 }} className="stroke-primary" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Audit Logs (Admin) */}
      {(user?.role === 'ADMIN' || true) && (
        <Card className="shadow-sm border-muted">
          <CardHeader>
            <CardTitle>Journal d'Audit (Logs)</CardTitle>
            <CardDescription>Dernières actions critiques effectuées sur la plateforme.</CardDescription>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                Vous n'avez pas l'historique d'audit, ou le backend est vide.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead className="text-right">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{new Date(log.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell>{log.userId}</TableCell>
                      <TableCell className="text-right text-muted-foreground">Succès</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
