"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/types";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Package,
  Calendar,
  TrendingUp,
  Zap,
} from "lucide-react";

interface StatCard {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur de chargement"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-nova-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-red-400" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const cards: StatCard[] = [
    {
      label: "Total equipements",
      value: stats.total_equipements,
      icon: Package,
      color: "text-nova-500",
      bgColor: "bg-nova-500/10",
    },
    {
      label: "Equipements actifs",
      value: stats.equipements_actifs,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "En panne",
      value: stats.equipements_en_panne,
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      label: "En maintenance",
      value: stats.equipements_en_maintenance,
      icon: Wrench,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Taux de disponibilite",
      value: `${stats.taux_disponibilite}%`,
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Maintenances prevues",
      value: stats.maintenances_prevues,
      icon: Calendar,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Alertes critiques",
      value: stats.alertes_critiques,
      icon: Zap,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      label: "Interventions ce mois",
      value: stats.interventions_mois,
      icon: Activity,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b border-[hsl(var(--border))] px-6">
        <h1 className="text-sm font-semibold text-[hsl(var(--foreground))]">
          Tableau de bord
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    {card.label}
                  </p>
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.bgColor}`}
                  >
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-[hsl(var(--foreground))]">
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
