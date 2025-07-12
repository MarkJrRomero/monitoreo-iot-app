import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';

interface WelcomeCardProps {
  style?: any;
}

export const WelcomeCard: React.FC<WelcomeCardProps> = ({ style }) => {
  const { usuario } = useAuthContext();

  const getUserName = () => {
    if (!usuario) return 'Usuario';
    return `${usuario.nombre}`;
  };

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.name}>¡Hola, {getUserName()}!</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.welcomeText}>
          Bienvenido al sistema de Monitoreo IoT
        </Text>
        <Text style={styles.subtitle}>
          Aquí podrás monitorear tus dispositivos y vehículos en tiempo real
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 200,
  },
  header: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
}); 