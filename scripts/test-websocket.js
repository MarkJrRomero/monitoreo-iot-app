const WebSocket = require('ws');

// Configuración de prueba
const WS_URL = 'ws://192.168.1:3000';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjAsImNvcnJlbyI6ImNhcmxvcy5sb3BlekBlbXByZXNhLmNvbSIsInJvbCI6ImVzdGFuZGFyIiwiZXhwIjoxNzUyNDQ1Mzc0NzkyfQ.MIy7KUvKRqvzrEmXio5Ufhq6PtkdpPzTcPahvYTbi0w';

console.log('🧪 Probando conexión WebSocket...');
console.log(`URL: ${WS_URL}`);
console.log(`Token: ${TOKEN.substring(0, 20)}...`);

let connectionAttempts = 0;
const maxAttempts = 3;

function testWebSocketConnection() {
  if (connectionAttempts >= maxAttempts) {
    console.log('❌ Máximo número de intentos alcanzado');
    return;
  }

  connectionAttempts++;
  console.log(`\n🔄 Intento ${connectionAttempts}/${maxAttempts}`);

  const wsUrl = `${WS_URL}?token=${TOKEN}`;
  const ws = new WebSocket(wsUrl);

  const timeout = setTimeout(() => {
    console.log('⏰ Timeout de conexión');
    ws.close();
  }, 10000);

  ws.on('open', () => {
    console.log('✅ WebSocket conectado exitosamente');
    clearTimeout(timeout);
    
    // Enviar mensaje de prueba
    const testMessage = { type: 'ping' };
    ws.send(JSON.stringify(testMessage));
    
    // Cerrar después de 5 segundos
    setTimeout(() => {
      console.log('🔌 Cerrando conexión de prueba');
      ws.close();
    }, 5000);
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Mensaje recibido:', message);
    } catch (error) {
      console.log('📨 Mensaje recibido (raw):', data.toString());
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`🔌 WebSocket cerrado: ${code} - ${reason}`);
    clearTimeout(timeout);
  });

  ws.on('error', (error) => {
    console.log('❌ Error en WebSocket:', error.message);
    clearTimeout(timeout);
  });
}

// Ejecutar prueba
testWebSocketConnection();

console.log('\n📊 Monitoreo de conexión iniciado...');
console.log('Presiona Ctrl+C para detener'); 