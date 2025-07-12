export interface Vehicle {
    id: number;
    nombre: string;
    dispositivo_id: string;
    usuario_id: number;
    latitud: string;
    longitud: string;
    estado: string;
    ultima_actualizacion: string;
    combustible: string;
    temperatura: string;
    velocidad: string;
  }
  
  export interface VehicleAlertDashboard extends Vehicle {
    tipo_alerta: string;
  }
  
  export interface ApiResponse<T> {
    ok: boolean;
    data: T[];
  }
  
  export interface Stats {
    totalVehicles: number;
    totalAlerts: number;
    vehiclesWithAlerts: number;
    averageFuel: number;
    averageTemperature: number;
    averageSpeed: number;
    alertTypes: {
      [key: string]: number;
    };
  }
  