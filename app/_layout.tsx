import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { LoadingScreen } from '../components/LoadingScreen';
import { AuthProvider, useAuthContext } from '../contexts/AuthContext';

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuthContext();
  const [forceUpdate, setForceUpdate] = useState(0);

  console.log('RootLayoutNav - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  // Forzar re-renderización cuando cambie el estado de autenticación
  useEffect(() => {
    if (!isLoading) {
      setForceUpdate(prev => prev + 1);
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    console.log('Mostrando LoadingScreen');
    return <LoadingScreen />;
  }

  console.log('Renderizando Stack - isAuthenticated:', isAuthenticated, 'forceUpdate:', forceUpdate);
  return (
    <Stack screenOptions={{ headerShown: false }} key={forceUpdate}>
      {isAuthenticated ? (
        <Stack.Screen 
          name="(drawer)" 
          options={{ headerShown: false }}
        />
      ) : (
        <Stack.Screen 
          name="login" 
          options={{ headerShown: false }}
        />
      )}
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Crear una instancia de QueryClient
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        staleTime: 1000 * 60 * 5, // 5 minutos
      },
    },
  });

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
