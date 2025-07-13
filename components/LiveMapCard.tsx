import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useAuthContext } from '../contexts/AuthContext';
import { useStats } from '../hooks/useStats';
import { useVehicleWebSocket } from '../hooks/useVehicleWebSocket';
import { Vehicle } from '../models/stats';
import { VehicleAlert } from '../models/vehiclel';

interface LiveMapCardProps {
  onAlert?: (alert: VehicleAlert) => void;
}

// Función para enmascarar el dispositivo_id según el rol
const maskDeviceId = (deviceId: string, userRole: string): string => {
  if (userRole === 'admin') {
    return deviceId;
  }
  
  // Enmascarar el dispositivo_id para usuarios no admin
  if (!deviceId || deviceId.length < 8) {
    return deviceId;
  }
  
  const prefix = deviceId.substring(0, 4);
  const suffix = deviceId.substring(deviceId.length - 4);
  return `${prefix}-****-${suffix}`;
};

// Componente memoizado para los marcadores
const VehicleMarker = React.memo<{
  marker: {
    id: string;
    coordinate: { latitude: number; longitude: number };
    title: string;
    description: string;
    pinColor: string;
    vehicle: Vehicle;
  };
  isSelected: boolean;
  onMarkerPress: (id: string) => void;
}>(({ marker, isSelected, onMarkerPress }) => {
  console.log('Renderizando marcador:', marker.id, 'Estado:', marker.vehicle.estado);

  return (
    <Marker
      key={marker.id}
      coordinate={marker.coordinate}
      pinColor={isSelected ? '#FF5722' : marker.pinColor}
      title={marker.vehicle.nombre || 'Vehículo'}
      description={`Estado: ${marker.vehicle.estado}`}
      onPress={() => {
        console.log('Marcador presionado:', marker.id, marker.vehicle.nombre);
        onMarkerPress(marker.id);
      }}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 1.0 }}
    />
  );
});

VehicleMarker.displayName = 'VehicleMarker';

