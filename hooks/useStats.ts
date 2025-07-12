import { useQuery } from "@tanstack/react-query";
import React from "react";
import { getApiUrl } from "../config/env";
import {
    type ApiResponse,
    type Stats,
    type Vehicle,
    type VehicleAlertDashboard,
} from "../models/stats";
import { useAuth } from "./useAuth";

// Función para obtener vehículos
const fetchVehicles = async (
  headers: HeadersInit,
  logout: () => void
): Promise<ApiResponse<Vehicle>> => {
  const response = await fetch(getApiUrl("/api/vehicles"), { headers });

  if (response.status === 401 || response.status === 403) {
    logout();
    window.location.href = "/";
  }

  if (!response.ok) {
    throw new Error("Error al obtener vehículos");
  }

  return response.json();
};

// Función para obtener alertas
const fetchVehicleAlerts = async (
  headers: HeadersInit,
  logout: () => void
): Promise<ApiResponse<VehicleAlertDashboard>> => {
  const response = await fetch(getApiUrl("/api/vehicles/alerts"), { headers });

  if (response.status === 401 || response.status === 403) {
    logout();
    window.location.href = "/";
  }

  if (!response.ok) {
    throw new Error("Error al obtener alertas");
  }

  return response.json();
};

// Función para calcular estadísticas
const calculateStats = (
  vehicles: Vehicle[],
  alerts: VehicleAlertDashboard[]
): Stats => {
  const totalVehicles = vehicles.length;
  const totalAlerts = alerts.length;

  // Vehículos con alertas (únicos)
  const vehiclesWithAlerts = new Set(alerts.map((alert) => alert.id)).size;

  // Promedios
  const averageFuel =
    vehicles.length > 0
      ? vehicles.reduce(
          (sum, vehicle) => sum + parseFloat(vehicle.combustible),
          0
        ) / vehicles.length
      : 0;

  const averageTemperature =
    vehicles.length > 0
      ? vehicles.reduce(
          (sum, vehicle) => sum + parseFloat(vehicle.temperatura),
          0
        ) / vehicles.length
      : 0;

  const averageSpeed =
    vehicles.length > 0
      ? vehicles.reduce(
          (sum, vehicle) => sum + parseFloat(vehicle.velocidad),
          0
        ) / vehicles.length
      : 0;

  // Tipos de alertas
  const alertTypes = alerts.reduce((acc, alert) => {
    const tipo = alert.tipo_alerta;
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  return {
    totalVehicles,
    totalAlerts,
    vehiclesWithAlerts,
    averageFuel: Math.round(averageFuel) || 0,
    averageTemperature: Math.round(averageTemperature) || 0,
    averageSpeed: Math.round(averageSpeed) || 0,
    alertTypes,
  };
};

export const useStats = () => {
  const { getAuthHeaders, logout } = useAuth();

  // Query para vehículos
  const vehiclesQuery = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => fetchVehicles(getAuthHeaders() as HeadersInit, logout),
  });

  // Query para alertas
  const alertsQuery = useQuery({
    queryKey: ["vehicle-alerts"],
    queryFn: () => fetchVehicleAlerts(getAuthHeaders() as HeadersInit, logout),
  });

  // Calcular estadísticas cuando ambos queries estén listos
  const stats = React.useMemo(() => {
    if (vehiclesQuery.data && alertsQuery.data) {
      return calculateStats(vehiclesQuery.data.data, alertsQuery.data.data);
    }
    return null;
  }, [vehiclesQuery.data, alertsQuery.data]);

  // Estados de carga y error
  const isLoading = vehiclesQuery.isLoading || alertsQuery.isLoading;
  const isError = vehiclesQuery.isError || alertsQuery.isError;
  const error = vehiclesQuery.error || alertsQuery.error;

  return {
    // Datos
    vehicles: vehiclesQuery.data?.data || [],
    alerts: alertsQuery.data?.data || [],
    stats,

    // Estados
    isLoading,
    isError,
    error,

    // Estados individuales
    vehiclesLoading: vehiclesQuery.isLoading,
    alertsLoading: alertsQuery.isLoading,
    vehiclesError: vehiclesQuery.error,
    alertsError: alertsQuery.error,

    // Funciones de refetch
    refetchVehicles: vehiclesQuery.refetch,
    refetchAlerts: alertsQuery.refetch,
  };
};

