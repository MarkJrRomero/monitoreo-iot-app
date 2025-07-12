const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Agregar soporte para gesture handler
config.resolver.sourceExts.push('cjs');

module.exports = config; 