const LiveMapCardComponent: React.FC<LiveMapCardProps> = ({ onAlert }) => {
  const { usuario } = useAuthContext();
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  const {
    vehicles: initialVehicles,
    alerts: initialAlerts,
    isLoading: statsLoading,
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

  const { 
    vehicleData: wsVehicleData, 
    isConnected, 
    isLoading: wsLoading,
    forceReconnect,
  } = useVehicleWebSocket(initialVehicles, (alert) => {
    if (onAlert) onAlert(alert);
    debouncedRefetchStats();
  });

  // Memoizar los vehículos para evitar re-renders innecesarios
  const allVehicles = useMemo(() => {
    const initialVehiclesMap = initialVehicles.reduce((acc, vehicle) => {
      acc[vehicle.dispositivo_id] = vehicle;
      return acc;
    }, {} as Record<string, Vehicle>);
    
    return { ...initialVehiclesMap, ...wsVehicleData };
  }, [initialVehicles, wsVehicleData]);

  // Memoizar vehículos con coordenadas válidas
  const vehiclesWithCoordinates = useMemo(() => 
    Object.values(allVehicles).filter(vehicle => 
      vehicle.latitud && vehicle.longitud && 
      !isNaN(parseFloat(vehicle.latitud)) && 
      !isNaN(parseFloat(vehicle.longitud))
    ), [allVehicles]);

  const getStatusColor = useCallback((status: string) => {
    console.log('Estado:', status);
    
    // Si hay múltiples estados separados por |
    if (status?.includes('|')) {
      const states = status.split('|').map(s => s.trim().toLowerCase());
      console.log('Estados múltiples:', states);
      
      // Priorizar colores según la severidad
      if (states.includes('temperatura')) return '#F44336'; // Rojo para temperatura
      if (states.includes('combustible')) return '#2196F3'; // Azul para combustible normal
      if (states.includes('velocidad')) return '#9C27B0'; // Púrpura para velocidad normal
      
      return '#4B4B4BFF'; // Gris por defecto
    }
    
    // Estado único
    switch (status?.toLowerCase()) {
      case 'temperatura':
        return '#4CAF50';
      case 'combustible':
        return '#F44336';
      case 'velocidad':
        return '#FF9800';
      case 'alerta de temperatura':
        return '#F44336';
      case 'alerta de combustible':
        return '#FF9800';
      case 'alerta de exceso de velocidad':
        return '#FFC107';
      default:
        return '#4B4B4BFF';
    }
  }, []);

  // Memoizar marcadores para evitar re-renders innecesarios
  const mapMarkers = useMemo(() => {
    const markers = vehiclesWithCoordinates.map((vehicle) => ({
      id: vehicle.dispositivo_id,
      coordinate: {
        latitude: parseFloat(vehicle.latitud),
        longitude: parseFloat(vehicle.longitud),
      },
      title: vehicle.nombre,
      description: `Estado: ${vehicle.estado} | Velocidad: ${vehicle.velocidad} km/h`,
      pinColor: getStatusColor(vehicle.estado),
      vehicle
    }));
    
    console.log('Marcadores generados:', markers.length, markers.map(m => ({ id: m.id, estado: m.vehicle.estado })));
    return markers;
  }, [vehiclesWithCoordinates, getStatusColor]);

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

  const getAlertColor = useCallback((severity: string) => {
    // Si hay múltiples alertas separadas por |
    if (severity?.includes('|')) {
      const alerts = severity.split('|').map(s => s.trim().toLowerCase());
      console.log('Alertas múltiples:', alerts);
      
      // Priorizar colores según la severidad
      if (alerts.includes('alerta de temperatura')) return '#F44336'; // Rojo para temperatura
      if (alerts.includes('alerta de combustible')) return '#FF9800'; // Naranja para combustible
      if (alerts.includes('alerta de exceso de velocidad')) return '#FFC107'; // Amarillo para velocidad
      
      return '#4B4B4BFF'; // Gris por defecto
    }
    
    // Alerta única
    switch (severity?.toLowerCase()) {
      case 'alerta de temperatura':
        return '#F44336';
      case 'alerta de combustible':
        return '#FF9800';
      case 'alerta de exceso de velocidad':
        return '#FFC107';
      default:
        return '#4B4B4BFF';
    }
  }, []);

  // Función para centrar el mapa en todos los vehículos (solo una vez)
  const fitMapToVehicles = useCallback(() => {
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
  }, [vehiclesWithCoordinates]);

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

  // Solo centrar el mapa una vez cuando se cargan los vehículos inicialmente
  useEffect(() => {
    if (vehiclesWithCoordinates.length > 0 && mapRef.current) {
      // Solo centrar si es la primera carga
      const timer = setTimeout(() => {
        fitMapToVehicles();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []); // Sin dependencias para que solo se ejecute una vez

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

  const isLoading = statsLoading || wsLoading;

  const handleMarkerPress = useCallback((markerId: string) => {
    console.log('Marcador seleccionado:', markerId);
    setSelectedMarker(markerId);
  }, []);

  const handleMapPress = useCallback(() => {
    setSelectedMarker(null);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mapa Vehículos</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4CAF50' : isLoading ? '#FF9800' : '#F44336' }]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Conectado' : isLoading ? 'Conectando...' : 'Desconectado'}
          </Text>
        </View>
        <TouchableOpacity style={styles.reconnectButton} onPress={forceReconnect}>
          <Ionicons name="refresh" size={15} color="white" />
        </TouchableOpacity>
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
          onPress={handleMapPress}
          // Configuraciones para evitar movimientos automáticos
          followsUserLocation={false}
          moveOnMarkerPress={true}
          showsCompass={true}
          showsScale={true}
          showsBuildings={false}
          showsTraffic={false}
          showsIndoors={false}
          showsPointsOfInterest={false}
        >
          {mapMarkers.map((marker) => (
            <VehicleMarker 
              key={marker.id} 
              marker={marker} 
              isSelected={selectedMarker === marker.id}
              onMarkerPress={handleMarkerPress}
            />
          ))}
        </MapView>
      </View>

      {/* Panel de información del vehículo seleccionado */}
      {selectedMarker && (() => {
        const selectedVehicle = allVehicles[selectedMarker];
        if (!selectedVehicle) return null;

        const formatStatus = (status: string) => {
          if (!status) return 'Sin estado';
          if (status?.includes('|')) {
            return status.split('|').map(s => s.trim()).join('\n• ');
          }
          return status;
        };

        return (
          <View style={styles.vehicleInfoPanel}>
            <View style={styles.vehicleInfoHeader}>
              <Text style={styles.vehicleInfoTitle}>{selectedVehicle.nombre || 'Vehículo'}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setSelectedMarker(null)}
              >
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.vehicleInfoContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ID: {maskDeviceId(selectedVehicle.dispositivo_id, usuario?.rol || 'user')}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Estado: {formatStatus(selectedVehicle.estado)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Velocidad: {selectedVehicle.velocidad || '0'} km/h</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Temperatura: {selectedVehicle.temperatura || '0'}°C</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Combustible: {selectedVehicle.combustible || '0'}%</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ubicación: {parseFloat(selectedVehicle.latitud || '0').toFixed(4)}, {parseFloat(selectedVehicle.longitud || '0').toFixed(4)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Última actualización: {new Date(selectedVehicle.ultima_actualizacion || Date.now()).toLocaleString()}</Text>
              </View>
            </View>
          </View>
        );
      })()}

      {/* Panel de alertas */}
      {initialAlerts.length > 0 && (
        <View style={styles.alertsPanel}>
          <Text style={styles.alertsTitle}>Alertas Activas ({initialAlerts.length})</Text>
          {initialAlerts.slice(0, 3).map((alert, index) => {
            // Función para formatear el tipo de alerta
            const formatAlertType = (alertType: string) => {
              if (alertType?.includes('|')) {
                return alertType.split('|').map(s => s.trim()).join('\n• ');
              }
              return alertType;
            };

            return (
              <View key={index} style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <View style={[styles.alertDot, { backgroundColor: getAlertColor(alert.tipo_alerta) }]} />
                  <Text style={styles.alertTitle}>{formatAlertType(alert.tipo_alerta).toUpperCase()}</Text>
                </View>
                <Text style={styles.alertDescription}>{alert.nombre} - {maskDeviceId(alert.dispositivo_id, usuario?.rol || 'user')}</Text>
                <Text style={styles.alertTime}>
                  {new Date(alert.ultima_actualizacion).toLocaleString()}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

export const LiveMapCard = React.memo(LiveMapCardComponent);

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
  reconnectButtonContainer: {
    marginLeft: 10, 
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
  alertDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  alertDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  reconnectButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 4,
  },
  reconnectButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  vehicleInfoPanel: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  vehicleInfoContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
}); 