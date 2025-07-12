import type { Vehicle } from "./stats";
export interface WebSocketMessage {
    type: string;
    vehicleId?: string;
    data?: Vehicle;
    timestamp: string;
  }
  
  export interface VehicleLocation {
    id: number;
    nombre: string;
    dispositivo_id: string;
    latitud: string;
    longitud: string;
    estado: string;
    ultima_actualizacion: string;
    combustible: string;
    temperatura: string;
    velocidad: string;
  }

  export interface VehicleAlert {
    type: string;
    vehicleId: string;
    alert: {
      tipo: string;
      datos: {
        vehiculo_id: number;
        dispositivo_id: string;
        nombre: string;
        gps: string;
        combustible: number;
        temperatura: number;
        velocidad: number;
        latitud: number;
        longitud: number;
        estado: string;
        timestamp: string;
      };
      timestamp: string;
    };
    timestamp: string;
  }