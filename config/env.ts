import Constants from 'expo-constants';

interface EnvConfig {
  API_URL: string;
  WS_URL: string;
  WS_HOST: string;
}

export const env: EnvConfig = {
  API_URL: Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000',
  WS_URL: Constants.expoConfig?.extra?.wsUrl || 'ws://localhost:3000',
  WS_HOST: Constants.expoConfig?.extra?.wsHost || 'localhost:3000',
};

export const validateEnv = () => {
  const requiredVars = ['API_URL', 'WS_URL', 'WS_HOST'];
  const missingVars = requiredVars.filter(varName => !env[varName as keyof typeof env]);
  
  if (missingVars.length > 0) {
    console.warn('Missing environment variables:', missingVars);
  }
};

validateEnv();

export const getApiUrl = (endpoint: string): string => {
  const baseUrl = env.API_URL.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  return `${baseUrl}/${cleanEndpoint}`;
};
  