// Hook específico para estadísticas resumidas
export const useStatsSummary = () => {
  const { stats, isLoading, isError, refetchVehicles, refetchAlerts } =
    useStats();
  const { usuario } = useAuth();
  const summaryStats = React.useMemo(() => {
    if (!stats) return null;
    if (usuario?.rol === "admin") {
      return [
        {
          label: "Vehículos Activos",
          value: stats.totalVehicles.toString(),
          change: "+2",
          changeType: "positive" as const,
          icon: "🚗",
        },
        {
          label: "Alertas Activas",
          value: stats.totalAlerts.toString() || "0",
          change: stats.totalAlerts > 0 ? `+${stats.totalAlerts}` : "0",
          changeType:
            stats.totalAlerts > 0
              ? ("negative" as const)
              : ("positive" as const),
          icon: "⚠️",
        },
        {
          label: "Combustible Promedio",
          value: `${stats.averageFuel}%`,
          change: stats.averageFuel < 20 ? "Bajo" : "Normal",
          changeType:
            stats.averageFuel < 20
              ? ("negative" as const)
              : ("positive" as const),
          icon: "⛽",
        },
        {
          label: "Temperatura Promedio",
          value: `${stats.averageTemperature}°C`,
          change: stats.averageTemperature > 80 ? "Alta" : "Normal",
          changeType:
            stats.averageTemperature > 80
              ? ("negative" as const)
              : ("positive" as const),
          icon: "🌡️",
        },
      ];
    } else {
      return [
        {
          label: "Vehículos Activos",
          value: stats.totalVehicles.toString(),
          change: "+2",
          changeType: "positive" as const,
          icon: "🚗",
        },
        {
          label: "Alertas Activas",
          value: "🛡️",
          change: stats.totalAlerts > 0 ? `+${stats.totalAlerts}` : "0",
          changeType:
            stats.totalAlerts > 0
              ? ("negative" as const)
              : ("positive" as const),
          icon: "⚠️",
        },
        {
          label: "Combustible Promedio",
          value: "🛡️",
          change: stats.averageFuel < 20 ? "Bajo" : "Normal",
          changeType:
            stats.averageFuel < 20
              ? ("negative" as const)
              : ("positive" as const),
          icon: "⛽",
        },
        {
          label: "Temperatura Promedio",
          value: "🛡️",
          change: stats.averageTemperature > 80 ? "Alta" : "Normal",
          changeType:
            stats.averageTemperature > 80
              ? ("negative" as const)
              : ("positive" as const),
          icon: "🌡️",
        },
      ];
    }
  }, [stats]);

  return {
    stats: summaryStats,
    isLoading,
    isError,
    rawStats: stats,
    refetchStats: () => {
      refetchVehicles();
      refetchAlerts();
    },
  };
};

// Hook para obtener vehículos con alertas
export const useVehiclesWithAlerts = () => {
  const { vehicles, alerts } = useStats();

  const vehiclesWithAlerts = React.useMemo(() => {
    const alertVehicleIds = new Set(alerts.map((alert) => alert.id));
    return vehicles.filter((vehicle) => alertVehicleIds.has(vehicle.id));
  }, [vehicles, alerts]);

  return vehiclesWithAlerts;
};

// Hook para obtener tipos de alertas
export const useAlertTypes = () => {
  const { alerts } = useStats();

  const alertTypes = React.useMemo(() => {
    return alerts.reduce((acc, alert) => {
      const tipo = alert.tipo_alerta;
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }, [alerts]);

  return alertTypes;
};
