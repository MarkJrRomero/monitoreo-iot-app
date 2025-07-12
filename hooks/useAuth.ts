import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { getApiUrl } from '../config/api';
import { type AuthState, type LoginCredentials, type LoginResponse, type Usuario } from '../models/auth';

const AUTH_STORAGE_KEY = 'auth_data';

// Función para obtener datos de auth del AsyncStorage
const getStoredAuth = async (): Promise<AuthState> => {
  try {
    const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const { usuario, token } = JSON.parse(stored);
      return {
        usuario,
        token,
        isAuthenticated: !!token && !!usuario,
      };
    }
  } catch (error) {
    console.error('Error al leer datos de autenticación:', error);
  }
  
  return {
    usuario: null,
    token: null,
    isAuthenticated: false,
  };
};

// Función para guardar datos de auth en AsyncStorage
const setStoredAuth = async (usuario: Usuario, token: string) => {
  try {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ usuario, token }));
  } catch (error) {
    console.error('Error al guardar datos de autenticación:', error);
  }
};

// Función para limpiar datos de auth del AsyncStorage
const clearStoredAuth = async () => {
  try {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error('Error al limpiar datos de autenticación:', error);
  }
};

// Función para hacer la petición de login
const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  // Simular login para pruebas
  if (credentials.correo === 'demo@example.com' && credentials.password === 'password') {
    console.log('Usando credenciales de demo');
    const mockUser = {
      id: 1,
      correo: credentials.correo,
      nombre: 'Usuario',
      rol: 'admin',
      createdAt: new Date().toISOString(),
    };
    
    return {
      usuario: mockUser,
      token: 'mock-token-123',
      message: 'Login exitoso',
    };
  }
  
  // Si no son las credenciales de prueba, intentar con la API real
  const apiUrl = getApiUrl('/api/login');
  console.log('Intentando login con API:', apiUrl);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log('Respuesta del servidor:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error del servidor:', errorData);
      throw new Error(errorData.error || `Error del servidor: ${response.status}`);
    }

    const data = await response.json();
    console.log('Login exitoso:', data);
    return data;
  } catch (error) {
    console.error('Error en petición de login:', error);
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      throw new Error('Error de conexión: No se pudo conectar con el servidor. Verifica que la API esté disponible en ' + apiUrl);
    }
    throw error;
  }
};

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    usuario: null,
    token: null,
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedAuth = await getStoredAuth();
        setAuthState(storedAuth);
      } catch (error) {
        console.error('Error al cargar datos de autenticación:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuthData();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await loginUser(credentials);
      const { usuario, token } = response;
      
      await setStoredAuth(usuario, token);
      
      setAuthState({
        usuario,
        token,
        isAuthenticated: true,
      });
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log('Iniciando logout...');
    setIsLoading(true);
    try {
      await clearStoredAuth();
      console.log('AsyncStorage limpiado');
      
      setAuthState({
        usuario: null,
        token: null,
        isAuthenticated: false,
      });
      console.log('Estado de autenticación actualizado');
    } catch (error) {
      console.error('Error en logout:', error);
      setAuthState({
        usuario: null,
        token: null,
        isAuthenticated: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAuthHeaders = () => {
    if (!authState.token) return {};
    
    return {
      'Authorization': `Bearer ${authState.token}`,
      'Content-Type': 'application/json',
    };
  };

  return {
    // Estado
    usuario: authState.usuario,
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    isLoading,
    error,
    
    // Acciones
    login,
    logout,
    getAuthHeaders,
    
    // Estado del login
    isLoginLoading: isLoading,
    loginError: error,
  };
};

// Hook para verificar si el usuario está autenticado al cargar la app
export const useAuthCheck = () => {
  const [isChecking, setIsChecking] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  return { isChecking, isAuthenticated };
};
