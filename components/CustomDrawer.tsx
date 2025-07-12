import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import React from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';

interface CustomDrawerProps {
  props: any;
}

export const CustomDrawer: React.FC<CustomDrawerProps> = ({ props }) => {
  const { usuario, logout } = useAuthContext();

  const handleLogout = () => {
    console.log('handleLogout llamado');
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            console.log('Confirmando logout...');
            try {
              await logout();
              console.log('Logout completado desde CustomDrawer');
            } catch (error) {
              console.error('Error en logout desde CustomDrawer:', error);
              Alert.alert('Error', 'No se pudo cerrar la sesión');
            }
          },
        },
      ]
    );
  };

  const getUserName = () => {
    if (!usuario) return 'Usuario';
    return `${usuario.nombre}`;
  };

  const getUserEmail = () => {
    if (!usuario) return '';
    return usuario.correo || usuario.email || '';
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props}>
        {/* Header del drawer */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getUserName().charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{getUserName()}</Text>
              <Text style={styles.userEmail}>{getUserEmail()}</Text>
            </View>
          </View>
        </View>

        {/* Elementos del drawer */}
        <DrawerItemList {...props} />

        {/* Separador */}
        <View style={styles.separator} />

        {/* Botón de logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </DrawerContentScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 10,
  },
  logoutButton: {
    padding: 15,
    marginHorizontal: 10,
    marginTop: 10,
    backgroundColor: '#ff3b30',
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 