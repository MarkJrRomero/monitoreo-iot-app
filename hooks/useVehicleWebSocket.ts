import { useCallback, useEffect, useRef, useState } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { buildWebSocketUrl } from '../config/websocket';
import { type Vehicle } from '../models/stats';
import type { VehicleAlert, WebSocketMessage } from '../models/vehiclel';
import { useAuth } from './useAuth';

export const useVehicleWebSocket = (vehicles: Vehicle[], onAlert: (alert: VehicleAlert) => void) => {
  const { token } = useAuth();
  const [vehicleData, setVehicleData] = useState<Record<string, Vehicle>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wsRef = useRef<ReconnectingWebSocket | null>(null);
  const subscribedVehiclesRef = useRef<Set<string>>(new Set());
  const vehiclesRef = useRef<Vehicle[]>([]);
  const onAlertRef = useRef(onAlert);
  const hasSubscribedRef = useRef(false);
  const isConnectingRef = useRef(false);
  const connectionAttemptsRef = useRef(0);
  const maxConnectionAttempts = 3;
  const shouldReconnectRef = useRef(true); // Flag para controlar reconexiones

  // Actualizar la referencia de onAlert cuando cambie
  useEffect(() => {
    onAlertRef.current = onAlert;
  }, [onAlert]);

  useEffect(() => {
    vehiclesRef.current = vehicles;
  }, [vehicles]);

  const connect = useCallback(async () => {
    if (!token) {
      console.log('No hay token disponible para WebSocket');
      return;
    }

    // Evitar múltiples intentos de conexión
    if (isConnectingRef.current) {
      console.log('Ya se está intentando conectar...');
      return;
    }

    // Si ya está conectado, no intentar conectar de nuevo
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket ya está conectado');
      setIsConnected(true);
      setIsLoading(false);
      return;
    }

    // Si ya se intentó conectar demasiadas veces, parar
    if (connectionAttemptsRef.current >= maxConnectionAttempts) {
      console.log('Máximo número de intentos de conexión alcanzado');
      setIsLoading(false);
      return;
    }

    // Verificar si ya hay una conexión en proceso
    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket ya está en proceso de conexión');
      return;
    }

    isConnectingRef.current = true;
    setIsLoading(true);
    connectionAttemptsRef.current++;

    console.log(`Intento de conexión ${connectionAttemptsRef.current}/${maxConnectionAttempts}`);

    // Habilitar reconexiones automáticas
    shouldReconnectRef.current = true;

    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsUrl = buildWebSocketUrl(token);
    
    const ws = new ReconnectingWebSocket(wsUrl, [], {
      maxRetries: 1, // Reducir a 1 intento
      maxReconnectionDelay: 2000,
      minReconnectionDelay: 1000,
      reconnectionDelayGrowFactor: 1.0, // Sin crecimiento exponencial
      maxEnqueuedMessages: 10,
      startClosed: false,
      debug: false,
    });

    wsRef.current = ws;

    ws.onopen = function() {
      console.log('WebSocket conectado exitosamente');
      setIsConnected(true);
      setIsLoading(false);
      isConnectingRef.current = false;
      hasSubscribedRef.current = false;
      connectionAttemptsRef.current = 0; // Resetear contador de intentos
    };

    ws.onmessage = function(event) {
      try {
        const data = JSON.parse(event.data) as WebSocketMessage;
        console.log('Mensaje recibido:', data);
        if (data.type === 'sensor_data' && data.vehicleId && data.data) {
          const vehicleData = data.data;

          setVehicleData(prev => ({
            ...prev,
            [String(data.vehicleId)]: vehicleData
          }));

          if (onAlertRef.current) onAlertRef.current(data as VehicleAlert);
        }

        if (data.type === 'alert') {
          if (onAlertRef.current) onAlertRef.current(data as VehicleAlert);
        }

      } catch (error) {
        console.error('Error parsing message', error);
      }
    };

    ws.onclose = function(event) {
      console.log('WebSocket cerrado:', event.code, event.reason);
      setIsConnected(false);
      isConnectingRef.current = false;
      
      // Solo intentar reconectar si está habilitado y no hemos alcanzado el máximo
      if (shouldReconnectRef.current && event.code !== 1000 && connectionAttemptsRef.current < maxConnectionAttempts) {
        console.log('Conexión cerrada inesperadamente, intentando reconectar...');
      } else {
        console.log('No se intentará reconectar automáticamente');
        shouldReconnectRef.current = false;
      }
    };

    ws.onerror = function(error) {
      console.log('WebSocket error:', error);
      setIsConnected(false);
      isConnectingRef.current = false;
    };

    ws.addEventListener('open', () => {
      console.log('WebSocket conectado (event listener)');
      setIsConnected(true);
      setIsLoading(false);
      isConnectingRef.current = false;
      hasSubscribedRef.current = false;
      connectionAttemptsRef.current = 0;
    });

    ws.addEventListener('close', () => {
      console.log('WebSocket cerrado (event listener)');
      setIsConnected(false);
      isConnectingRef.current = false;
    });

    (ws as any).addEventListener('connecting', () => {
      console.log('WebSocket conectando...');
      setIsLoading(true);
      isConnectingRef.current = true;
    });

    (ws as any).addEventListener('reconnect', (event: any) => {
      console.log('WebSocket reconectado');
      setIsConnected(true);
      setIsLoading(false);
      isConnectingRef.current = false;
      hasSubscribedRef.current = false;
      connectionAttemptsRef.current = 0;
    });

  }, [token]);

  const disconnect = useCallback(() => {
    console.log('Desconectando WebSocket');
    
    // Deshabilitar reconexiones automáticas
    shouldReconnectRef.current = false;
    
    if (wsRef.current) {
      subscribedVehiclesRef.current.forEach(vehicleCode => {
        const message = { type: 'unsubscribe', vehicleId: vehicleCode };
        wsRef.current?.send(JSON.stringify(message));
      });

      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsLoading(false);
    isConnectingRef.current = false;
    subscribedVehiclesRef.current.clear();
    hasSubscribedRef.current = false;
    connectionAttemptsRef.current = 0;
  }, []);

  const subscribeToNewVehicles = useCallback(() => {
    if (!isConnected || !wsRef.current || hasSubscribedRef.current) {
      return;
    }

    const currentVehicles = vehiclesRef.current;
    console.log('Suscribiendo a vehículos:', currentVehicles.length);

    currentVehicles.forEach(vehicle => {
      const vehicleCode = vehicle.dispositivo_id;
      if (!subscribedVehiclesRef.current.has(vehicleCode)) {
        const message = { type: 'subscribe', vehicleId: vehicleCode };
        wsRef.current?.send(JSON.stringify(message));
        subscribedVehiclesRef.current.add(vehicleCode);
        console.log('Suscrito a vehículo:', vehicleCode);
      }
    });

    hasSubscribedRef.current = true;
  }, [isConnected]);

  // Función para verificar si la conexión está activa
  const isConnectionActive = useCallback(() => {
    return wsRef.current?.readyState === WebSocket.OPEN;
  }, []);

  // Función para forzar reconexión solo si es necesario
  const forceReconnect = useCallback(() => {
    if (isConnectionActive()) {
      console.log('Conexión ya está activa, no es necesario reconectar');
      return;
    }

    console.log('Forzando reconexión...');
    connectionAttemptsRef.current = 0; // Resetear contador
    connect();
  }, [connect, isConnectionActive]);

  // Conectar solo cuando hay token y no está conectado
  useEffect(() => {
    if (token && !isConnectingRef.current && connectionAttemptsRef.current < maxConnectionAttempts) {
      // Solo conectar si no hay una conexión activa
      if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
        connect();
      }
    }

    return () => {
      disconnect();
    };
  }, [token]); // Removido isConnected de las dependencias

  // Suscribir a vehículos cuando esté conectado
  useEffect(() => {
    if (isConnected && vehicles.length > 0 && !hasSubscribedRef.current) {
      const timer = setTimeout(() => {
        subscribeToNewVehicles();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, vehicles.length, subscribeToNewVehicles]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    vehicleData,
    isConnected,
    connect,
    disconnect,
    forceReconnect,
    isConnectionActive,
    subscribedVehicles: Array.from(subscribedVehiclesRef.current),
    isLoading,
  };
};
