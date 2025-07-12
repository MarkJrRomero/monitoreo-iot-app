import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';
import HomeScreen from '.';
import { CustomDrawer } from '../../components/CustomDrawer';



const Drawer = createDrawerNavigator();

export default function DrawerLayout() {
  const colorScheme = useColorScheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer props={props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
        },
        headerTintColor: Colors[colorScheme ?? 'light'].text,
        drawerActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        drawerInactiveTintColor: Colors[colorScheme ?? 'light'].text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Drawer.Screen
        name="index"
        component={HomeScreen}
        options={{
          title: 'Inicio',
          drawerIcon: ({ color, size }) => (
            <IconSymbol name="house.fill" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
} 