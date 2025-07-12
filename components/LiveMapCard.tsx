import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';
import { useAuth } from '../hooks/useAuth';
import { useStats } from '../hooks/useStats';
import { useVehicleWebSocket } from '../hooks/useVehicleWebSocket';
import { Vehicle } from '../models/stats';
import { VehicleAlert } from '../models/vehiclel';

interface LiveMapCardProps {
  onAlert?: (alert: VehicleAlert) => void;
}

const { width, height } = Dimensions.get('window');

export const LiveMapCard: React.FC<LiveMapCardProps> = ({ onAlert }) => {
  const { token } = useAuth();
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const mapRef = useRef<MapView>(null);
  const lastAlertTimeRef = useRef<number>(0);

  const {
    vehicles: initialVehicles,
    alerts: initialAlerts,
    isLoading,
    refetchVehicles,
    refetchAlerts
  } = useStats();

  const refetchStats = useCallback(() => {
    refetchVehicles();
    refetchAlerts();
  }, [refetchVehicles, refetchAlerts]);

  const debouncedRefetchStats = useCallback(() => {
    refetchStats();
  }, [refetchStats]);

  const { vehicleData: wsVehicleData, isConnected } = useVehicleWebSocket(initialVehicles, (alert) => {
    if (onAlert) onAlert(alert);
    debouncedRefetchStats();
  });

  useEffect(() => {
    const getLocationPermission = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status === 'granted');
        
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          setUserLocation(location);
          console.log('Ubicación del usuario obtenida:', location.coords);
        } else {
          console.log('Permisos de ubicación denegados');
        }
      } catch (error) {
        console.error('Error obteniendo ubicación:', error);
      }
    };

    getLocationPermission();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'activo':
        return '#4CAF50';
      case 'inactivo':
        return '#F44336';
      case 'mantenimiento':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'alerta de temperatura':
        return '#F44336';
      case 'alerta de combustible':
        return '#FF9800';
      case 'alerta de exceso de velocidad':
        return '#FFC107';
      default:
        return '#9E9E9E';
    }
  };

  // Combinar datos iniciales con datos del WebSocket usando useMemo para evitar re-renders
  const allVehicles = React.useMemo(() => {
    const initialVehiclesMap = initialVehicles.reduce((acc, vehicle) => {
      acc[vehicle.dispositivo_id] = vehicle;
      return acc;
    }, {} as Record<string, Vehicle>);
    
    return { ...initialVehiclesMap, ...wsVehicleData };
  }, [initialVehicles, wsVehicleData]);

  // Función para centrar el mapa en todos los vehículos
  const fitMapToVehicles = useCallback(() => {
    const vehiclesWithCoordinates = Object.values(allVehicles).filter(vehicle =>
      vehicle.latitud && vehicle.longitud &&
      !isNaN(parseFloat(vehicle.latitud)) &&
      !isNaN(parseFloat(vehicle.longitud))
    );

    if (vehiclesWithCoordinates.length > 0) {
      const coordinates = vehiclesWithCoordinates.map(vehicle => ({
        latitude: parseFloat(vehicle.latitud),
        longitude: parseFloat(vehicle.longitud),
      }));

      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [allVehicles]);

  // Función para centrar el mapa en la ubicación del usuario
  const centerOnUserLocation = useCallback(() => {
    if (userLocation) {
      mapRef.current?.animateToRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [userLocation]);

  const vehiclesWithCoordinates = React.useMemo(() => 
    Object.values(allVehicles).filter(vehicle => 
      vehicle.latitud && vehicle.longitud && 
      !isNaN(parseFloat(vehicle.latitud)) && 
      !isNaN(parseFloat(vehicle.longitud))
    ), [allVehicles]);

  useEffect(() => {
    if (Object.keys(allVehicles).length > 0) {
      fitMapToVehicles();
    }
  }, [allVehicles, fitMapToVehicles]);

  if (!token) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Mapa en Tiempo Real</Text>
        <Text style={styles.errorText}>Debes hacer login para ver el mapa</Text>
      </View>
    );
  }

  const initialRegion = userLocation ? {
    latitude: userLocation.coords.latitude,
    longitude: userLocation.coords.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : {
    latitude: 10.9685, // Barranquilla, Colombia
    longitude: -74.7813,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mapa en Tiempo Real</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4CAF50' : isLoading ? '#FF9800' : '#F44336' }]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Conectado' : isLoading ? 'Conectando...' : 'Desconectado'}
          </Text>
        </View>
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{vehiclesWithCoordinates.length}</Text>
          <Text style={styles.statLabel}>Vehículos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{initialAlerts.length}</Text>
          <Text style={styles.statLabel}>Alertas activas</Text>
        </View>
      </View>

      {/* Mapa */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={locationPermission}
          showsMyLocationButton={locationPermission}
          onMapReady={() => {
            if (userLocation) {
              centerOnUserLocation();
            }
          }}
        >
          {vehiclesWithCoordinates.map((vehicle) => (
            <Marker
              key={vehicle.dispositivo_id}
              coordinate={{
                latitude: parseFloat(vehicle.latitud),
                longitude: parseFloat(vehicle.longitud),
              }}
              pinColor={getStatusColor(vehicle.estado)}
              title={vehicle.nombre}
              description={`Estado: ${vehicle.estado} | Velocidad: ${vehicle.velocidad} km/h`}
            >
              <Callout>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>{vehicle.nombre}</Text>
                  <Text style={styles.calloutText}>Estado: {vehicle.estado}</Text>
                  <Text style={styles.calloutText}>Velocidad: {vehicle.velocidad} km/h</Text>
                  <Text style={styles.calloutText}>Temperatura: {vehicle.temperatura}°C</Text>
                  <Text style={styles.calloutText}>Combustible: {vehicle.combustible}%</Text>
                  <Text style={styles.calloutText}>
                    Lat: {parseFloat(vehicle.latitud).toFixed(4)}
                  </Text>
                  <Text style={styles.calloutText}>
                    Lng: {parseFloat(vehicle.longitud).toFixed(4)}
                  </Text>
                  <Text style={styles.calloutText}>
                    Última actualización: {new Date(vehicle.ultima_actualizacion).toLocaleString()}
                  </Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      </View>

      {/* Panel de alertas */}
      {initialAlerts.length > 0 && (
        <View style={styles.alertsPanel}>
          <Text style={styles.alertsTitle}>Alertas Activas ({initialAlerts.length})</Text>
          {initialAlerts.slice(0, 3).map((alert, index) => (
            <View key={index} style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <Text style={styles.alertTitle}>{alert.dispositivo_id}</Text>
                <View style={[styles.severityBadge, { backgroundColor: getAlertColor(alert.tipo_alerta) }]}>
                  <Text style={styles.severityText}>{alert.tipo_alerta.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.alertMessage}>{alert.nombre}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  mapContainer: {
    height: 400,
    width: '100%',
  },
  map: {
    flex: 1,
  },
  calloutContainer: {
    width: 250,
    padding: 12,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  calloutText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  alertsPanel: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  alertCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  alertMessage: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  alertTime: {
    fontSize: 10,
    color: '#999',
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
    padding: 20,
  },
}); 