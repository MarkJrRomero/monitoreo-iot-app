import React from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';

export const AuthStatus = () => {
  const { isAuthenticated, usuario, isLoading } = useAuthContext();

  if (!__DEV__) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estado de Autenticación (Dev)</Text>
      <Text style={styles.status}>
        Autenticado: {isAuthenticated ? 'Sí' : 'No'}
      </Text>
      <Text style={styles.status}>
        Loading: {isLoading ? 'Sí' : 'No'}
      </Text>
      {usuario && (
        <Text style={styles.status}>
          Usuario: {usuario.nombre} ({usuario.correo})
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  status: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
}); 