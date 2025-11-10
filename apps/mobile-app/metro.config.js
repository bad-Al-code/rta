/* eslint-disable @typescript-eslint/no-require-imports */
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs', 'mjs');

// Ensure proper module resolution
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
