import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const getWebSocketConfig = () => {
  const configWsHost = Constants.expoConfig?.extra?.wsHost;
  const configWsUrl = Constants.expoConfig?.extra?.wsUrl;
  
  if (configWsUrl) {
    return {
      host: configWsHost || 'localhost:3000',
      url: configWsUrl
    };
  }
  
  if (configWsHost) {
    return {
      host: configWsHost,
      url: `ws://${configWsHost}`
    };
  }

  let defaultHost: string;
  
  if (__DEV__) {
    if (Platform.OS === 'android') {
      defaultHost = '10.0.2.2:3000';
    } else if (Platform.OS === 'ios') {
      defaultHost = 'localhost:3000';
    } else {
      defaultHost = 'localhost:3000';
    }
  } else {
    defaultHost = 'tu-servidor-produccion.com:3000';
  }

  return {
    host: defaultHost,
    url: `ws://${defaultHost}`
  };
};

export const buildWebSocketUrl = (token: string) => {
  const config = getWebSocketConfig();
  return `${config.url}?token=${token}`;
}; 