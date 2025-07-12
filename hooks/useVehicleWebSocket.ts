import { useCallback, useEffect, useRef, useState } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { buildWebSocketUrl } from '../config/websocket';
import { type Vehicle } from '../models/stats';
import type { VehicleAlert, WebSocketMessage } from '../models/vehiclel';
import { useAuth } from './useAuth';


export const useVehicleWebSocket = (vehicles: Vehicle[], onAlert: (alert: VehicleAlert) => void) => {
  const { token, logout } = useAuth();
  const [vehicleData, setVehicleData] = useState<Record<string, Vehicle>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wsRef = useRef<ReconnectingWebSocket | null>(null);
  const subscribedVehiclesRef = useRef<Set<string>>(new Set());
  const vehiclesRef = useRef<Vehicle[]>([]);
  const onAlertRef = useRef(onAlert);
  const hasSubscribedRef = useRef(false);

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
      await logout();
      return;
    }

    setIsLoading(true);

    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsUrl = buildWebSocketUrl(token);
    
    const ws = new ReconnectingWebSocket(wsUrl, [], {
      maxRetries: 10,
      maxReconnectionDelay: 10000,
      minReconnectionDelay: 1000,
      reconnectionDelayGrowFactor: 1.3,
      maxEnqueuedMessages: 100,
      startClosed: false,
      debug: __DEV__,
    });

    wsRef.current = ws;

    ws.onopen = function() {
      setIsConnected(true);
      setIsLoading(false);
      hasSubscribedRef.current = false;
    };

    ws.onmessage = function(event) {
      try {
        const data = JSON.parse(event.data) as WebSocketMessage;

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
      setIsConnected(false);
    };

    ws.onerror = function() {
      setIsConnected(false);
    };

    
    ws.addEventListener('open', () => {
      setIsConnected(true);
      setIsLoading(false);
      hasSubscribedRef.current = false;
    });

    ws.addEventListener('close', () => {
      setIsConnected(false);
    });

    (ws as any).addEventListener('connecting', () => {
      setIsLoading(true);
    });

    (ws as any).addEventListener('reconnect', (event: any) => {
      setIsConnected(true);
      setIsLoading(false);
      hasSubscribedRef.current = false;
    });

  }, [token, logout]);

  const disconnect = useCallback(() => {

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
    subscribedVehiclesRef.current.clear();
    hasSubscribedRef.current = false;
  }, []);

  const subscribeToNewVehicles = useCallback(() => {
    if (!isConnected || !wsRef.current) {
      return;
    }

    if (hasSubscribedRef.current) {
      return;
    }

    const currentVehicles = vehiclesRef.current;


    currentVehicles.forEach(vehicle => {
      const vehicleCode = vehicle.dispositivo_id;
      if (!subscribedVehiclesRef.current.has(vehicleCode)) {
        const message = { type: 'subscribe', vehicleId: vehicleCode };
        wsRef.current?.send(JSON.stringify(message));
        subscribedVehiclesRef.current.add(vehicleCode);
      }
    });

    hasSubscribedRef.current = true;
  }, [isConnected]);

  useEffect(() => {
    if (token) {

      connect();
    }

    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);

  useEffect(() => {
    if (isConnected && vehicles.length > 0 && !hasSubscribedRef.current) {
      const timer = setTimeout(() => {
        subscribeToNewVehicles();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, vehicles.length, subscribeToNewVehicles]);

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
    subscribedVehicles: Array.from(subscribedVehiclesRef.current),
    isLoading,
  };
};
