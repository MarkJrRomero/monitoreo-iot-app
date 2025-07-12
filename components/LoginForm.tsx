import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoginLoading, loginError } = useAuthContext();


  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      await login({ correo: email, password: password });
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      
      let errorMessage = 'Credenciales incorrectas';
      
      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          errorMessage = 'Error de conexión. Verifica tu conexión a internet o que el servidor esté disponible.';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'No se pudo conectar con el servidor. Verifica la configuración de la API.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      {loginError && (
        <Text style={styles.errorText}>
          {loginError.message || 'Error al iniciar sesión'}
        </Text>
      )}
      
      <TouchableOpacity
        style={[styles.button, isLoginLoading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isLoginLoading}
      >
        {isLoginLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 10,
  },
  debugText: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
}); 