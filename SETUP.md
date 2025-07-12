# 🚀 Guía de Configuración e Inicio del Proyecto

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior)
- **npm** o **yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **Android Studio** (para desarrollo Android)
- **Xcode** (para desarrollo iOS, solo macOS)

## 🔧 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/MarkJrRomero/monitoreo-iot-app.git
cd monitoreo-iot-app
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# Para Android Emulator
API_URL=http://10.0.2.2:3000
WS_HOST=10.0.2.2:3000
WS_URL=ws://10.0.2.2:3000

# Para iOS Simulator
# API_URL=http://localhost:3000
# WS_HOST=localhost:3000
# WS_URL=ws://localhost:3000

# Para Web
# API_URL=http://localhost:3000
# WS_HOST=localhost:3000
# WS_URL=ws://localhost:3000
```

### 4. Verificar Configuración

```bash
npm run check-env
```

## 🏃‍♂️ Iniciar el Proyecto

### Opción 1: Inicio General

```bash
npm start
```

Esto abrirá Expo DevTools en tu navegador.

### Opción 2: Plataforma Específica

#### Android

```bash
npm run android
```

#### iOS

```bash
npm run ios
```

#### Web

```bash
npm run web
```

## 📱 Configuración por Plataforma

### Android Emulator

1. Abre Android Studio
2. Inicia el AVD Manager
3. Crea o inicia un emulador
4. Ejecuta: `npm run android`

### iOS Simulator (solo macOS)

1. Instala Xcode desde App Store
2. Abre Xcode y acepta los términos
3. Ejecuta: `npm run ios`

### Web

1. Asegúrate de tener un navegador moderno
2. Ejecuta: `npm run web`

## 🔐 Credenciales de Prueba

El proyecto incluye credenciales de prueba:

### Admin

- **Email**: `admin@test.com`
- **Password**: `admin123`

### Usuario

- **Email**: `user@test.com`
- **Password**: `user123`

## 🛠️ Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia el servidor de desarrollo |
| `npm run android` | Ejecuta en Android |
| `npm run ios` | Ejecuta en iOS |
| `npm run web` | Ejecuta en Web |
| `npm run check-env` | Verifica variables de entorno |
| `npm run lint` | Ejecuta el linter |
| `npm run reset-project` | Resetea el proyecto |

## 🔧 Solución de Problemas

### Error de Dependencias

```bash
rm -rf node_modules
npm install
```

### Error de Cache

```bash
npx expo start --clear
```

### Error de Variables de Entorno

```bash
npm run check-env
```

### Error de Metro

```bash
npx expo start --reset-cache
```

## 📊 Estructura del Proyecto

```
monitoreo-iot-app/
├── app/                    # Páginas de la aplicación
├── components/             # Componentes reutilizables
├── config/                 # Configuración (API, WebSocket)
├── contexts/               # Contextos de React
├── hooks/                  # Hooks personalizados
├── models/                 # Tipos y interfaces
├── scripts/                # Scripts de utilidad
└── assets/                 # Recursos estáticos
```

## 🌐 Configuración del Servidor

### Desarrollo Local

- **API**: `http://localhost:3000`
- **WebSocket**: `ws://localhost:3000`

### Android Emulator

- **API**: `http://10.0.2.2:3000`
- **WebSocket**: `ws://10.0.2.2:3000`

### iOS Simulator

- **API**: `http://localhost:3000`
- **WebSocket**: `ws://localhost:3000`

## 🚨 Notas Importantes

1. **Variables de Entorno**: Siempre verifica con `npm run check-env`
2. **Emulador Android**: Usa `10.0.2.2` en lugar de `localhost`
3. **iOS Simulator**: Usa `localhost` normalmente
4. **Web**: Usa `localhost` normalmente
5. **Producción**: Cambia las URLs según tu servidor

## 📞 Soporte

Si encuentras problemas:

1. Verifica la configuración con `npm run check-env`
2. Revisa los logs en la consola
3. Asegúrate de que el servidor backend esté ejecutándose
4. Verifica que las variables de entorno sean correctas

## 🎯 Próximos Pasos

1. Configura tu servidor backend
2. Ajusta las variables de entorno según tu entorno
3. Prueba la conexión WebSocket
4. Verifica que las estadísticas se carguen correctamente
5. Prueba el pull-to-refresh en diferentes plataformas
