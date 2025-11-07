/* eslint-disable @typescript-eslint/no-require-imports */
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs', 'mjs');

config.resolver.extraNodeModules = {
  tslib: path.resolve(__dirname, 'node_modules/tslib/tslib.es6.js'),
};

module.exports = config;
