import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const getBaseApiUrl = (): string => {
  const envApiUrl = Constants.expoConfig?.extra?.apiUrl;
  
  if (envApiUrl && envApiUrl !== 'http://localhost:3000') {
    return envApiUrl;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  } else if (Platform.OS === 'ios') {
    return 'http://localhost:3000';
  } else {
    return 'http://localhost:3000';
  }
};

export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getBaseApiUrl();
  const cleanEndpoint = endpoint.replace(/^\//, '');
  return `${baseUrl}/${cleanEndpoint}`;
};

export const getWebSocketUrl = (): string => {
  const envWsUrl = Constants.expoConfig?.extra?.wsUrl;
  const envWsHost = Constants.expoConfig?.extra?.wsHost;
  
  if (envWsUrl && envWsUrl !== 'ws://localhost:3000') {
    return envWsUrl;
  }
  
  if (envWsHost && envWsHost !== 'localhost:3000') {
    return `ws://${envWsHost}`;
  }

  if (Platform.OS === 'android') {
    return 'ws://10.0.2.2:3000';
  } else if (Platform.OS === 'ios') {
    return 'ws://localhost:3000';
  } else {
    return 'ws://localhost:3000';
  }
}; 