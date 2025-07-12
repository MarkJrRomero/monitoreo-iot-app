import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import { LiveMapCard } from '@/components/LiveMapCard';
import { ThemedText } from '@/components/ThemedText';
import { WelcomeCard } from '@/components/WelcomeCard';
import { useStats } from '@/hooks/useStats';
import { useVehicleWebSocket } from '@/hooks/useVehicleWebSocket';

export default function HomeScreen() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Obtener funciones de actualización de los hooks
  const { refetchVehicles, refetchAlerts } = useStats();
  const { isConnected, isLoading, forceReconnect } = useVehicleWebSocket([], () => {});

  // Función para manejar el pull-to-refresh de toda la página
  const handleRefresh = useCallback(async () => {
    console.log('🔄 Iniciando actualización completa de la página...');
    setIsRefreshing(true);
    
    try {
      // Actualizar todas las estadísticas
      console.log('📊 Actualizando estadísticas de la página...');
      await Promise.all([
        refetchVehicles(),
        refetchAlerts()
      ]);
      
      // Forzar reconexión del WebSocket
      console.log('🔄 Forzando reconexión del WebSocket desde página principal...');
      forceReconnect();
      
      console.log('✅ Actualización completa de la página completada');
    } catch (error) {
      console.error('❌ Error durante la actualización de la página:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [forceReconnect, refetchVehicles, refetchAlerts]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={['#007AFF']}
          tintColor="#007AFF"
          title="Actualizando página..."
          titleColor="#007AFF"
        />
      }
    >
      {/* Header con título */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Monitoreo IoT
        </ThemedText>
        <HelloWave />
      </View>
      
      {/* Tarjeta de bienvenida */}
      <WelcomeCard />
      
      {/* Tarjeta del mapa en tiempo real */}
      <LiveMapCard />
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
}); 