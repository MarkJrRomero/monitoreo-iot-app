#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de variables de entorno...\n');

const envFile = path.join(__dirname, '..', '.env');
const envExists = fs.existsSync(envFile);

if (envExists) {
  console.log('✅ Archivo .env encontrado');
  const envContent = fs.readFileSync(envFile, 'utf8');
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  console.log('\n📋 Variables configuradas:');
  lines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      console.log(`  ${key}=${value}`);
    }
  });
} else {
  console.log('⚠️  Archivo .env no encontrado');
  console.log('💡 Crea un archivo .env en la raíz del proyecto con las siguientes variables:');
  console.log('   API_URL=http://192.168.1:3000');
  console.log('   WS_HOST=192.168.1:3000');
  console.log('   WS_URL=ws://192.168.1:3000');
}

console.log('\n📖 Para más información, consulta ENV_VARIABLES.md');
console.log('\n🎯 Valores por defecto configurados en app.config.js:');
console.log('   API_URL: http://192.168.1:3000');
console.log('   WS_HOST: 192.168.1:3000');
console.log('   WS_URL: ws://192.168.1:3000'); 